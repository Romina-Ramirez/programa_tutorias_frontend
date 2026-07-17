<template>
  <main class="page-profile">
    <div class="head">
      <div class="head-title">Mi Perfil</div>
      <div class="head-title">Mis cursos</div>
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
              <label class="lbl" for="meetingUrl">Enlace de reunión:</label>
              <input
                id="meetingUrl"
                class="input"
                v-model.trim="perfil.meetingUrl"
                :disabled="!editing"
                type="url"
                placeholder="https://zoom.us/j/..."
              />
            </div>

            <p class="hint">Este enlace permitirá a tus estudiantes unirse a tus reuniones</p>

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

          <template v-else>
            <article v-for="c in cursos" :key="c.id" class="course-item">
              <div class="course-text">
                <div>{{ (c.nombre ?? '').toUpperCase() }}</div>
                <div>Materia: {{ c.materia ?? '-' }}</div>
                <div class="course-estado">{{ formatEstado(c.estado) }}</div>
              </div>

              <button
                class="course-eye-btn"
                type="button"
                aria-label="Ver curso"
                @click="viewCourse(c)"
              >
                <FontAwesomeIcon :icon="['fas', 'eye']" />
              </button>
            </article>

            <div v-if="cursos.length === 0" class="empty-wrap">
              <p class="empty">Aún no tienes cursos asignados.</p>
            </div>
          </template>
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
  if (v === 'EN_CURSO' || v === 'ENCURSO' || v === 'EN_PROGRESO') return 'IN_PROGRESS'
  if (v === 'FINALIZADO' || v === 'INACTIVO') return 'INACTIVE'

  return v
}

function formatEstado(e) {
  const k = normalizeEstado(e)
  if (k === 'ACTIVE') return 'ACTIVO'
  if (k === 'IN_PROGRESS') return 'EN PROGRESO'
  if (k === 'INACTIVE') return 'FINALIZADO'
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
    cursos.value = (dtos ?? []).map(mapCourseCardDto)
  } catch (err) {
    coursesError.value = 'Error al cargar los cursos'
    cursos.value = []
  } finally {
    loadingCourses.value = false
  }
}

async function toggleEdit() {
  profileError.value = ''
  profileSuccess.value = ''

  if (!editing.value) {
    editing.value = true
    return
  }

  savingProfile.value = true

  try {
    await updateTutorProfile(userId.value, { meetingUrl: perfil.meetingUrl })
    profileSuccess.value = 'Perfil actualizado correctamente'
    setTimeout(() => {
      profileSuccess.value = ''
    }, 3000)
    editing.value = false
  } catch (err) {
    profileError.value = 'Error al actualizar el perfil'
  } finally {
    savingProfile.value = false
  }
}

function viewCourse(curso) {
  sessionStorage.setItem('selectedCurso', JSON.stringify(curso))
  router.push({ name: 'course-principal', params: { id: curso.id } })
}

onMounted(() => {
  auth.value = readAuth()

  if (!isTutor.value) {
    redirectByRole(auth.value?.role)
    return
  }

  loadProfile()
  loadCourses()
})
</script>

<style scoped>
.page-profile {
  width: 100%;
  background: #e8e8e8;
  min-height: 0;
  padding-bottom: 20px;
}

.head {
  background: #ffffff;
  padding: 22px 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: space-around;
  align-items: center;
  flex-wrap: wrap;
  gap: 20px;
}

.head-title {
  font-size: 20px;
  font-weight: 700;
  text-align: center;
  color: #1a1a1a;
}

.grid {
  display: grid;
  grid-template-columns: minmax(320px, 0.95fr) minmax(340px, 1.05fr);
  gap: 22px;
  width: 100%;
  padding: 22px 16px 12px;
  margin: 0 auto;
}

.left,
.right {
  min-width: 0;
}

.profile-card {
  position: relative;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 6px 24px rgba(0, 0, 0, 0.08);
  padding: 32px 28px 76px;
}

.profile-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.lbl {
  font-size: 15px;
  font-weight: 600;
  text-align: right;
  min-width: 100px;
  color: #333;
}

.input {
  flex: 1;
  height: 44px;
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 14px;
  font-size: 15px;
  text-align: left;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.input:disabled {
  opacity: 1;
  color: #1a1a1a;
  background: #f9f9f9;
}

.input:focus {
  border-color: rgba(0, 70, 113, 0.6);
  box-shadow: 0 0 0 3px rgba(0, 70, 113, 0.1);
}

.hint {
  margin: -6px 0 0;
  font-size: 13px;
  color: #6b7280;
  line-height: 1.4;
}

.edit-btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  transition:
    background 0.2s,
    transform 0.1s;
}

.edit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.edit-btn:hover:not(:disabled) {
  background: #003d5c;
}

.edit-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-top: 18px;
  padding: 12px 24px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  transition:
    background 0.2s,
    transform 0.1s;
}

.btn:hover {
  background: #003d5c;
}

.btn:active {
  transform: scale(0.98);
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  width: 100%;
}

.course-item {
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  padding: 18px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.course-text {
  flex: 1;
  text-align: left;
  font-size: 15px;
  line-height: 1.6;
  color: #333;
}

.course-text div:first-child {
  font-weight: 700;
  font-size: 16px;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.course-estado {
  font-weight: 700;
  color: #004671;
  margin-top: 6px;
}

.course-eye-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
  transition:
    background 0.2s,
    transform 0.1s;
}

.course-eye-btn:hover {
  background: #003d5c;
}

.course-eye-btn:active {
  transform: scale(0.95);
}

.empty {
  margin: 20px 0;
  font-size: 16px;
  text-align: center;
  color: #666;
  padding: 30px;
  background: #f5f5f5;
  border-radius: 12px;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  margin-top: 16px;
}

.loading {
  font-size: 15px;
  font-weight: 600;
  text-align: center;
  padding: 30px;
  color: #666;
}

.error {
  margin: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #b00020;
  text-align: center;
  padding: 10px;
  background: rgba(176, 0, 32, 0.06);
  border-radius: 8px;
}

.success {
  margin: 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #0a7a2f;
  text-align: center;
  padding: 10px;
  background: rgba(10, 122, 47, 0.06);
  border-radius: 8px;
}

.btn-mini {
  font-size: 12px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .head {
    padding: 18px 16px;
    flex-direction: column;
    gap: 16px;
  }

  .grid {
    grid-template-columns: 1fr;
    gap: 18px;
    padding: 18px 12px 10px;
  }

  .left,
  .right {
    width: 100%;
  }

  .profile-card {
    padding: 22px 18px 76px;
  }

  .row {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .lbl {
    text-align: left;
    min-width: unset;
  }

  .hint {
    margin-top: 0;
  }

  .course-item {
    flex-direction: column;
    text-align: center;
    padding: 16px;
  }

  .course-text {
    text-align: center;
  }
}
</style>
