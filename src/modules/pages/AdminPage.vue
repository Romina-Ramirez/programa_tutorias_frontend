<template>
  <main class="page-gray-bg">
    <header class="welcome-band">
      <h2 class="welcome-title">Bienvenido Administrador {{ adminName }}</h2>
    </header>

    <section class="info-band">
      <p class="info-text">A continuación se muestran los tutores registrados por usted:</p>

      <button class="btn-pill btn-pill-light" type="button" @click="openAddTutor">
        Agregar nuevo tutor
      </button>
    </section>

    <section class="shell">
      <p v-if="loadingTutors" class="empty">Cargando tutores...</p>
      <p v-else-if="pageError" class="empty">{{ pageError }}</p>

      <template v-else>
        <div v-if="tutors.length" class="table-head">
          <div class="th">Nombre</div>
          <div class="th">Apellido</div>
          <div class="th">Email</div>
          <div class="th">Teléfono</div>
          <div class="th">Carrera</div>
          <div class="th"></div>
        </div>

        <article v-for="t in tutors" :key="t.id" class="tutor-item">
          <div class="card-table">
            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].nombre"
              placeholder="Nombre"
            />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].apellido"
              placeholder="Apellido"
            />

            <input class="cell-input" type="email" disabled :value="t.email" />

            <input
              class="cell-input"
              type="text"
              inputmode="numeric"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].telefono"
              @input="onPhoneInput(t.id)"
              placeholder="Teléfono"
            />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].carrera"
              placeholder="Carrera"
            />

            <button
              class="chev-btn"
              type="button"
              @click="toggleExpand(t.id)"
              aria-label="Expandir"
              :disabled="busy.updateTutorId === t.id || busy.activateTutorId === t.id"
            >
              <span v-if="expandedId === t.id">˄</span>
              <span v-else>˅</span>
            </button>
          </div>

          <div v-if="expandedId === t.id" class="actions-row">
            <button
              class="btn-pill"
              type="button"
              @click="toggleEdit(t)"
              :disabled="busy.updateTutorId === t.id"
            >
              {{
                busy.updateTutorId === t.id
                  ? 'Guardando...'
                  : editingId === t.id
                    ? 'Guardar'
                    : 'Editar'
              }}
            </button>

            <button class="btn-pill" type="button" @click="openDeleteTutor(t)">Eliminar</button>

            <button class="btn-pill" type="button" @click="openCourses(t)">
              Visualizar cursos activos
            </button>

            <button
              class="btn-pill"
              type="button"
              @click="openReport(t)"
              :disabled="busy.loadReport"
            >
              {{ busy.loadReport ? 'Cargando...' : 'Visualizar reporte' }}
            </button>

            <button
              v-if="!t.activo"
              class="btn-pill"
              type="button"
              @click="sendVerificationEmail(t)"
              :disabled="busy.activateTutorId === t.id"
            >
              {{ busy.activateTutorId === t.id ? 'Enviando...' : 'Enviar correo de verificación' }}
            </button>
          </div>

          <p v-if="tutorErrors[t.id]" class="row-error">{{ tutorErrors[t.id] }}</p>
        </article>

        <p v-if="tutors.length === 0" class="empty">No hay tutores registrados.</p>
      </template>
    </section>

    <!-- MODAL: Agregar tutor -->
    <div v-if="addTutorOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeAddTutor"
          :disabled="busy.addTutor"
        >
          ×
        </button>

        <div class="modal-body">
          <input
            class="modal-input"
            type="email"
            placeholder="Email"
            v-model.trim="addTutorForm.email"
            :disabled="busy.addTutor"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Nombre"
            v-model.trim="addTutorForm.nombre"
            :disabled="busy.addTutor"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Apellido"
            v-model.trim="addTutorForm.apellido"
            :disabled="busy.addTutor"
          />

          <input
            class="modal-input"
            type="text"
            placeholder="Teléfono"
            inputmode="numeric"
            v-model.trim="addTutorForm.telefono"
            :disabled="busy.addTutor"
            @input="addTutorForm.telefono = sanitizeDigits(addTutorForm.telefono).slice(0, 10)"
          />

          <input
            class="modal-input"
            type="text"
            placeholder="Carrera"
            v-model.trim="addTutorForm.carrera"
            :disabled="busy.addTutor"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Horario Disponible"
            v-model.trim="addTutorForm.horario"
            :disabled="busy.addTutor"
          />

          <p v-if="addTutorError" class="modal-error">{{ addTutorError }}</p>

          <button class="btn-pill" type="button" @click="addTutor" :disabled="busy.addTutor">
            {{ busy.addTutor ? 'Registrando...' : 'Registrar Tutor' }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Eliminar tutor -->
    <div v-if="deleteTutorOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeDeleteTutor"
          :disabled="busy.deleteTutor"
        >
          ×
        </button>

        <div class="modal-body">
          <p class="modal-text">
            ¿Está seguro de que quiere eliminar al tutor/a
            <strong>{{ deletingTutor?.nombre }} {{ deletingTutor?.apellido }}</strong
            >?
          </p>

          <p v-if="deleteTutorError" class="modal-error">{{ deleteTutorError }}</p>

          <div class="modal-actions">
            <button
              class="btn-pill"
              type="button"
              @click="closeDeleteTutor"
              :disabled="busy.deleteTutor"
            >
              Cancelar
            </button>
            <button
              class="btn-pill"
              type="button"
              @click="confirmDeleteTutor"
              :disabled="busy.deleteTutor"
            >
              {{ busy.deleteTutor ? 'Eliminando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Cursos -->
    <div v-if="coursesOpen" class="modal-overlay">
      <div class="modal modal-courses">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeCourses"
          :disabled="busy.loadCourses || busy.saveCourse"
        >
          ×
        </button>

        <div class="courses-head">
          <div class="courses-head-title">
            Tutor: {{ selectedTutor?.nombre }} {{ selectedTutor?.apellido }}
          </div>
          <div class="courses-head-sub">
            Horario disponible: {{ selectedTutor?.horario || '-' }}
          </div>

          <button
            class="btn-pill"
            type="button"
            @click="openCourseForm('create')"
            :disabled="busy.loadCourses"
          >
            {{ busy.loadCourses ? 'Cargando...' : 'Agregar nuevo curso' }}
          </button>
        </div>

        <div class="courses-scroll">
          <p v-if="busy.loadCourses" class="empty">Cargando cursos...</p>
          <p v-else-if="coursesError" class="modal-error">{{ coursesError }}</p>

          <template v-else>
            <article v-for="c in selectedTutorCourses" :key="c.id" class="course-card">
              <div class="course-title">{{ String(c.nombre).toUpperCase() }}</div>

              <div class="course-grid">
                <div class="course-info">
                  <div><span class="b">Fecha de Inicio:</span> {{ c.fechaInicio }}</div>
                  <div><span class="b">Fecha de Fin:</span> {{ c.fechaFin }}</div>
                </div>

                <div class="course-info">
                  <div><span class="b">Materia:</span> {{ c.materia }}</div>
                  <div><span class="b">Horario:</span> {{ c.horario }}</div>
                </div>
              </div>

              <div class="course-actions">
                <button
                  class="btn-pill"
                  type="button"
                  @click="openCourseForm('edit', c)"
                  :disabled="busy.saveCourse"
                >
                  Editar
                </button>

                <button
                  class="btn-pill"
                  type="button"
                  @click="openDeleteCourse(c)"
                  :disabled="busy.deleteCourseId === c.id"
                >
                  {{ busy.deleteCourseId === c.id ? 'Eliminando...' : 'Eliminar' }}
                </button>
              </div>
            </article>

            <p v-if="selectedTutorCourses.length === 0" class="empty">
              Este tutor no tiene cursos.
            </p>
          </template>
        </div>
      </div>
    </div>

    <!-- MODAL: Eliminar curso -->
    <div v-if="deleteCourseOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeDeleteCourse"
          :disabled="busy.deleteCourseId != null"
        >
          ×
        </button>

        <div class="modal-body">
          <p class="modal-text">
            ¿Está seguro de que quiere eliminar el curso
            <strong>{{ deletingCourse?.nombre }}</strong
            >?
          </p>

          <p v-if="deleteCourseError" class="modal-error">{{ deleteCourseError }}</p>

          <div class="modal-actions">
            <button
              class="btn-pill"
              type="button"
              @click="closeDeleteCourse"
              :disabled="busy.deleteCourseId != null"
            >
              Cancelar
            </button>
            <button
              class="btn-pill"
              type="button"
              @click="confirmDeleteCourse"
              :disabled="busy.deleteCourseId != null"
            >
              {{ busy.deleteCourseId != null ? 'Eliminando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- MODAL: Form curso -->
    <div v-if="courseFormOpen" class="modal-overlay">
      <div class="modal modal-course-form">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeCourseForm"
          :disabled="busy.saveCourse"
        >
          ×
        </button>

        <div class="modal-wide-title2">
          Tutor: {{ selectedTutor?.nombre }} {{ selectedTutor?.apellido }}
        </div>

        <div class="modal-wide-subtitle">
          Horario disponible: {{ selectedTutor?.horario || '-' }}
        </div>

        <div class="modal-body modal-body-wide">
          <input
            class="modal-input"
            type="text"
            placeholder="Nombre"
            v-model.trim="courseForm.nombre"
            :disabled="busy.saveCourse"
          />

          <textarea
            class="modal-textarea"
            rows="5"
            placeholder="Descripción"
            v-model.trim="courseForm.descripcion"
            :disabled="busy.saveCourse"
          />

          <input
            class="modal-input"
            type="date"
            v-model="courseForm.fechaInicioIso"
            :min="minSelectableDate"
            :disabled="busy.saveCourse"
          />

          <input
            class="modal-input"
            type="date"
            v-model="courseForm.fechaFinIso"
            :min="courseForm.fechaInicioIso || minSelectableDate"
            :disabled="busy.saveCourse"
          />

          <input
            class="modal-input"
            type="text"
            placeholder="Horario"
            v-model.trim="courseForm.horario"
            :disabled="busy.saveCourse"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Materia"
            v-model.trim="courseForm.materia"
            :disabled="busy.saveCourse"
          />

          <p v-if="courseFormError" class="modal-error">{{ courseFormError }}</p>

          <button class="btn-pill" type="button" @click="saveCourse" :disabled="busy.saveCourse">
            {{
              busy.saveCourse
                ? 'Guardando...'
                : courseFormMode === 'create'
                  ? 'Agregar curso'
                  : 'Guardar cambios'
            }}
          </button>
        </div>
      </div>
    </div>

    <!-- MODAL: Reporte -->
    <div v-if="reportOpen" class="modal-overlay">
      <div class="modal modal-report">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeReport"
          :disabled="busy.loadReport"
        >
          ×
        </button>

        <div class="report-head">
          <div class="report-left">
            <div class="report-title">
              Tutor: {{ selectedTutor?.nombre }} {{ selectedTutor?.apellido }}
            </div>
            <div class="report-meta">Carrera: {{ selectedTutor?.carrera }}</div>
            <div class="report-meta">Horas Completadas: {{ totalHoursText }}</div>
          </div>

          <div class="report-center">
            <div class="report-center-title">REPORTES</div>

            <div class="report-course">
              <span class="b">Curso:</span>

              <template v-if="reportData.courses.length">
                <select class="report-select" v-model="reportCourseId" :disabled="busy.loadReport">
                  <option v-for="c in reportData.courses" :key="c.id" :value="c.id">
                    {{ c.nombre }}
                  </option>
                </select>
              </template>

              <span v-else class="report-no-courses">Este tutor no tiene cursos.</span>
            </div>
          </div>
        </div>

        <div class="report-list">
          <p v-if="busy.loadReport" class="empty">Cargando reporte...</p>

          <template v-else>
            <article v-for="r in reportsForCourseSorted" :key="r.id" class="report-item">
              <div class="report-created">Creado: {{ r.creado }}</div>
              <div class="report-text">{{ r.descripcion }}</div>
              <div class="report-mins">Minutos realizados: {{ r.minutos }}</div>
              <div class="divider"></div>
            </article>

            <p v-if="reportsForCourseSorted.length === 0" class="empty">
              No hay reportes para este curso.
            </p>
          </template>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch, onMounted, onBeforeUnmount } from 'vue'
import {
  createTutor as createTutorApi,
  activateTutor as activateTutorApi,
  listMyTutors,
  updateTutor as updateTutorApi,
  deleteTutor as deleteTutorApi,
  createCourse as createCourseApi,
  listCoursesByTutor,
  updateCourse as updateCourseApi,
  deleteCourse as deleteCourseApi,
  getTutorGeneralReport,
} from '../helpers/adminHelper'

const busy = reactive({
  addTutor: false,
  updateTutorId: null,
  activateTutorId: null,
  deleteTutor: false,
  loadCourses: false,
  saveCourse: false,
  deleteCourseId: null,
  loadReport: false,
})

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

function toDisplayDate(v) {
  const s = String(v ?? '').trim()
  if (/^\d{2}\s*-\s*\d{2}\s*-\s*\d{4}$/.test(s)) return s
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]} - ${m[2]} - ${m[1]}`
  return s
}

function displayToIso(display) {
  const raw = String(display ?? '').trim()
  const m = raw.match(/^(\d{2})\s*-\s*(\d{2})\s*-\s*(\d{4})$/)
  if (!m) return ''
  return `${m[3]}-${m[2]}-${m[1]}`
}

function mapTutorDto(dto) {
  const id = pick(dto, ['id', 'userId', 'tutorId'], null)
  const nombre = pick(dto, ['name', 'nombre'], pick(dto?.user, ['name'], ''))
  const apellido = pick(dto, ['lastName', 'apellido'], pick(dto?.user, ['lastName'], ''))
  const email = pick(dto, ['email'], pick(dto?.user, ['email'], ''))
  const telefono = pick(dto, ['phone', 'telefono'], '')
  const carrera = pick(dto, ['career', 'carrera'], '')
  const horario = pick(dto, ['availableSchedule', 'horario'], '')
  const activoRaw = pick(dto, ['isActive', 'active', 'activo'], false)
  return { id, nombre, apellido, email, telefono, carrera, horario, activo: Boolean(activoRaw) }
}

function mapCourseDto(dto) {
  return {
    id: pick(dto, ['id'], null),
    nombre: pick(dto, ['name', 'nombre'], ''),
    descripcion: pick(dto, ['description', 'descripcion'], ''),
    materia: pick(dto, ['subject', 'materia'], ''),
    horario: pick(dto, ['schedule', 'horario'], ''),
    fechaInicio: toDisplayDate(pick(dto, ['startDate', 'fechaInicio'], '')),
    fechaFin: toDisplayDate(pick(dto, ['endDate', 'fechaFin'], '')),
  }
}

function mapReportDto(dto) {
  return {
    id: pick(dto, ['id'], null),
    creado: pick(dto, ['created', 'creado', 'createdAt'], ''),
    descripcion: pick(dto, ['description', 'descripcion'], ''),
    minutos: Number(pick(dto, ['minutes', 'minutos', 'minutesCompleted'], 0)),
    courseId: pick(dto, ['courseId'], pick(dto?.course, ['id'], null)),
    courseName: pick(dto, ['courseName'], pick(dto?.course, ['name'], '')),
  }
}

const auth = ref(readAuth())
const adminUserId = computed(() => auth.value?.userId ?? null)
const adminName = ref('Administrador')

const tutors = ref([])
const loadingTutors = ref(false)
const pageError = ref('')

const expandedId = ref(null)
const editingId = ref(null)
const editMap = reactive({})
const tutorErrors = reactive({})

function toggleExpand(id) {
  expandedId.value = expandedId.value === id ? null : id
}

function hydrateEditMap(list) {
  for (const t of list) {
    editMap[t.id] = {
      nombre: t.nombre,
      apellido: t.apellido,
      telefono: t.telefono,
      carrera: t.carrera,
    }
    tutorErrors[t.id] = ''
  }
}

function onPhoneInput(id) {
  editMap[id].telefono = sanitizeDigits(editMap[id].telefono).slice(0, 10)
}

async function toggleEdit(t) {
  tutorErrors[t.id] = ''

  if (editingId.value !== t.id) {
    editingId.value = t.id
    editMap[t.id] = {
      nombre: t.nombre,
      apellido: t.apellido,
      telefono: t.telefono,
      carrera: t.carrera,
    }
    return
  }

  const next = editMap[t.id]
  const nombre = String(next.nombre ?? '').trim()
  const apellido = String(next.apellido ?? '').trim()
  const telefono = sanitizeDigits(next.telefono).slice(0, 10)
  const carrera = String(next.carrera ?? '').trim()

  if (!nombre || !apellido || !carrera || telefono.length !== 10) {
    tutorErrors[t.id] = 'Debe completar todos los campos y el teléfono debe tener 10 dígitos.'
    return
  }

  try {
    busy.updateTutorId = t.id
    const payload = { name: nombre, lastName: apellido, phone: telefono, career: carrera }
    const updatedDto = await updateTutorApi(adminUserId.value, t.id, payload)
    const updated = mapTutorDto(updatedDto)
    const idx = tutors.value.findIndex((x) => x.id === t.id)
    if (idx !== -1) tutors.value[idx] = { ...tutors.value[idx], ...updated }
    editingId.value = null
  } catch (e) {
    tutorErrors[t.id] = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.updateTutorId = null
  }
}

async function sendVerificationEmail(t) {
  if (busy.activateTutorId) return
  try {
    busy.activateTutorId = t.id
    await activateTutorApi(adminUserId.value, t.id)
    t.activo = true
  } catch (e) {
    tutorErrors[t.id] = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.activateTutorId = null
  }
}

const addTutorOpen = ref(false)
const addTutorError = ref('')
const addTutorForm = reactive({
  email: '',
  nombre: '',
  apellido: '',
  telefono: '',
  carrera: '',
  horario: '',
})

function openAddTutor() {
  addTutorError.value = ''
  addTutorForm.email = ''
  addTutorForm.nombre = ''
  addTutorForm.apellido = ''
  addTutorForm.telefono = ''
  addTutorForm.carrera = ''
  addTutorForm.horario = ''
  addTutorOpen.value = true
}

function closeAddTutor() {
  addTutorOpen.value = false
}

function isValidEmail(v) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v ?? '').trim())
}

async function addTutor() {
  if (busy.addTutor) return
  addTutorError.value = ''

  const email = String(addTutorForm.email ?? '')
    .trim()
    .toLowerCase()
  const nombre = String(addTutorForm.nombre ?? '').trim()
  const apellido = String(addTutorForm.apellido ?? '').trim()
  const telefono = sanitizeDigits(addTutorForm.telefono).slice(0, 10)
  const carrera = String(addTutorForm.carrera ?? '').trim()
  const horario = String(addTutorForm.horario ?? '').trim()

  if (!email || !nombre || !apellido || !telefono || !carrera || !horario) {
    addTutorError.value = 'Debe completar todos los campos.'
    return
  }
  if (!isValidEmail(email)) {
    addTutorError.value = 'El email no es válido.'
    return
  }
  if (telefono.length !== 10) {
    addTutorError.value = 'El teléfono debe tener 10 dígitos.'
    return
  }

  try {
    busy.addTutor = true
    const payload = {
      email,
      name: nombre,
      lastName: apellido,
      phone: telefono,
      career: carrera,
      availableSchedule: horario,
    }
    const createdDto = await createTutorApi(adminUserId.value, payload)
    const created = mapTutorDto(createdDto)
    tutors.value.push(created)
    hydrateEditMap([created])
    addTutorOpen.value = false
  } catch (e) {
    addTutorError.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.addTutor = false
  }
}

const deleteTutorOpen = ref(false)
const deleteTutorError = ref('')
const deletingTutorId = ref(null)

const deletingTutor = computed(
  () => tutors.value.find((x) => x.id === deletingTutorId.value) ?? null,
)

function openDeleteTutor(t) {
  deleteTutorError.value = ''
  deletingTutorId.value = t.id
  deleteTutorOpen.value = true
}

function closeDeleteTutor() {
  deleteTutorOpen.value = false
  deletingTutorId.value = null
  deleteTutorError.value = ''
}

async function confirmDeleteTutor() {
  if (!deletingTutor.value || busy.deleteTutor) return
  try {
    busy.deleteTutor = true
    await deleteTutorApi(adminUserId.value, deletingTutor.value.id)
    tutors.value = tutors.value.filter((x) => x.id !== deletingTutor.value.id)
    closeDeleteTutor()
  } catch (e) {
    deleteTutorError.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.deleteTutor = false
  }
}

const coursesOpen = ref(false)
const coursesError = ref('')
const selectedTutorId = ref(null)

const selectedTutor = computed(
  () => tutors.value.find((x) => x.id === selectedTutorId.value) ?? null,
)
const selectedTutorCourses = ref([])

async function openCourses(t) {
  if (busy.loadCourses) return
  coursesError.value = ''
  selectedTutorCourses.value = []
  selectedTutorId.value = t.id
  coursesOpen.value = true

  try {
    busy.loadCourses = true
    const list = await listCoursesByTutor(adminUserId.value, t.id)
    selectedTutorCourses.value = (list ?? []).map(mapCourseDto)
  } catch (e) {
    coursesError.value = e?.response?.data || 'No se pudieron cargar los cursos.'
    selectedTutorCourses.value = []
  } finally {
    busy.loadCourses = false
  }
}

function closeCourses() {
  coursesOpen.value = false
  selectedTutorCourses.value = []
  coursesError.value = ''
}

const deleteCourseOpen = ref(false)
const deleteCourseError = ref('')
const deletingCourseId = ref(null)

const deletingCourse = computed(
  () => (selectedTutorCourses.value || []).find((c) => c.id === deletingCourseId.value) ?? null,
)

function openDeleteCourse(course) {
  deleteCourseError.value = ''
  deletingCourseId.value = course?.id ?? null
  deleteCourseOpen.value = true
}

function closeDeleteCourse() {
  deleteCourseOpen.value = false
  deletingCourseId.value = null
  deleteCourseError.value = ''
}

async function confirmDeleteCourse() {
  deleteCourseError.value = ''
  if (!deletingCourse.value?.id || busy.deleteCourseId != null) return

  try {
    busy.deleteCourseId = deletingCourse.value.id
    await deleteCourseApi(adminUserId.value, deletingCourse.value.id)
    selectedTutorCourses.value = selectedTutorCourses.value.filter(
      (x) => x.id !== deletingCourse.value.id,
    )
    closeDeleteCourse()
  } catch (e) {
    deleteCourseError.value = e?.response?.data || 'No se pudo eliminar el curso.'
  } finally {
    busy.deleteCourseId = null
  }
}

const courseFormOpen = ref(false)
const courseFormMode = ref('create')
const courseFormError = ref('')
const editingCourseId = ref(null)

const courseForm = reactive({
  nombre: '',
  descripcion: '',
  fechaInicioIso: '',
  fechaFinIso: '',
  horario: '',
  materia: '',
})

function openCourseForm(mode, course = null) {
  courseFormError.value = ''
  courseFormMode.value = mode
  editingCourseId.value = course?.id ?? null

  courseForm.nombre = course?.nombre ?? ''
  courseForm.descripcion = course?.descripcion ?? ''
  courseForm.fechaInicioIso = displayToIso(course?.fechaInicio)
  courseForm.fechaFinIso = displayToIso(course?.fechaFin)
  courseForm.horario = course?.horario ?? ''
  courseForm.materia = course?.materia ?? ''

  courseFormOpen.value = true
}

function closeCourseForm() {
  courseFormOpen.value = false
  editingCourseId.value = null
}

const minSelectableDate = computed(() => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
})

async function saveCourse() {
  if (busy.saveCourse) return
  courseFormError.value = ''
  if (!selectedTutor.value) return

  const nombre = String(courseForm.nombre ?? '').trim()
  const descripcion = String(courseForm.descripcion ?? '').trim()
  const horario = String(courseForm.horario ?? '').trim()
  const materia = String(courseForm.materia ?? '').trim()

  if (!nombre || !courseForm.fechaInicioIso || !courseForm.fechaFinIso || !horario || !materia) {
    courseFormError.value = 'Debe completar nombre, materia, fechas y horario.'
    return
  }

  const payload = {
    tutorId: selectedTutor.value.id,
    name: nombre,
    description: descripcion,
    schedule: horario,
    subject: materia,
    startDate: courseForm.fechaInicioIso,
    endDate: courseForm.fechaFinIso,
  }

  try {
    busy.saveCourse = true
    if (courseFormMode.value === 'create') {
      const createdDto = await createCourseApi(adminUserId.value, payload)
      selectedTutorCourses.value.push(mapCourseDto(createdDto))
    } else {
      const updatedDto = await updateCourseApi(adminUserId.value, editingCourseId.value, payload)
      const updated = mapCourseDto(updatedDto)
      const idx = selectedTutorCourses.value.findIndex((x) => x.id === updated.id)
      if (idx !== -1) selectedTutorCourses.value[idx] = updated
    }
    courseFormOpen.value = false
  } catch (e) {
    courseFormError.value = e?.response?.data || 'No se pudo guardar el curso.'
  } finally {
    busy.saveCourse = false
  }
}

const reportOpen = ref(false)
const reportCourseId = ref(null)

const reportData = reactive({
  tutorName: '',
  career: '',
  totalMinutes: 0,
  reports: [],
  courses: [],
})

async function openReport(t) {
  if (busy.loadReport) return
  selectedTutorId.value = t.id
  reportOpen.value = true

  reportData.tutorName = ''
  reportData.career = ''
  reportData.totalMinutes = 0
  reportData.reports = []
  reportData.courses = []
  reportCourseId.value = null

  try {
    busy.loadReport = true
    const [dto, coursesList] = await Promise.all([
      getTutorGeneralReport(adminUserId.value, t.id),
      listCoursesByTutor(adminUserId.value, t.id),
    ])

    const courses = (coursesList ?? [])
      .map(mapCourseDto)
      .map((c) => ({ id: c.id, nombre: c.nombre }))
    const reportsRaw = (dto?.reports ?? dto?.reportes ?? []).map(mapReportDto)
    const totalMinutes = reportsRaw.reduce((acc, r) => acc + (Number(r.minutos) || 0), 0)

    reportData.tutorName = dto?.tutorName || `${t.nombre} ${t.apellido}`
    reportData.career = dto?.career || t.carrera || ''
    reportData.totalMinutes = totalMinutes
    reportData.reports = reportsRaw
    reportData.courses = courses
    reportCourseId.value = courses[0]?.id ?? null
  } catch {
    reportData.tutorName = ''
    reportData.career = ''
    reportData.totalMinutes = 0
    reportData.reports = []
    reportData.courses = []
    reportCourseId.value = null
  } finally {
    busy.loadReport = false
  }
}

function closeReport() {
  reportOpen.value = false
  reportCourseId.value = null
}

const reportsForCourseSorted = computed(() => {
  const list = reportData.reports ?? []
  const filtered =
    reportCourseId.value != null ? list.filter((r) => r.courseId === reportCourseId.value) : list
  return [...filtered].sort((a, b) => String(b.creado).localeCompare(String(a.creado)))
})

const totalHoursText = computed(() => {
  const mins = Number(reportData.totalMinutes || 0)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return `${h} h ${m} min`
})

async function loadTutors() {
  pageError.value = ''

  if (!adminUserId.value) {
    pageError.value = 'No se encontró el adminUserId. Inicia sesión nuevamente.'
    tutors.value = []
    return
  }

  try {
    loadingTutors.value = true
    const list = await listMyTutors(adminUserId.value)
    const mapped = (list ?? []).map(mapTutorDto)
    tutors.value = mapped
    hydrateEditMap(mapped)
  } catch (e) {
    pageError.value =
      e?.response?.data || 'No se pudieron cargar los tutores. Vuelva a intentarlo más tarde.'
    tutors.value = []
  } finally {
    loadingTutors.value = false
  }
}

function closeAllModals() {
  addTutorOpen.value = false
  deleteTutorOpen.value = false
  deleteCourseOpen.value = false
  coursesOpen.value = false
  courseFormOpen.value = false
  reportOpen.value = false
}

function onKeydown(e) {
  if (e.key === 'Escape') closeAllModals()
}

onMounted(async () => {
  auth.value = readAuth()
  adminName.value =
    `${auth.value?.name ?? ''} ${auth.value?.lastName ?? ''}`.trim() || 'Administrador'
  document.addEventListener('keydown', onKeydown)
  await loadTutors()
})

onBeforeUnmount(() => {
  document.removeEventListener('keydown', onKeydown)
})

watch(selectedTutorId, () => {
  editingId.value = null
})
</script>

<style scoped>
.table-head {
  grid-template-columns: 1fr 1fr 1.2fr 0.6fr 1fr 44px;
}

.tutor-item {
  margin-bottom: 22px;
}

.card-table {
  grid-template-columns: 1fr 1fr 1.2fr 0.6fr 1fr 44px;
}

.chev-btn {
  width: 40px;
  height: 36px;
  border-radius: 12px;
  border: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.04);
  font-size: 18px;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.55);
}

.chev-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}

.actions-row {
  grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
}

.btn-pill:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.modal-textarea {
  width: 100%;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 10px 12px;
  outline: none;
  background: #fff;
  box-sizing: border-box;
  resize: none;
}
.modal-textarea:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 14px;
}

.modal-courses {
  width: min(980px, 100%);
  background: #d9d9d9;
  padding: 18px 18px 22px;
  max-height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;
}

.courses-head {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
  padding: 6px 6px 12px;
}

.courses-head-title {
  font-weight: 900;
  text-align: left;
}

.courses-head-sub {
  font-weight: 700;
  text-align: left;
  margin-top: 2px;
}

.courses-scroll {
  padding: 0 6px 6px;
  overflow-y: auto;
  max-height: 520px;
}

.courses-scroll::-webkit-scrollbar {
  width: 10px;
}
.courses-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.22);
  border-radius: 10px;
}
.courses-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.45);
  border-radius: 10px;
}

.course-card {
  width: min(860px, 100%);
  margin: 14px auto;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.08);
  padding: 18px 20px 16px;
  box-sizing: border-box;
}

.course-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: center;
  gap: 18px;
}

.course-info {
  text-align: left;
}

.course-title {
  font-weight: 900;
  text-align: center;
  margin-bottom: 10px;
}

.course-actions {
  display: flex;
  justify-content: center;
  gap: 18px;
  margin-top: 14px;
}

.b {
  font-weight: 800;
}

.modal-course-form {
  width: min(900px, 100%);
  padding: 26px 26px 22px;
}
.modal-wide-title2 {
  font-weight: 900;
  text-align: center;
  margin-bottom: 12px;
}

.modal-wide-subtitle {
  font-weight: 700;
  text-align: center;
  margin: 6px 0 14px;
}

.modal-body-wide {
  padding-top: 6px;
}

.modal-report {
  width: min(980px, 100%);
  padding: 22px 22px 18px;
}

.report-head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
  margin-bottom: 14px;
}

.report-left {
  text-align: left;
}

.report-title {
  font-weight: 900;
  margin-bottom: 6px;
  text-align: left;
}

.report-meta {
  margin: 2px 0;
  text-align: left;
}

.report-center {
  text-align: center;
}

.report-center-title {
  font-weight: 900;
  margin-bottom: 8px;
}

.report-course {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.report-select {
  height: 34px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 10px;
  outline: none;
  background: #fff;
}

.report-list {
  max-height: 420px;
  overflow: auto;
  padding-right: 6px;
}

.report-item {
  padding: 10px 0 0;
}

.report-created {
  margin-bottom: 8px;
  text-align: left;
}

.report-text {
  line-height: 1.45;
  text-align: justify;
  margin-bottom: 8px;
}

.report-mins {
  margin-bottom: 10px;
  text-align: left;
}

.divider {
  height: 1px;
  background: rgba(0, 0, 0, 0.12);
  margin: 10px 0 0;
}
</style>
