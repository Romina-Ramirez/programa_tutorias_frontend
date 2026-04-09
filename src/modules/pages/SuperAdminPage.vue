<template>
  <main class="page-gray-bg">
    <header class="welcome-band">
      <h2 class="welcome-title">Bienvenido Administrador {{ superAdminName }}</h2>
    </header>

    <section class="info-band">
      <p class="info-text">A continuación se muestran los administradores registrados por usted:</p>

      <button class="btn-pill btn-pill-light" type="button" @click="openAdd">
        Agregar nuevo admin
      </button>
    </section>

    <section class="shell">
      <p v-if="loadingAdmins" class="empty">Cargando administradores...</p>
      <p v-else-if="pageError" class="empty">{{ pageError }}</p>

      <template v-else>
        <div v-if="admins.length" class="table-head">
          <div class="th">Nombre</div>
          <div class="th">Apellido</div>
          <div class="th">Email</div>
          <div class="th"></div>
        </div>

        <article v-for="a in admins" :key="a.id" class="admin-item">
          <div class="card-table">
            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== a.id || busy.updateAdminId === a.id"
              v-model.trim="editNombreMap[a.id]"
              placeholder="Nombre"
            />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== a.id || busy.updateAdminId === a.id"
              v-model.trim="editApellidoMap[a.id]"
              placeholder="Apellido"
            />

            <input class="cell-input" type="email" disabled :value="a.email" />

            <div class="actions-row">
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

              <button class="btn-pill" type="button" @click="openDelete(a)">Eliminar</button>
            </div>
          </div>

          <p v-if="rowErrors[a.id]" class="row-error">{{ rowErrors[a.id] }}</p>
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
            placeholder="Nombre"
            v-model.trim="addForm.nombre"
            required
            :disabled="busy.addAdmin"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Apellido"
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
          <p class="modal-text">
            Debe asignar un nuevo administrador a los tutores que están asignados al que desea
            eliminar.
          </p>

          <select class="modal-select" v-model="reassignToId" :disabled="busy.deleteAdmin">
            <option disabled value="">Seleccione un administrador</option>
            <option v-for="x in reassignOptions" :key="x.id" :value="x.id">
              {{ x.nombre }} {{ x.apellido }}
            </option>
          </select>

          <p class="modal-text">
            ¿Está seguro de que quiere eliminar el administrador y reasignar los tutores a uno
            nuevo?
          </p>

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
  </main>
</template>

<script setup>
import { computed, reactive, ref, onMounted, onBeforeUnmount } from 'vue'
import {
  createAdmin as createAdminApi,
  listMyAdmins,
  updateAdmin as updateAdminApi,
  deleteAdmin as deleteAdminApi,
} from '../helpers/superAdminHelper'

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

function mapAdminDto(dto) {
  return {
    id: pick(dto, ['id', 'userId', 'adminId'], null),
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
const editingId = ref(null)
const editNombreMap = reactive({})
const editApellidoMap = reactive({})

const busy = reactive({
  addAdmin: false,
  updateAdminId: null,
  deleteAdmin: false,
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
  nombre: '',
  apellido: '',
  email: '',
})
const addFormEl = ref(null)

function openAdd() {
  addError.value = ''
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
  const email = String(addForm.email ?? '')
    .trim()
    .toLowerCase()

  if (!isValidEmail(email)) {
    addError.value = 'El email no es válido.'
    return
  }

  try {
    busy.addAdmin = true

    const payload = {
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

const reassignOptions = computed(() => admins.value.filter((x) => x.id !== deletingAdminId.value))

function openDelete(a) {
  deleteError.value = ''
  deletingAdminId.value = a.id
  reassignToId.value = ''
  deleteOpen.value = true
}

function closeDelete() {
  deleteOpen.value = false
  deletingAdminId.value = null
  reassignToId.value = ''
  deleteError.value = ''
}

async function confirmDelete() {
  deleteError.value = ''

  if (reassignOptions.value.length === 0) {
    deleteError.value = 'No puedes eliminar el único administrador existente.'
    return
  }

  if (!reassignToId.value) {
    deleteError.value = 'Debe seleccionar un administrador para reasignar.'
    return
  }

  const idToDelete = deletingAdminId.value
  if (!idToDelete) return

  try {
    busy.deleteAdmin = true

    await deleteAdminApi(idToDelete, reassignToId.value)

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

function closeAllModals() {
  addOpen.value = false
  deleteOpen.value = false
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
.table-head {
  grid-template-columns: 1fr 1fr 1fr 280px;
}

.admin-item {
  margin-bottom: 22px;
}

.card-table {
  grid-template-columns: 1fr 1fr 1fr 280px;
}

.actions-row {
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
}

.btn-pill:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.row-error {
  margin: 10px 0 0;
  font-weight: 700;
  color: #b00020;
  text-align: left;
}
</style>
