<template>
  <main class="page-gray-bg">
    <header class="welcome-band">
      <h2 class="welcome-title">Bienvenido Administrador {{ superAdminName }}</h2>
    </header>

    <section class="info-band">
      <p class="info-text">A continuación se muestran los administradores registrados por usted:</p>

      <div class="info-actions">
        <button class="btn-pill btn-pill-light" type="button" @click="openAdd">
          Agregar nuevo admin
        </button>
        <button class="btn-pill btn-pill-light" type="button" @click="openActivate">
          Activar admin
        </button>
      </div>
    </section>

    <section class="shell">
      <p v-if="loadingAdmins" class="empty">Cargando administradores...</p>
      <p v-else-if="pageError" class="empty">{{ pageError }}</p>

      <template v-else>
        <div v-if="admins.length" class="table-head">
          <div class="th">Cédula</div>
          <div class="th">Nombres</div>
          <div class="th">Apellidos</div>
          <div class="th">Email</div>
          <div class="th"></div>
        </div>

        <article v-for="a in admins" :key="a.id" class="admin-item">
          <div class="card-table">
            <input class="cell-input" type="text" disabled :value="a.cedula" placeholder="Cédula" />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== a.id || busy.updateAdminId === a.id"
              v-model.trim="editNombreMap[a.id]"
              placeholder="Nombres"
            />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== a.id || busy.updateAdminId === a.id"
              v-model.trim="editApellidoMap[a.id]"
              placeholder="Apellidos"
            />

            <input class="cell-input" type="email" disabled :value="a.email" />

            <button
              class="chev-btn"
              type="button"
              @click="toggleExpand(a.id)"
              aria-label="Expandir"
              :disabled="busy.updateAdminId === a.id || busy.resendEmailId === a.id"
            >
              <span v-if="expandedId === a.id">˄</span>
              <span v-else>˅</span>
            </button>

            <div v-if="expandedId === a.id" class="actions-row">
              <button
                class="btn-pill"
                type="button"
                @click="toggleEdit(a)"
                :disabled="busy.updateAdminId === a.id"
              >
                {{
                  busy.updateAdminId === a.id
                    ? 'Guardando...'
                    : editingId === a.id
                      ? 'Guardar'
                      : 'Editar'
                }}
              </button>

              <button
                class="btn-pill"
                type="button"
                @click="resendEmailRow(a)"
                :disabled="busy.resendEmailId === a.id"
              >
                {{ busy.resendEmailId === a.id ? 'Enviando...' : 'Reenviar correo' }}
              </button>

              <button
                class="btn-pill"
                type="button"
                @click="deactivateAdminRow(a)"
                :disabled="busy.deactivateAdminId === a.id"
              >
                {{ busy.deactivateAdminId === a.id ? 'Desactivando...' : 'Desactivar' }}
              </button>

              <button class="btn-pill" type="button" @click="openDelete(a)">Eliminar</button>
            </div>
          </div>

          <p v-if="rowErrors[a.id]" class="row-error">{{ rowErrors[a.id] }}</p>
          <p v-if="rowNotices[a.id]" class="row-notice">{{ rowNotices[a.id] }}</p>
        </article>

        <p v-if="admins.length === 0" class="empty">No hay administradores registrados.</p>
      </template>
    </section>

    <div v-if="addOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeAdd"
          :disabled="busy.addAdmin"
        >
          ×
        </button>

        <form class="modal-body" ref="addFormEl" @submit.prevent="addAdmin">
          <input
            class="modal-input"
            type="text"
            placeholder="Cédula"
            inputmode="numeric"
            maxlength="10"
            v-model.trim="addForm.cedula"
            required
            :disabled="busy.addAdmin"
            @input="addForm.cedula = sanitizeDigits(addForm.cedula).slice(0, 10)"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Nombres"
            v-model.trim="addForm.nombre"
            required
            :disabled="busy.addAdmin"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Apellidos"
            v-model.trim="addForm.apellido"
            required
            :disabled="busy.addAdmin"
          />
          <input
            class="modal-input"
            type="email"
            placeholder="Email"
            v-model.trim="addForm.email"
            required
            autocomplete="email"
            :disabled="busy.addAdmin"
          />

          <p v-if="addError" class="modal-error">{{ addError }}</p>

          <button class="btn-pill" type="submit" :disabled="busy.addAdmin">
            {{ busy.addAdmin ? 'Registrando...' : 'Agregar administrador' }}
          </button>
        </form>
      </div>
    </div>

    <div v-if="deleteOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeDelete"
          :disabled="busy.deleteAdmin"
        >
          ×
        </button>

        <div class="modal-body">
          <template v-if="tutorCountForDelete > 0">
            <p class="modal-text">
              Debe reasignar los {{ tutorCountForDelete }} tutor(es) asignados a este administrador
              antes de eliminarlo.
            </p>

            <select class="modal-select" v-model="reassignToId" :disabled="busy.deleteAdmin">
              <option disabled value="">Seleccione un administrador</option>
              <option v-for="x in reassignOptions" :key="x.id" :value="x.id">
                {{ x.nombre }} {{ x.apellido }}
              </option>
            </select>

            <p class="modal-text">
              ¿Está seguro de que quiere eliminar el administrador y reasignar los tutores?
            </p>
          </template>

          <template v-else-if="tutorCountForDelete === 0">
            <p class="modal-text">¿Está seguro de que quiere eliminar este administrador?</p>
          </template>

          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>

          <div class="modal-actions">
            <button
              class="btn-pill"
              type="button"
              @click="closeDelete"
              :disabled="busy.deleteAdmin"
            >
              Cancelar
            </button>
            <button
              class="btn-pill"
              type="button"
              @click="confirmDelete"
              :disabled="busy.deleteAdmin"
            >
              {{ busy.deleteAdmin ? 'Eliminando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    <div v-if="activateOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeActivate"
          :disabled="busy.activateAdmin"
        >
          ×
        </button>

        <form class="modal-body" @submit.prevent="confirmActivate">
          <p class="modal-text">Ingrese la cédula del administrador que desea activar:</p>

          <input
            class="modal-input"
            type="text"
            placeholder="Cédula"
            inputmode="numeric"
            maxlength="10"
            v-model.trim="activateCedula"
            :disabled="busy.activateAdmin"
            @input="activateCedula = sanitizeDigits(activateCedula).slice(0, 10)"
          />

          <p v-if="activateError" class="modal-error">{{ activateError }}</p>

          <button class="btn-pill" type="submit" :disabled="busy.activateAdmin">
            {{ busy.activateAdmin ? 'Activando...' : 'Activar administrador' }}
          </button>
        </form>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  createAdmin as createAdminApi,
  listMyAdmins,
  updateAdmin as updateAdminApi,
  deactivateAdmin as deactivateAdminApi,
  hardDeleteAdmin as hardDeleteAdminApi,
  activateAdminByIdCard,
  getTutorCountByAdminId,
  resendAdminEmail,
} from '../helpers/superAdminHelper'
import { useScrollLock } from '../helpers/useScrollLock'

function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null) return v
  }
  return fallback
}

