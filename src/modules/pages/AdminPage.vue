<template>
  <main class="page-gray-bg">
    <header class="welcome-band">
      <h2 class="welcome-title">Bienvenido Administrador {{ adminName }}</h2>
    </header>

    <section class="info-band">
      <p class="info-text">A continuación se muestran los tutores registrados por usted:</p>

      <div class="info-actions">
        <button class="btn-pill btn-pill-light" type="button" @click="openAddTutor">
          Agregar nuevo tutor
        </button>
        <button class="btn-pill btn-pill-light" type="button" @click="openActivateTutor">
          Activar tutor
        </button>
      </div>
    </section>

    <section class="shell">
      <p v-if="loadingTutors" class="empty">Cargando tutores...</p>
      <p v-else-if="pageError" class="empty">{{ pageError }}</p>

      <template v-else>
        <div v-if="tutors.length" class="table-head">
          <div class="th">Cédula</div>
          <div class="th">Nombres</div>
          <div class="th">Apellidos</div>
          <div class="th">Email</div>
          <div class="th">Teléfono</div>
          <div class="th">Carrera</div>
          <div class="th">Horario</div>
          <div class="th"></div>
        </div>

        <article v-for="t in tutors" :key="t.id" class="tutor-item">
          <div class="card-table">
            <input class="cell-input" type="text" disabled :value="t.cedula" placeholder="Cédula" />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].nombre"
              placeholder="Nombres"
            />

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].apellido"
              placeholder="Apellidos"
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

            <input
              class="cell-input"
              type="text"
              :disabled="editingId !== t.id || busy.updateTutorId === t.id"
              v-model.trim="editMap[t.id].horario"
              placeholder="Horario disponible"
            />

            <button
              class="chev-btn"
              type="button"
              @click="toggleExpand(t.id)"
              aria-label="Expandir"
              :disabled="busy.updateTutorId === t.id || busy.resendEmailId === t.id"
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

            <button
              class="btn-pill"
              type="button"
              @click="deactivateTutorRow(t)"
              :disabled="busy.deactivateTutorId === t.id"
            >
              {{ busy.deactivateTutorId === t.id ? 'Desactivando...' : 'Desactivar' }}
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
              class="btn-pill"
              type="button"
              @click="resendEmail(t)"
              :disabled="busy.resendEmailId === t.id"
            >
              {{ busy.resendEmailId === t.id ? 'Enviando...' : 'Reenviar correo' }}
            </button>
          </div>

          <p v-if="tutorErrors[t.id]" class="row-error">{{ tutorErrors[t.id] }}</p>
          <p v-if="tutorNotices[t.id]" class="row-notice">{{ tutorNotices[t.id] }}</p>
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
            placeholder="Cédula"
            inputmode="numeric"
            maxlength="10"
            v-model.trim="addTutorForm.cedula"
            :disabled="busy.addTutor"
            @input="addTutorForm.cedula = sanitizeDigits(addTutorForm.cedula).slice(0, 10)"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Nombres"
            v-model.trim="addTutorForm.nombre"
            :disabled="busy.addTutor"
          />
          <input
            class="modal-input"
            type="text"
            placeholder="Apellidos"
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
            ¿Está seguro de que quiere eliminar definitivamente al tutor/a
            <strong>{{ deletingTutor?.nombre }} {{ deletingTutor?.apellido }}</strong
            >? Solo se podrá eliminar si no tiene cursos asociados; de lo contrario, desactívelo.
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
          <input
            class="modal-input"
            type="number"
            placeholder="Cupo máximo (5 - 40)"
            inputmode="numeric"
            :value="courseForm.cupo"
            :disabled="busy.saveCourse"
            min="5"
            max="40"
            step="1"
            @keydown="blockCupoKey"
            @input="onCupoInput"
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
    <!-- MODAL: Activar tutor -->
    <div v-if="activateTutorOpen" class="modal-overlay">
      <div class="modal">
        <button
          class="modal-close"
          type="button"
          aria-label="Cerrar"
          @click="closeActivateTutor"
          :disabled="busy.activateTutor"
        >
          ×
        </button>

        <form class="modal-body" @submit.prevent="confirmActivateTutor">
          <p class="modal-text">Ingrese la cédula del tutor que desea activar:</p>

          <input
            class="modal-input"
            type="text"
            inputmode="numeric"
            placeholder="Cédula"
            maxlength="10"
            v-model.trim="activateTutorCedula"
            :disabled="busy.activateTutor"
            @input="activateTutorCedula = sanitizeDigits(activateTutorCedula).slice(0, 10)"
          />

          <p v-if="activateTutorError" class="modal-error">{{ activateTutorError }}</p>

          <button class="btn-pill" type="submit" :disabled="busy.activateTutor">
            {{ busy.activateTutor ? 'Activando...' : 'Activar tutor' }}
          </button>
        </form>
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
  deactivateTutor as deactivateTutorApi,
  hardDeleteTutor as hardDeleteTutorApi,
  activateTutorByIdCard,
  createCourse as createCourseApi,
  listCoursesByTutor,
  updateCourse as updateCourseApi,
  deleteCourse as deleteCourseApi,
  getTutorGeneralReport,
} from '../helpers/adminHelper'
import { useScrollLock } from '../helpers/useScrollLock'

