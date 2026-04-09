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
              <label class="lbl" for="nombre">Nombre:</label>
              <input
                id="nombre"
                class="input"
                v-model.trim="perfil.nombre"
                :disabled="!editing"
                type="text"
              />
            </div>

            <div class="row">
              <label class="lbl" for="apellido">Apellido:</label>
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
  router.push({ name: 'verifyEmail' })
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
  background: #d9d9d9;
  min-height: calc(100vh - 80px);
}

.head {
  display: grid;
  grid-template-columns: 60% 1fr;
  align-items: center;
  padding: 40px;
}

.head-title {
  font-size: 18px;
  font-weight: 600;
  text-align: center;
}

.grid {
  display: grid;
  grid-template-columns: 60% 1fr;
  gap: 50px;
}

.profile-card {
  position: relative;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 60px;
  margin-left: 50px;
}

.profile-form {
  display: grid;
  gap: 25px;
}

.row {
  display: grid;
  grid-template-columns: 150px 1fr;
  align-items: center;
  gap: 20px;
}

.lbl {
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  margin-left: 25px;
}

.input {
  height: 45px;
  border-radius: 15px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  padding-inline: 10px;
  font-size: 16px;
  text-align: center;
  margin-right: 25px;
}

.input:disabled {
  opacity: 1;
  color: #000;
}

.input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.edit-btn {
  position: absolute;
  right: 20px;
  bottom: 20px;
  width: 50px;
  height: 50px;
  border-radius: 50px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.edit-btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.edit-btn:hover {
  opacity: 0.92;
}

.btn-mini {
  font-size: 12px;
  font-weight: 800;
}

.btn {
  margin-top: 25px;
  width: auto;
  height: auto;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #1b4f78;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  padding: 15px 40px;
}

.courses-list {
  display: flex;
  flex-direction: column;
  gap: 25px;
  margin-right: 50px;
}

.course-item {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 20px 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 72px;
}

.course-text {
  flex: 1;
  text-align: center;
  font-size: 16px;
  line-height: 1.7;
}

.course-estado {
  font-weight: 900;
}

.course-eye-btn {
  width: 50px;
  height: 50px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 14px;
  font-size: 16px;
}

.course-eye-btn:hover {
  opacity: 0.92;
}

.empty {
  margin: 10px 0 0;
  font-size: 18px;
  text-align: center;
}

.empty-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 10px;
}

.loading {
  font-size: 16px;
  font-weight: 700;
  text-align: center;
}

.error {
  margin: 10px 0 0;
  font-size: 14px;
  font-weight: 800;
  color: #b00020;
  text-align: center;
}

.success {
  margin: 10px 0 0;
  font-size: 14px;
  font-weight: 800;
  color: #0b7a2e;
  text-align: center;
}
</style>