function sanitizeDigits(v) {
  return String(v ?? '').replace(/[^\d]/g, '')
}

function mapAdminDto(dto) {
  return {
    id: pick(dto, ['id', 'userId', 'adminId'], null),
    cedula: pick(dto, ['idCard', 'cedula'], ''),
    nombre: pick(dto, ['name', 'nombre'], ''),
    apellido: pick(dto, ['lastName', 'apellido'], ''),
    email: pick(dto, ['email'], ''),
  }
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim())
}

const auth = ref(readAuth())
const superAdminName = ref('Administrador')

const admins = ref([])
const loadingAdmins = ref(false)
const pageError = ref('')

const rowErrors = reactive({})
const rowNotices = reactive({})
const editingId = ref(null)
const expandedId = ref(null)
const editNombreMap = reactive({})
const editApellidoMap = reactive({})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

const busy = reactive({
  addAdmin: false,
  updateAdminId: null,
  resendEmailId: null,
  deleteAdmin: false,
  deactivateAdminId: null,
  activateAdmin: false,
})

function hydrateEditMaps(list) {
  for (const a of list) {
    editNombreMap[a.id] = a.nombre ?? ''
    editApellidoMap[a.id] = a.apellido ?? ''
    rowErrors[a.id] = ''
  }
}

async function loadAdmins() {
  pageError.value = ''
  try {
    loadingAdmins.value = true
    const list = await listMyAdmins()
    const mapped = (list ?? []).map(mapAdminDto)
    admins.value = mapped
    hydrateEditMaps(mapped)
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudieron cargar los administradores.'
    admins.value = []
  } finally {
    loadingAdmins.value = false
  }
}