const busy = reactive({
  addTutor: false,
  updateTutorId: null,
  resendEmailId: null,
  deactivateTutorId: null,
  activateTutor: false,
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
  const cedula = pick(dto, ['idCard', 'cedula'], '')
  const nombre = pick(dto, ['name', 'nombre'], pick(dto?.user, ['name'], ''))
  const apellido = pick(dto, ['lastName', 'apellido'], pick(dto?.user, ['lastName'], ''))
  const email = pick(dto, ['email'], pick(dto?.user, ['email'], ''))
  const telefono = pick(dto, ['phone', 'telefono'], '')
  const carrera = pick(dto, ['career', 'carrera'], '')
  const horario = pick(dto, ['availableSchedule', 'horario'], '')
  const activoRaw = pick(dto, ['isActive', 'active', 'activo'], false)
  return {
    id,
    cedula,
    nombre,
    apellido,
    email,
    telefono,
    carrera,
    horario,
    activo: Boolean(activoRaw),
  }
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
    cupo: pick(dto, ['quota', 'cupo'], null),
  }
}

function mapReportDto(dto) {
  return {
    id: pick(dto, ['id'], null),
    creado: pick(dto, ['created', 'creado', 'createdAt'], ''),
    descripcion: pick(dto, ['activityDescription', 'description', 'descripcion'], ''),
    minutos: Number(pick(dto, ['minutesCompleted', 'minutes', 'minutos'], 0)),
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
const tutorNotices = reactive({})

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
      horario: t.horario || '',
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
      horario: t.horario || '',
    }
    return
  }

  const next = editMap[t.id]
  const nombre = String(next.nombre ?? '').trim()
  const apellido = String(next.apellido ?? '').trim()
  const telefono = sanitizeDigits(next.telefono).slice(0, 10)
  const carrera = String(next.carrera ?? '').trim()
  const horario = String(next.horario ?? '').trim()

  if (!nombre || !apellido || !carrera || telefono.length !== 10) {
    tutorErrors[t.id] = 'Debe completar todos los campos y el teléfono debe tener 10 dígitos.'
    return
  }

  try {
    busy.updateTutorId = t.id
    const payload = {
      name: nombre,
      lastName: apellido,
      phone: telefono,
      career: carrera,
      availableSchedule: horario,
    }
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

async function resendEmail(t) {
  if (busy.resendEmailId === t.id) return
  tutorErrors[t.id] = ''
  tutorNotices[t.id] = ''
  try {
    busy.resendEmailId = t.id
    await activateTutorApi(adminUserId.value, t.id)
    t.activo = true
    tutorNotices[t.id] = 'Correo reenviado con una nueva contraseña.'
  } catch (e) {
    tutorErrors[t.id] = e?.response?.data || 'No se pudo reenviar el correo.'
  } finally {
    busy.resendEmailId = null
  }
}

const addTutorOpen = ref(false)
const addTutorError = ref('')
const addTutorForm = reactive({
  email: '',
  cedula: '',
  nombre: '',
  apellido: '',
  telefono: '',
  carrera: '',
  horario: '',
})

function openAddTutor() {
  addTutorError.value = ''
  addTutorForm.email = ''
  addTutorForm.cedula = ''
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
  const cedula = sanitizeDigits(addTutorForm.cedula).slice(0, 10)
  const nombre = String(addTutorForm.nombre ?? '').trim()
  const apellido = String(addTutorForm.apellido ?? '').trim()
  const telefono = sanitizeDigits(addTutorForm.telefono).slice(0, 10)
  const carrera = String(addTutorForm.carrera ?? '').trim()
  const horario = String(addTutorForm.horario ?? '').trim()

  if (!email || !cedula || !nombre || !apellido || !telefono || !carrera || !horario) {
    addTutorError.value = 'Debe completar todos los campos.'
    return
  }
  if (!isValidEmail(email)) {
    addTutorError.value = 'El email no es válido.'
    return
  }
  if (cedula.length !== 10) {
    addTutorError.value = 'La cédula debe tener 10 dígitos.'
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
      idCard: cedula,
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
    await hardDeleteTutorApi(adminUserId.value, deletingTutor.value.id)
    tutors.value = tutors.value.filter((x) => x.id !== deletingTutor.value.id)
    closeDeleteTutor()
  } catch (e) {
    deleteTutorError.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    busy.deleteTutor = false
  }
}

async function deactivateTutorRow(t) {
  if (busy.deactivateTutorId === t.id) return
  tutorErrors[t.id] = ''

  try {
    busy.deactivateTutorId = t.id
    await deactivateTutorApi(adminUserId.value, t.id)
    tutors.value = tutors.value.filter((x) => x.id !== t.id)
  } catch (e) {
    tutorErrors[t.id] = e?.response?.data || 'No se pudo desactivar el tutor.'
  } finally {
    busy.deactivateTutorId = null
  }
}

const activateTutorOpen = ref(false)
const activateTutorError = ref('')
const activateTutorCedula = ref('')

function openActivateTutor() {
  activateTutorError.value = ''
  activateTutorCedula.value = ''
  activateTutorOpen.value = true
}

function closeActivateTutor() {
  activateTutorOpen.value = false
}

async function confirmActivateTutor() {
  const ced = sanitizeDigits(activateTutorCedula.value)
  if (!ced) {
    activateTutorError.value = 'Debe ingresar la cédula.'
    return
  }
  if (busy.activateTutor) return

  try {
    busy.activateTutor = true
    const dto = await activateTutorByIdCard(adminUserId.value, ced)
    const mapped = mapTutorDto(dto)
    tutors.value.push(mapped)
    hydrateEditMap([mapped])
    closeActivateTutor()
  } catch (e) {
    activateTutorError.value = e?.response?.data || 'No se pudo activar el tutor.'
  } finally {
    busy.activateTutor = false
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
  cupo: null,
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
  courseForm.cupo = course?.cupo ?? null

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

// Cupo máximo: solo enteros, sin negativos, tope 40 al escribir (mínimo 5 se valida al guardar)
function blockCupoKey(e) {
  if (['e', 'E', '+', '-', '.', ','].includes(e.key)) e.preventDefault()
}

function onCupoInput(e) {
  const digits = String(e.target.value ?? '').replace(/\D/g, '')
  let n = digits === '' ? null : parseInt(digits, 10)
  if (n !== null && n > 40) n = 40
  const prev = courseForm.cupo
  courseForm.cupo = n
  // El input es de una sola vía (:value): si el valor recortado coincide con el
  // que ya tenía el modelo, Vue no re-renderiza y el DOM quedaría desincronizado
  // (p. ej. mostrando "405" con el modelo en 40). Forzamos la re-sincronización.
  if (n === prev) e.target.value = n == null ? '' : String(n)
}

async function saveCourse() {
  if (busy.saveCourse) return
  courseFormError.value = ''
  if (!selectedTutor.value) return

  const nombre = String(courseForm.nombre ?? '').trim()
  const descripcion = String(courseForm.descripcion ?? '').trim()
  const horario = String(courseForm.horario ?? '').trim()
  const materia = String(courseForm.materia ?? '').trim()

  if (
    !nombre ||
    !courseForm.fechaInicioIso ||
    !courseForm.fechaFinIso ||
    !horario ||
    !materia ||
    !courseForm.cupo
  ) {
    courseFormError.value = 'Debe completar nombre, materia, fechas, horario y cupo.'
    return
  }
  if (courseForm.cupo < 5 || courseForm.cupo > 40) {
    courseFormError.value = 'El cupo máximo debe estar entre 5 y 40.'
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
    quota: courseForm.cupo,
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

const anyModalOpen = computed(
  () =>
    addTutorOpen.value ||
    deleteTutorOpen.value ||
    deleteCourseOpen.value ||
    coursesOpen.value ||
    courseFormOpen.value ||
    reportOpen.value ||
    activateTutorOpen.value,
)

useScrollLock(() => anyModalOpen.value)

function closeAllModals() {
  addTutorOpen.value = false
  deleteTutorOpen.value = false
  deleteCourseOpen.value = false
  coursesOpen.value = false
  courseFormOpen.value = false
  reportOpen.value = false
  activateTutorOpen.value = false
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
.info-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* Grid específico para tutores (8 columnas).
   Cédula y Teléfono son números de 10 dígitos: ancho fijo justo.
   Email recibe el mayor espacio; Carrera y Horario algo más que los nombres. */
.table-head {
  grid-template-columns: 120px 1fr 1fr 1.6fr 120px 1.1fr 1.1fr 44px;
  gap: 10px;
  padding: 8px 12px;
  background: #ececec;
  border-radius: 12px;
  margin-bottom: 12px;
}

.th {
  font-weight: 700;
  font-size: 12px;
  color: #444;
}

.tutor-item {
  margin: 0 0 12px;
}

.card-table {
  grid-template-columns: 120px 1fr 1fr 1.6fr 120px 1.1fr 1.1fr 44px;
  gap: 10px;
  border-radius: 12px;
  padding: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
}

.cell-input {
  height: 38px;
  border-radius: 10px;
  border: 1px solid #ddd;
}

.cell-input:disabled {
  background: #f5f5f5;
  color: #333;
}

/* Acciones específicas */
.actions-row {
  grid-column: 1 / -1;
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  justify-content: space-between;
}

/* Que los botones se repartan a lo ancho de la fila en vez de quedar pegados a la izquierda */
.actions-row .btn-pill {
  flex: 1 1 auto;
}

/* Modal específicos */
.modal-textarea {
  border-radius: 10px;
  border: 1px solid #ddd;
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 8px;
}

.modal-courses {
  width: 100%;
  max-width: 900px;
  background: #e8e8e8;
  padding: 20px;
  max-height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
  border-radius: 16px;
}

/* Cursos dentro del modal */
.courses-head {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 0 0 14px;
  border-bottom: 1px solid #ccc;
  margin-bottom: 14px;
}

.courses-head-title {
  font-weight: 700;
  font-size: 17px;
  text-align: left;
}

.courses-head-sub {
  font-weight: 600;
  font-size: 13px;
  color: #555;
}

.courses-scroll {
  padding: 0 4px;
  overflow-y: auto;
  flex: 1;
}

.course-card {
  background: #fff;
  border-radius: 14px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.06);
  padding: 18px;
  margin-bottom: 14px;
}

.course-title {
  font-weight: 800;
  text-align: center;
  font-size: 15px;
  margin-bottom: 12px;
}

.course-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}

.course-info {
  text-align: left;
  font-size: 13px;
  line-height: 1.5;
}

.course-info .b {
  font-weight: 700;
}

.course-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}

/* Modal curso formulario */
.modal-course-form {
  width: 100%;
  max-width: 600px;
  padding: 24px;
  border-radius: 16px;
}

.modal-wide-title2 {
  font-weight: 800;
  text-align: center;
  margin-bottom: 14px;
  font-size: 17px;
}

.modal-wide-subtitle {
  font-weight: 600;
  text-align: center;
  margin-bottom: 18px;
  font-size: 13px;
  color: #555;
}

/* Modal reporte */
.modal-report {
  width: 100%;
  max-width: 900px;
  padding: 24px;
  border-radius: 16px;
}

.report-head {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  align-items: start;
  margin-bottom: 18px;
}

.report-left {
  text-align: left;
}

.report-title {
  font-weight: 800;
  margin-bottom: 8px;
  font-size: 15px;
}

.report-meta {
  margin: 4px 0;
  font-size: 13px;
}

.report-center {
  text-align: center;
}

.report-center-title {
  font-weight: 800;
  margin-bottom: 10px;
  font-size: 15px;
}

.report-course {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

.report-select {
  height: 34px;
  border-radius: 10px;
  border: 1px solid #ddd;
  padding: 0 10px;
  background: #fff;
  font-size: 13px;
}

.report-list {
  flex: 1 1 auto;
  min-height: 0;
  max-height: 380px;
  overflow: auto;
  padding-right: 6px;
}

.report-item {
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.report-created {
  margin-bottom: 6px;
  text-align: left;
  font-size: 12px;
  color: #666;
}

.report-text {
  line-height: 1.5;
  text-align: justify;
  font-size: 13px;
  margin-bottom: 6px;
}

.report-mins {
  margin-bottom: 6px;
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: #004671;
}

/* Responsive específico */
@media (max-width: 900px) {
  .table-head {
    display: none;
  }

  .card-table {
    grid-template-columns: 1fr;
    gap: 8px;
    padding: 14px;
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
    padding-top: 10px;
    border-top: 1px solid #eee;
  }

  .btn-pill {
    flex: 1;
  }

  .modal-courses {
    max-height: calc(100vh - 60px);
  }

  .course-grid {
    grid-template-columns: 1fr;
  }

  .report-head {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 600px) {
  .shell {
    padding: 12px;
  }
}
</style>
