<template>
  <main class="page-gray-bg">
    <header v-if="isTutor" class="welcome-band">
      <h2 class="welcome-title">Bienvenido Tutor {{ userName }}</h2>
    </header>

    <div v-else>
      <h2 class="welcome-title title-simple">Mis cursos</h2>
    </div>

    <div v-if="isTutor" class="info-band">
      <p class="info-text">A continuación se muestran los cursos que tiene:</p>
    </div>

    <div class="panel">
      <p v-if="loading" class="empty">Cargando cursos...</p>
      <p v-else-if="error" class="empty">{{ error }}</p>

      <template v-else>
        <CoursesCard v-if="cursos.length" :cursos="cursos" :mostrar-estado="true" :page-size="6" />
        <p v-else class="empty">No hay cursos registrados.</p>
      </template>
    </div>
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import CoursesCard from '../components/CoursesComponent.vue'

import { getMyCourses as getTutorMyCourses } from '../helpers/tutorHelper'
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

function pick(obj, keys, fallback = '') {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null) return v
  }
  return fallback
}

function toDisplayDate(v) {
  const s = String(v ?? '').trim()
  if (/^\d{2}\s*-\s*\d{2}\s*-\s*\d{4}$/.test(s)) return s
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (m) return `${m[3]} - ${m[2]} - ${m[1]}`
  return s
}

function mapCourseCardDto(dto) {
  return {
    id: pick(dto, ['id'], null),
    nombre: pick(dto, ['name', 'nombre'], ''),
    materia: pick(dto, ['subject', 'materia'], ''),
    fechaInicio: toDisplayDate(pick(dto, ['startDate', 'fechaInicio'], '')),
    fechaFin: toDisplayDate(pick(dto, ['endDate', 'fechaFin'], '')),
    horario: pick(dto, ['schedule', 'horario'], ''),
    estado: pick(dto, ['status', 'estado'], 'ACTIVO'),
  }
}

const auth = ref(readAuth())

const roleKey = computed(() =>
  String(auth.value?.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isTutor = computed(() => roleKey.value === 'TUTOR')
const isStudent = computed(() => roleKey.value === 'STUDENT')

const userName = computed(() => {
  const n = String(auth.value?.name ?? '').trim()
  const l = String(auth.value?.lastName ?? '').trim()
  return `${n} ${l}`.trim() || 'Tutor'
})

const userId = computed(() => auth.value?.userId ?? null)

const cursos = ref([])
const loading = ref(false)
const error = ref('')

async function loadCourses() {
  error.value = ''
  cursos.value = []

  if (!userId.value) {
    router.push({ name: 'login' })
    return
  }

  try {
    loading.value = true

    let list = []
    if (isTutor.value) {
      list = await getTutorMyCourses(userId.value)
    } else if (isStudent.value) {
      list = await getStudentMyCourses(userId.value)
    } else {
      router.push({ name: 'login' })
      return
    }

    cursos.value = (list ?? []).map(mapCourseCardDto)
  } catch (e) {
    error.value = e?.response?.data || 'No se pudieron cargar los cursos.'
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  auth.value = readAuth()
  await loadCourses()
})
</script>

<style scoped>
.title-simple {
  margin: 0;
  padding-top: 40px;
}

.panel {
  padding: 18px 40px 26px;
}

.empty {
  font-size: 18px;
  text-align: center;
  margin: 18px 0;
}
</style>