async function toggleEdit(a) {
  rowErrors[a.id] = ''

  if (editingId.value !== a.id) {
    editingId.value = a.id
    editNombreMap[a.id] = a.nombre ?? ''
    editApellidoMap[a.id] = a.apellido ?? ''
    return
  }

  const nombre = String(editNombreMap[a.id] ?? '').trim()
  const apellido = String(editApellidoMap[a.id] ?? '').trim()

  if (!nombre || !apellido) {
    rowErrors[a.id] = 'Debe completar todos los campos.'
    return
  }

  try {
    busy.updateAdminId = a.id

    const payload = {
      name: nombre,
      lastName: apellido,
    }

    const updatedDto = await updateAdminApi(a.id, payload)
    const updated = mapAdminDto(updatedDto)

    const idx = admins.value.findIndex((x) => x.id === a.id)
    if (idx !== -1) admins.value[idx] = { ...admins.value[idx], ...updated }

    editingId.value = null
  } catch (e) {
    rowErrors[a.id] = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.updateAdminId = null
  }
}

const addOpen = ref(false)
const addError = ref('')
const addForm = reactive({
  cedula: '',
  nombre: '',
  apellido: '',
  email: '',
})
const addFormEl = ref(null)

function openAdd() {
  addError.value = ''
  addForm.cedula = ''
  addForm.nombre = ''
  addForm.apellido = ''
  addForm.email = ''
  addOpen.value = true
}

function closeAdd() {
  addOpen.value = false
}

async function addAdmin() {
  if (busy.addAdmin) return

  addError.value = ''

  const form = addFormEl.value
  if (form && typeof form.reportValidity === 'function') {
    const ok = form.reportValidity()
    if (!ok) return
  }

  const nombre = String(addForm.nombre ?? '').trim()
  const apellido = String(addForm.apellido ?? '').trim()
  const cedula = sanitizeDigits(addForm.cedula).slice(0, 10)
  const email = String(addForm.email ?? '')
    .trim()
    .toLowerCase()

  if (!cedula || !nombre || !apellido || !email) {
    addError.value = 'Debe completar todos los campos.'
    return
  }

  if (cedula.length !== 10) {
    addError.value = 'La cédula debe tener 10 dígitos.'
    return
  }

  if (!isValidEmail(email)) {
    addError.value = 'El email no es válido.'
    return
  }

  try {
    busy.addAdmin = true

    const payload = {
      idCard: cedula,
      name: nombre,
      lastName: apellido,
      email,
    }

    const createdDto = await createAdminApi(payload)
    const created = mapAdminDto(createdDto)

    admins.value.push(created)
    hydrateEditMaps([created])
    addOpen.value = false
  } catch (e) {
    addError.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.addAdmin = false
  }
}

const deleteOpen = ref(false)
const deleteError = ref('')
const deletingAdminId = ref(null)
const reassignToId = ref('')
const tutorCountForDelete = ref(0)
const loadingTutorCount = ref(false)

const reassignOptions = computed(() => admins.value.filter((x) => x.id !== deletingAdminId.value))

async function openDelete(a) {
  deleteError.value = ''
  deletingAdminId.value = a.id
  reassignToId.value = ''
  tutorCountForDelete.value = 0
  deleteOpen.value = true

  try {
    loadingTutorCount.value = true
    tutorCountForDelete.value = await getTutorCountByAdminId(a.id)
  } catch (e) {
    tutorCountForDelete.value = 0
  } finally {
    loadingTutorCount.value = false
  }
}

function closeDelete() {
  deleteOpen.value = false
  deletingAdminId.value = null
  reassignToId.value = ''
  deleteError.value = ''
}

async function confirmDelete() {
  deleteError.value = ''

  const idToDelete = deletingAdminId.value
  if (!idToDelete) return

  if (tutorCountForDelete.value > 0) {
    if (reassignOptions.value.length === 0) {
      deleteError.value = 'No puedes eliminar el único administrador existente.'
      return
    }
    if (!reassignToId.value) {
      deleteError.value = 'Debe seleccionar un administrador para reasignar los tutores.'
      return
    }
  }

  try {
    busy.deleteAdmin = true

    if (tutorCountForDelete.value > 0) {
      await hardDeleteAdminApi(idToDelete, reassignToId.value)
    } else {
      await hardDeleteAdminApi(idToDelete, null)
    }

    admins.value = admins.value.filter((x) => x.id !== idToDelete)

    delete editNombreMap[idToDelete]
    delete editApellidoMap[idToDelete]
    delete rowErrors[idToDelete]

    if (editingId.value === idToDelete) editingId.value = null

    closeDelete()
  } catch (e) {
    deleteError.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.deleteAdmin = false
  }
}

