<template>
  <main class="page-tutor-profile">
    <div class="head">
      <div class="head-title">Mi Perfil de Tutor</div>
    </div>

    <div class="grid">
      <div class="left">
        <div class="profile-card">
          <div v-if="loadingProfile" class="loading">Cargando perfil...</div>

          <div v-else class="profile-form">
            <div class="row">
              <label class="lbl" for="nombre">Nombres:</label>
              <input id="nombre" class="input" v-model.trim="perfil.nombre" disabled type="text" />
            </div>

            <div class="row">
              <label class="lbl" for="apellido">Apellidos:</label>
              <input
                id="apellido"
                class="input"
                v-model.trim="perfil.apellido"
                disabled
                type="text"
              />
            </div>

            <div class="row">
              <label class="lbl" for="meetingUrl">Enlace de reunión (Zoom/Meet):</label>
              <input
                id="meetingUrl"
                class="input"
                v-model.trim="perfil.meetingUrl"
                :disabled="!editing"
                type="url"
                placeholder="https://zoom.us/j/..."
              />
              <small class="hint">Este enlace se mostrará a tus estudiantes en las tutorías</small>
            </div>

            <p v-if="profileError" class="error">{{ profileError }}</p>
            <p v-if="profileSuccess" class="success">{{ profileSuccess }}</p>
          </div>

          <button
            class="edit-btn"
            type="button"
            @click="toggleEdit"
            :disabled="loadingProfile || savingProfile"
            :aria-label="editing ? 'Guardar' : 'Editar'"
          >
            <FontAwesomeIcon
              v-if="!savingProfile"
              :icon="editing ? ['fas', 'check'] : ['fas', 'pen-to-square']"
            />
            <span v-else class="btn-mini">Guardando...</span>
          </button>
        </div>

        <button class="btn" type="button" @click="goChangePassword">Cambiar la contraseña</button>
      </div>

      <div class="right">
        <div class="courses-list">
          <p v-if="loadingCourses" class="loading">Cargando cursos...</p>
          <p v-else-if="coursesError" class="error">{{ coursesError }}</p>
          <div v-else-if="cursos.length > 0" class="course-cards">
            <div v-for="c in cursos" :key="c.id" class="course-card" @click="goToCourse(c.id)">
              <div class="course-title">{{ c.nombre }}</div>
              <div class="course-info">
                <span class="badge" :class="normalizeEstado(c.estado)">{{
                  formatEstado(c.estado)
                }}</span>
                <span class="subject">{{ c.materia }}</span>
              </div>
              <div v-if="c.horario" class="schedule">{{ c.horario }}</div>
            </div>
          </div>
          <p v-else class="empty">No tienes cursos asignados.</p>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { readAuth } from '../helpers/authSession'
import {
  getTutorProfile,
  updateTutorProfile,
  getMyCourses as getTutorCourses,
} from '../helpers/tutorHelper'

const router = useRouter()

function goToCourse(courseId) {
  router.push({ name: 'course-principal', params: { id: courseId } })
}

function goChangePassword() {
  router.push({ name: 'change-password' })
}

function roleKey(role) {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function redirectByRole(role) {
  const r = roleKey(role)
  if (r === 'STUDENT') return router.push({ name: 'home' })
  if (r === 'TUTOR') return router.push({ name: 'my-courses' })
  if (r === 'ADMIN') return router.push({ name: 'admin' })
  if (r === 'SUPER_ADMIN') return router.push({ name: 'super-admin' })
  return router.push({ name: 'home' })
}

function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null) return v
  }
  return fallback
}

const auth = ref(readAuth())
const userId = computed(() => auth.value?.userId ?? null)
const isTutor = computed(() => roleKey(auth.value?.role) === 'TUTOR')

const editing = ref(false)
const savingProfile = ref(false)

const loadingProfile = ref(false)
const loadingCourses = ref(false)

const profileError = ref('')
const profileSuccess = ref('')
const coursesError = ref('')

const perfil = reactive({
  nombre: '',
  apellido: '',
  meetingUrl: '',
})

const cursos = ref([])

function mapProfileDto(dto) {
  const nombre = pick(dto, ['name', 'nombre'], pick(dto?.user, ['name'], ''))
  const apellido = pick(dto, ['lastName', 'apellido'], pick(dto?.user, ['lastName'], ''))
  const meetingUrl = pick(dto, ['meetingUrl', 'meeting_url'], '')
  return { nombre, apellido, meetingUrl }
}

function mapCourseCardDto(dto) {
  return {
    id: pick(dto, ['id'], null),
    nombre: pick(dto, ['name', 'nombre'], pick(dto, ['titulo'], '')),
    materia: pick(dto, ['subject', 'materia'], ''),
    estado: pick(dto, ['status', 'estado'], ''),
    fechaInicio: pick(dto, ['startDate', 'fechaInicio'], ''),
    fechaFin: pick(dto, ['endDate', 'fechaFin'], ''),
    horario: pick(dto, ['schedule', 'horario'], ''),
  }
}

