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
              <input
                id="nombre"
                class="input"
                v-model.trim="perfil.nombre"
                :disabled="!editing"
                type="text"
              />
            </div>

            <div class="row">
              <label class="lbl" for="apellido">Apellidos:</label>
              <input
                id="apellido"
                class="input"
                v-model.trim="perfil.apellido"
                :disabled="!editing"
                type="text"
              />
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
              <p class="empty">Aún no te has inscrito a ningún curso.</p>

              <button class="btn" type="button" @click="goExplore">
                Explora los cursos disponibles
              </button>
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

import { getUserProfile } from '../helpers/userHelper'
import { getMyCourses as getStudentMyCourses } from '../helpers/studentHelper'

const router = useRouter()

function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
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
const isStudent = computed(() => roleKey(auth.value?.role) === 'STUDENT')

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
})

const cursos = ref([])

function mapProfileDto(dto) {
  const nombre = pick(dto, ['name', 'nombre'], pick(dto?.user, ['name'], ''))
  const apellido = pick(dto, ['lastName', 'apellido'], pick(dto?.user, ['lastName'], ''))
  return { nombre, apellido }
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
  profileError.value = ''
  profileSuccess.value = ''

  if (!userId.value) return

  try {
    loadingProfile.value = true
    const dto = await getUserProfile(userId.value)
    const mapped = mapProfileDto(dto)
    perfil.nombre = mapped.nombre
    perfil.apellido = mapped.apellido
  } catch (e) {
    profileError.value = e?.response?.data || 'No se pudo cargar el perfil.'
  } finally {
    loadingProfile.value = false
  }
}

async function loadMyCourses() {
  coursesError.value = ''
  if (!userId.value) return

  try {
    loadingCourses.value = true
    const list = await getStudentMyCourses(userId.value)
    cursos.value = (list ?? []).map(mapCourseCardDto)
  } catch (e) {
    coursesError.value = e?.response?.data || 'No se pudieron cargar tus cursos.'
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

  const nombre = String(perfil.nombre ?? '').trim()
  const apellido = String(perfil.apellido ?? '').trim()

  if (!nombre || !apellido) {
    profileError.value = 'Debe completar nombre y apellido.'
    return
  }

  try {
    savingProfile.value = true

    const raw = localStorage.getItem('auth')
    if (raw) {
      const a = JSON.parse(raw)
      a.name = nombre
      a.lastName = apellido
      localStorage.setItem('auth', JSON.stringify(a))
    }

    editing.value = false
  } catch (e) {
    profileError.value = e?.response?.data || 'No se pudo actualizar el perfil.'
  } finally {
    savingProfile.value = false
  }
}

function goChangePassword() {
  router.push({ name: 'change-password' })
}

function viewCourse(curso) {
  sessionStorage.setItem('selectedCurso', JSON.stringify(curso))
  router.push({ name: 'course-principal', params: { id: curso.id } })
}

function goExplore() {
  router.push({ name: 'home' })
}

onMounted(async () => {
  auth.value = readAuth()

  if (!auth.value?.isAuthenticated || !userId.value) {
    router.push({ name: 'login' })
    return
  }

  if (!isStudent.value) {
    await redirectByRole(auth.value?.role)
    return
  }

  await Promise.all([loadProfile(), loadMyCourses()])
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
  padding: 32px 28px 72px;
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

/* Responsive */
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
    padding: 22px 18px 70px;
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