async function resendEmailRow(a) {
  if (busy.resendEmailId === a.id) return
  rowErrors[a.id] = ''
  rowNotices[a.id] = ''

  try {
    busy.resendEmailId = a.id
    await resendAdminEmail(a.id)
    rowNotices[a.id] = 'Correo reenviado con una nueva contraseña.'
  } catch (e) {
    rowErrors[a.id] = e?.response?.data || 'No se pudo reenviar el correo.'
  } finally {
    busy.resendEmailId = null
  }
}

async function deactivateAdminRow(a) {
  if (busy.deactivateAdminId === a.id) return
  rowErrors[a.id] = ''

  try {
    busy.deactivateAdminId = a.id
    await deactivateAdminApi(a.id)

    admins.value = admins.value.filter((x) => x.id !== a.id)
    delete editNombreMap[a.id]
    delete editApellidoMap[a.id]
    delete rowErrors[a.id]
    if (editingId.value === a.id) editingId.value = null
  } catch (e) {
    rowErrors[a.id] = e?.response?.data || 'No se pudo desactivar el administrador.'
  } finally {
    busy.deactivateAdminId = null
  }
}

const activateOpen = ref(false)
const activateError = ref('')
const activateCedula = ref('')

function openActivate() {
  activateError.value = ''
  activateCedula.value = ''
  activateOpen.value = true
}

function closeActivate() {
  activateOpen.value = false
}

async function confirmActivate() {
  const ced = String(activateCedula.value ?? '').trim()
  if (!ced) {
    activateError.value = 'Debe ingresar la cédula.'
    return
  }
  if (busy.activateAdmin) return

  try {
    busy.activateAdmin = true
    const dto = await activateAdminByIdCard(ced)
    const mapped = mapAdminDto(dto)
    admins.value.push(mapped)
    hydrateEditMaps([mapped])
    closeActivate()
  } catch (e) {
    activateError.value = e?.response?.data || 'No se pudo activar el administrador.'
  } finally {
    busy.activateAdmin = false
  }
}

const anyModalOpen = computed(() => addOpen.value || deleteOpen.value || activateOpen.value)

useScrollLock(() => anyModalOpen.value)

function closeAllModals() {
  addOpen.value = false
  deleteOpen.value = false
  activateOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') closeAllModals()
}

onMounted(async () => {
  auth.value = readAuth()
  superAdminName.value =
    `${auth.value?.name ?? ''} ${auth.value?.lastName ?? ''}`.trim() || 'Administrador'

  document.addEventListener('keydown', onKeydown)
  await loadAdmins()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
/* Específicos de SuperAdmin */

/* Solo el layout de columnas es propio (Cédula, Nombres, Apellidos, Email, chevron).
   Todo el diseño visual (fondo, radios, padding, celdas, chevron) es el compartido,
   idéntico al de la vista de Administrador. */
.table-head,
.card-table {
  grid-template-columns: 120px 1fr 1fr 1.6fr 44px;
}

.admin-item {
  margin: 0 0 12px;
}

/* Acciones a lo ancho de toda la fila, debajo de los datos (se muestran al desplegar) */
.actions-row {
  grid-column: 1 / -1;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  justify-content: space-between;
}

.actions-row .btn-pill {
  flex: 1 1 auto;
}

.info-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.btn-pill-light {
  background: #ffffff;
  color: #004671;
  border: 1px solid #ffffff;
  border-radius: 8px;
  padding: 10px 20px;
  font-weight: 600;
}

.btn-pill-light:hover {
  background: #f0f0f0;
}

/* Modal específico */
.modal-select {
  width: 100%;
  height: 40px;
  border-radius: 8px;
  border: 1px solid #cccccc;
  padding: 0 10px;
  background: #ffffff;
  font-size: 14px;
}

/* Responsive específico */
@media (max-width: 900px) {
  .table-head {
    display: none;
  }

  .card-table {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 12px;
  }

  .cell-input {
    width: 100%;
    text-align: left;
  }

  .chev-btn {
    justify-self: end;
  }

  .actions-row {
    width: 100%;
    justify-content: stretch;
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px solid #eeeeee;
  }

  .btn-pill {
    flex: 1;
  }
}

@media (max-width: 600px) {
  .welcome-title {
    font-size: 20px;
    line-height: 1.35;
  }

  .shell {
    padding: 18px 12px 26px;
  }
}
</style>