function normalizeEstado(e) {
  const v = String(e ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  if (v === 'ACTIVE') return 'ACTIVE'
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'INACTIVE') return 'INACTIVE'

  if (v === 'ACTIVO') return 'ACTIVE'
  if (v === 'EN_CURSO' || v === 'ENCURSO' || v === 'EN_CURSO') return 'IN_PROGRESS'
  if (v === 'FINALIZADO' || v === 'INACTIVO') return 'INACTIVE'

  return v
}

function formatEstado(e) {
  const k = normalizeEstado(e)
  if (k === 'ACTIVE') return 'ACTIVO'
  if (k === 'IN_PROGRESS') return 'EN PROGRESO'
  if (k === 'INACTIVE') return 'INACTIVO'
  return k
}

async function loadProfile() {
  if (!userId.value) {
    profileError.value = 'No hay sesión activa'
    return
  }

  loadingProfile.value = true
  profileError.value = ''

  try {
    const dto = await getTutorProfile(userId.value)
    const mapped = mapProfileDto(dto)
    perfil.nombre = mapped.nombre
    perfil.apellido = mapped.apellido
    perfil.meetingUrl = mapped.meetingUrl
  } catch (err) {
    console.error('Error loading tutor profile:', err)
    profileError.value = 'Error al cargar el perfil'
  } finally {
    loadingProfile.value = false
  }
}

async function loadCourses() {
  if (!userId.value) return

  loadingCourses.value = true
  coursesError.value = ''

  try {
    const dtos = await getTutorCourses(userId.value)
    cursos.value = dtos.map(mapCourseCardDto)
  } catch (err) {
    console.error('Error loading tutor courses:', err)
    coursesError.value = 'Error al cargar los cursos'
  } finally {
    loadingCourses.value = false
  }
}

async function toggleEdit() {
  if (editing.value) {
    // Save
    savingProfile.value = true
    profileError.value = ''
    profileSuccess.value = ''

    try {
      await updateTutorProfile(userId.value, {
        meetingUrl: perfil.meetingUrl,
      })
      profileSuccess.value = 'Perfil actualizado correctamente'
      setTimeout(() => {
        profileSuccess.value = ''
      }, 3000)
    } catch (err) {
      console.error('Error updating tutor profile:', err)
      profileError.value = 'Error al actualizar el perfil'
    } finally {
      savingProfile.value = false
    }
  }

  editing.value = !editing.value
}

onMounted(() => {
  if (!isTutor.value) {
    redirectByRole(auth.value?.role)
    return
  }
  loadProfile()
  loadCourses()
})
</script>

<style scoped>
.page-tutor-profile {
  width: 100%;
  margin: 0 auto;
  padding: 24px 20px;
}

.head {
  margin-bottom: 24px;
}

.head-title {
  font-size: 1.5rem;
  font-weight: 600;
}

.grid {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 24px;
}

@media (max-width: 768px) {
  .grid {
    grid-template-columns: 1fr;
  }
}

.profile-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px 20px;
  position: relative;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.row {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.lbl {
  font-weight: 500;
  color: #374151;
}

.input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.95rem;
}

.input:disabled {
  background: #f3f4f6;
  color: #6b7280;
}

.hint {
  font-size: 0.8rem;
  color: #6b7280;
}

.edit-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 8px;
  background: #004671;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.edit-btn:hover:not(:disabled) {
  background: #003d5c;
}

.edit-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn {
  margin-top: 16px;
  padding: 10px 16px;
  background: #fff;
  color: #004671;
  border: 1px solid #004671;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn:hover {
  background: #eff6ff;
}

.loading {
  text-align: center;
  color: #6b7280;
  padding: 24px 20px;
}

.error {
  color: #dc2626;
  font-size: 0.9rem;
}

.success {
  color: #16a34a;
  font-size: 0.9rem;
}

.courses-list {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 24px 20px;
}

.course-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.course-card {
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.course-card:hover {
  border-color: #004671;
  box-shadow: 0 2px 8px rgba(0, 70, 113, 0.1);
}

.course-title {
  font-weight: 600;
  color: #111827;
  margin-bottom: 8px;
}

.course-info {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 4px;
}

.badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.badge.ACTIVE {
  background: #dcfce7;
  color: #166534;
}

.badge.IN_PROGRESS {
  background: #fef3c7;
  color: #92400e;
}

.badge.INACTIVE {
  background: #f3f4f6;
  color: #6b7280;
}

.subject {
  color: #6b7280;
  font-size: 0.9rem;
}

.schedule {
  color: #9ca3af;
  font-size: 0.85rem;
}

.empty {
  text-align: center;
  color: #9ca3af;
  padding: 24px 20px;
}

.btn-mini {
  font-size: 0.85rem;
}
</style>
