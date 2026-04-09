<template>
  <main class="page-gray-bg">
    <header class="welcome-band">
      <h2 class="welcome-title">Bienvenido al curso de {{ course.nombre || 'Curso' }}</h2>
    </header>

    <nav v-if="showStudentNav" class="subnav" aria-label="Navegación del curso">
      <template v-for="(item, idx) in navStudent" :key="item.name">
        <button
          type="button"
          class="nav-item"
          :class="{ active: isActive(item.name) }"
          @click="goTo(item.name)"
        >
          {{ item.label }}
        </button>

        <span v-if="idx !== navStudent.length - 1" class="sep" aria-hidden="true">|</span>
      </template>
    </nav>

    <nav v-else-if="isTutor" class="subnav" aria-label="Navegación del curso">
      <template v-for="(item, idx) in navTutor" :key="item.name">
        <button
          type="button"
          class="nav-item"
          :class="{ active: isActive(item.name) }"
          @click="goTo(item.name)"
        >
          {{ item.label }}
        </button>

        <span v-if="idx !== navTutor.length - 1" class="sep" aria-hidden="true">|</span>
      </template>
    </nav>

    <section class="course-area">
      <p v-if="loading" class="state-text">Cargando curso...</p>
      <p v-else-if="pageError" class="state-text">{{ pageError }}</p>

      <template v-else>
        <RouterView v-slot="{ Component, route: childRoute }">
          <component
            :is="Component"
            :role="roleKey"
            :course="course"
            :tutor-info="tutorInfo"
            :participants="participants"
            :students="participants"
            :student-grades="studentGrades"
            :grades-by-student="gradesByStudent"
            :reports="reports"
            :forums="forums"
            :comments-by-forum="commentsByForum"
            :saving="getSavingState(childRoute.name)"
            :loading="getLoadingState(childRoute.name)"
            :saving-forum="savingForum"
            :saving-comment="savingComment"
            :loading-forums="loadingForums"
            :loading-comments="loadingComments"
            @load-student-grades="loadTutorGradesByStudent"
            @save-grade="handleSaveGrade"
            @save-report="handleSaveReport"
            @create-forum="handleCreateForum"
            @load-comments="loadForumComments"
            @add-comment="handleAddComment"
          />
        </RouterView>

        <div class="btn-wrap">
          <button v-if="!userId" class="btn" type="button" @click="goLogin">
            Inicia sesión para inscribirte
          </button>

          <button
            v-else-if="isStudent && !isEnrolled"
            class="btn"
            type="button"
            @click="inscribirse"
            :disabled="loadingEnroll"
          >
            {{ loadingEnroll ? 'Inscribiendo...' : 'Inscribirse' }}
          </button>
        </div>
      </template>
    </section>
  </main>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import {
  getCourseDetail as getStudentCourseDetail,
  getMyCourses,
  enrollInCourse,
  getMyGrades,
} from '../helpers/studentHelper'

import {
  getCourseDetail as getTutorCourseDetail,
  getEnrolledStudents,
  addGrade,
  getGradesByStudent,
  addReport,
  getReportsByCourse,
} from '../helpers/tutorHelper'

import {
  listForumsByCourse,
  createForum,
  listComments,
  addComment,
} from '../helpers/forumHelper'

const route = useRoute()
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

function normalizeRole(role) {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

function toDisplayDate(value) {
  const raw = String(value ?? '').trim()
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (match) return `${match[3]} - ${match[2]} - ${match[1]}`
  return raw
}

function mapStudentCourse(dto) {
  return {
    id: dto?.id ?? null,
    nombre: dto?.name ?? '',
    descripcion: dto?.description ?? '',
    fechaInicio: toDisplayDate(dto?.startDate),
    fechaFin: toDisplayDate(dto?.endDate),
    horario: dto?.schedule ?? '',
    estado: dto?.status ?? '',
    tutor: dto?.tutor ?? '',
    carrera: dto?.career ?? '',
  }
}

function mapTutorCourse(dto) {
  return {
    id: dto?.id ?? null,
    nombre: dto?.name ?? '',
    descripcion: dto?.description ?? '',
    fechaInicio: toDisplayDate(dto?.startDate),
    fechaFin: toDisplayDate(dto?.endDate),
    horario: dto?.schedule ?? '',
    estado: dto?.status ?? '',
  }
}

function mapParticipant(dto) {
  const nombre = `${dto?.name ?? ''} ${dto?.lastName ?? ''}`.trim()
  return {
    id: dto?.id ?? dto?.studentId ?? null,
    nombre: nombre || dto?.nombre || 'Sin nombre',
  }
}

function mapGradeDto(dto) {
  return {
    id: dto?.id ?? null,
    activity: dto?.activity ?? '',
    score: dto?.score ?? dto?.grade ?? '',
    max: dto?.maxScore ?? dto?.max ?? 20,
    observations: dto?.observations ?? '',
  }
}

function mapReportDto(dto) {
  return {
    id: dto?.id ?? null,
    createdAt: dto?.createdAt ?? dto?.created ?? new Date().toISOString(),
    text: dto?.description ?? dto?.text ?? '',
    minutes: dto?.minutes ?? dto?.minutesCompleted ?? 0,
  }
}

function mapForumDto(dto) {
  return {
    id: dto?.id ?? null,
    author:
      dto?.author ||
      dto?.userName ||
      `${dto?.name ?? ''} ${dto?.lastName ?? ''}`.trim() ||
      'Usuario',
    createdAt: dto?.createdAt ?? dto?.created ?? new Date().toISOString(),
    text: dto?.title ?? dto?.text ?? dto?.description ?? '',
  }
}

function mapCommentDto(dto) {
  return {
    id: dto?.id ?? null,
    author:
      dto?.author ||
      dto?.userName ||
      `${dto?.name ?? ''} ${dto?.lastName ?? ''}`.trim() ||
      'Usuario',
    createdAt: dto?.createdAt ?? dto?.created ?? new Date().toISOString(),
    text: dto?.text ?? dto?.description ?? dto?.comment ?? '',
  }
}

const auth = ref(readAuth())
const roleKey = computed(() => normalizeRole(auth.value?.role))
const userId = computed(() => auth.value?.userId ?? null)
const courseId = computed(() => Number(route.params.id))

const isTutor = computed(() => roleKey.value === 'TUTOR')
const isStudent = computed(() => roleKey.value === 'STUDENT')

const isEnrolled = ref(false)
const loading = ref(false)
const loadingEnroll = ref(false)
const pageError = ref('')

const loadingGrades = ref(false)
const savingGrade = ref(false)

const loadingReports = ref(false)
const savingReport = ref(false)

const loadingForums = ref(false)
const loadingComments = ref(false)
const savingForum = ref(false)
const savingComment = ref(false)

const course = ref({
  id: null,
  nombre: '',
  descripcion: '',
  fechaInicio: '',
  fechaFin: '',
  horario: '',
  estado: '',
  tutor: '',
  carrera: '',
})

const tutorInfo = ref('')
const participants = ref([])
const studentGrades = ref([])
const gradesByStudent = ref({})
const reports = ref([])
const forums = ref([])
const commentsByForum = ref({})

const navStudent = [
  { label: 'Principal', name: 'course-principal' },
  { label: 'Calificaciones', name: 'course-grades' },
  { label: 'Foro', name: 'course-forum' },
  { label: 'Reunión', name: 'course-meeting' },
]

const navTutor = [
  { label: 'Principal', name: 'course-principal' },
  { label: 'Calificaciones', name: 'course-grades' },
  { label: 'Foro', name: 'course-forum' },
  { label: 'Reunión', name: 'course-meeting' },
  { label: 'Reportes', name: 'course-reports' },
]

const showStudentNav = computed(() => isStudent.value && isEnrolled.value)

function buildTutorInfo() {
  const tutor = course.value.tutor || 'el tutor'
  const carrera = course.value.carrera || 'esta carrera'
  return `Mi nombre es ${tutor} y soy estudiante de la carrera de ${carrera}. Actualmente soy pasante dentro de esta plataforma para poder brindar apoyo académico a las personas que lo necesiten.`
}

function goTo(routeName) {
  router.push({ name: routeName, params: { id: route.params.id } })
}

function isActive(routeName) {
  return route.name === routeName
}

function getSavingState(routeName) {
  if (routeName === 'course-reports') return savingReport.value
  if (routeName === 'course-forum') return savingForum.value || savingComment.value
  return savingGrade.value
}

function getLoadingState(routeName) {
  if (routeName === 'course-reports') return loadingReports.value
  if (routeName === 'course-forum') return loadingForums.value || loadingComments.value
  return loadingGrades.value
}

async function loadStudentGrades() {
  if (!userId.value || !courseId.value) return

  try {
    loadingGrades.value = true
    const dto = await getMyGrades(userId.value, courseId.value)
    studentGrades.value = (dto?.grades ?? []).map(mapGradeDto)
  } catch {
    studentGrades.value = []
  } finally {
    loadingGrades.value = false
  }
}

async function loadTutorGradesByStudent(studentId) {
  if (!userId.value || !courseId.value || !studentId) return

  try {
    loadingGrades.value = true
    const list = await getGradesByStudent(userId.value, courseId.value, studentId)

    gradesByStudent.value = {
      ...gradesByStudent.value,
      [studentId]: (list ?? []).map(mapGradeDto),
    }
  } catch {
    gradesByStudent.value = {
      ...gradesByStudent.value,
      [studentId]: [],
    }
  } finally {
    loadingGrades.value = false
  }
}

async function handleSaveGrade(rows) {
  if (!userId.value || !courseId.value || !rows?.length) return

  try {
    savingGrade.value = true

    for (const row of rows) {
      await addGrade(userId.value, courseId.value, row.studentId, {
        activity: row.activity,
        score: row.score,
        maxScore: row.max,
        observations: row.observations,
      })
    }

    const firstStudentId = rows[0]?.studentId
    if (firstStudentId) {
      await loadTutorGradesByStudent(firstStudentId)
    }
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudieron guardar las calificaciones.'
  } finally {
    savingGrade.value = false
  }
}

async function loadReports() {
  if (!userId.value || !courseId.value || !isTutor.value) return

  try {
    loadingReports.value = true
    const list = await getReportsByCourse(userId.value, courseId.value)
    reports.value = (list ?? []).map(mapReportDto)
  } catch {
    reports.value = []
  } finally {
    loadingReports.value = false
  }
}

async function handleSaveReport(payload) {
  if (!userId.value || !courseId.value || !isTutor.value) return

  try {
    savingReport.value = true
    await addReport(userId.value, courseId.value, {
      description: payload.description,
      minutes: payload.minutes,
    })
    await loadReports()
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudo guardar el reporte.'
  } finally {
    savingReport.value = false
  }
}

async function loadForums() {
  if (!userId.value || !courseId.value) return

  try {
    loadingForums.value = true
    const list = await listForumsByCourse(userId.value, courseId.value)
    forums.value = (list ?? []).map(mapForumDto)
  } catch {
    forums.value = []
  } finally {
    loadingForums.value = false
  }
}

async function loadForumComments(forumId) {
  if (!userId.value || !forumId) return

  try {
    loadingComments.value = true
    const list = await listComments(userId.value, forumId)
    commentsByForum.value = {
      ...commentsByForum.value,
      [forumId]: (list ?? []).map(mapCommentDto),
    }
  } catch {
    commentsByForum.value = {
      ...commentsByForum.value,
      [forumId]: [],
    }
  } finally {
    loadingComments.value = false
  }
}

async function handleCreateForum(payload) {
  if (!userId.value || !courseId.value || !isTutor.value) return

  try {
    savingForum.value = true
    await createForum(userId.value, courseId.value, {
      title: payload.text,
    })
    await loadForums()
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudo crear el foro.'
  } finally {
    savingForum.value = false
  }
}

async function handleAddComment(payload) {
  if (!userId.value || !payload?.forumId) return

  try {
    savingComment.value = true
    await addComment(userId.value, payload.forumId, {
      text: payload.text,
    })
    await loadForumComments(payload.forumId)
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudo guardar el comentario.'
  } finally {
    savingComment.value = false
  }
}

async function loadStudentCourse() {
  const [detail, myCourses] = await Promise.all([
    getStudentCourseDetail(courseId.value),
    getMyCourses(userId.value),
  ])

  course.value = mapStudentCourse(detail)
  tutorInfo.value = buildTutorInfo()

  const myCourseIds = (myCourses ?? []).map((c) => Number(c?.id))
  isEnrolled.value = myCourseIds.includes(courseId.value)

  if (isEnrolled.value) {
    await loadStudentGrades()
    await loadForums()
  }
}

async function loadTutorCourse() {
  const [detail, students] = await Promise.all([
    getTutorCourseDetail(userId.value, courseId.value),
    getEnrolledStudents(userId.value, courseId.value),
  ])

  course.value = mapTutorCourse(detail)
  participants.value = (students ?? []).map(mapParticipant)
  isEnrolled.value = true

  const firstStudentId = participants.value[0]?.id
  if (firstStudentId) {
    await loadTutorGradesByStudent(firstStudentId)
  }

  await Promise.all([loadReports(), loadForums()])
}

function goLogin() {
  router.push({ name: 'login' })
}

async function loadPage() {
  pageError.value = ''

  if (!courseId.value) {
    pageError.value = 'No se pudo cargar la información del curso.'
    return
  }

  try {
    loading.value = true

    if (isTutor.value && userId.value) {
      await loadTutorCourse()
      return
    }

    if (isStudent.value && userId.value) {
      await loadStudentCourse()
      return
    }

    const detail = await getStudentCourseDetail(courseId.value)
    course.value = mapStudentCourse(detail)
    tutorInfo.value = buildTutorInfo()
    isEnrolled.value = false
    studentGrades.value = []
    forums.value = []
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudo cargar el curso.'
  } finally {
    loading.value = false
  }
}

async function inscribirse() {
  try {
    loadingEnroll.value = true
    pageError.value = ''

    await enrollInCourse(userId.value, courseId.value)
    isEnrolled.value = true
    await Promise.all([loadStudentGrades(), loadForums()])

    await router.push({ name: 'course-principal', params: { id: route.params.id } })
  } catch (e) {
    pageError.value = e?.response?.data || 'No se pudo realizar la inscripción.'
  } finally {
    loadingEnroll.value = false
  }
}

onMounted(async () => {
  auth.value = readAuth()
  await loadPage()
})
</script>

<style scoped>
.subnav {
  width: 100%;
  background: #0b4f77;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 25px;
}

.nav-item {
  background: transparent;
  border: 0;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  margin-inline: 50px;
}

.nav-item.active {
  text-decoration: underline;
  text-underline-offset: 6px;
}

.sep {
  color: white;
}

.course-area {
  padding: 60px;
}

.btn-wrap {
  display: flex;
  justify-content: center;
}

.btn {
  width: 220px;
  height: 54px;
  margin-top: 30px;
  padding-block: 10px;
  padding-inline: 40px;
  border-radius: 25px;
  border: 0;
  cursor: pointer;
  background: #1b4f78;
  color: #fff;
  font-size: 16px;
  font-weight: 700;
}

.btn:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn:hover:not(:disabled) {
  opacity: 0.92;
}

.state-text {
  text-align: center;
  font-size: 18px;
  font-weight: 700;
}
</style>