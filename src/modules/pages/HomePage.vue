<template>
  <main class="home-page">
    <section class="hero-carousel" aria-label="Carrusel de inicio">
      <button class="tap-zone left" type="button" aria-label="Anterior" @click="prev" />
      <button class="tap-zone right" type="button" aria-label="Siguiente" @click="next" />

      <div class="track" :style="trackStyle">
        <div v-for="(s, i) in slides" :key="i" class="slide">
          <div class="hero-card">
            <div class="hero-kicker">Proyecto Tutorías</div>
            <h2 class="title">{{ s.title }}</h2>
            <p v-if="s.subtitle" class="subtitle">{{ s.subtitle }}</p>
          </div>
        </div>
      </div>

      <div class="dots" v-if="slides.length > 1">
        <button
          v-for="(_, i) in slides"
          :key="i"
          class="dot"
          :class="{ active: i === current }"
          type="button"
          :aria-label="`Ir al slide ${i + 1}`"
          @click="goTo(i)"
        />
      </div>
    </section>

    <section class="courses-section">
      <div class="courses-band">
        <h3 class="courses-title">Cursos disponibles</h3>
      </div>

      <div class="wrap-local">
        <p v-if="loadingCourses" class="state-text">Cargando cursos...</p>
        <p v-else-if="coursesError" class="state-text">{{ coursesError }}</p>

        <template v-else>
          <CoursesCard
            v-if="cursosDisponibles.length"
            :cursos="cursosDisponibles"
            :mostrar-estado="false"
          />

          <div v-else class="no-courses">
            <FontAwesomeIcon class="no-courses-icon" :icon="['fas', 'graduation-cap']" />
            <p class="no-courses-title">Aún no hay cursos disponibles</p>
            <p class="no-courses-text">
              Estamos preparando nuevas tutorías. Mantente atento a esta página: muy pronto
              publicaremos más cursos para que puedas inscribirte.
            </p>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import CoursesCard from '../components/CoursesComponent.vue'
import { getAvailableCourses } from '../helpers/studentHelper'

const slides = [
  {
    title: 'Bienvenido al Proyecto Tutorías',
    subtitle: 'Encuentra acompañamiento académico en un solo lugar.',
  },
  { title: 'Explora cursos y tutores', subtitle: 'Inscríbete fácilmente y sigue tu progreso.' },
  { title: 'Aprende a tu ritmo', subtitle: 'Accede a foros, calificaciones y reuniones.' },
]

function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const auth = ref(readAuth())
const userIdForAvailable = computed(() => auth.value?.userId ?? 0)

const current = ref(0)
const trackStyle = computed(() => ({
  transform: `translateX(-${current.value * 100}%)`,
}))

function next() {
  current.value = (current.value + 1) % slides.length
}

function prev() {
  current.value = (current.value - 1 + slides.length) % slides.length
}

function goTo(i) {
  current.value = i
}

let intervalId = null

const cursosDisponibles = ref([])
const loadingCourses = ref(false)
const coursesError = ref('')

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

async function loadAvailableCourses() {
  coursesError.value = ''
  try {
    loadingCourses.value = true
    const list = await getAvailableCourses(userIdForAvailable.value)
    cursosDisponibles.value = (list ?? []).map(mapCourseCardDto)
  } catch (e) {
    cursosDisponibles.value = []
    coursesError.value = e?.response?.data || 'No se pudieron cargar los cursos.'
  } finally {
    loadingCourses.value = false
  }
}

onMounted(async () => {
  intervalId = setInterval(next, 6000)
  auth.value = readAuth()
  await loadAvailableCourses()
})

onBeforeUnmount(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<style scoped>
.home-page {
  background: #ffffff;
}

.hero-carousel {
  position: relative;
  width: 100%;
  min-height: 340px;
  overflow: hidden;
  background: linear-gradient(135deg, #003a5c 0%, #004671 45%, #0a6ba8 100%);
}

.track {
  height: 100%;
  display: flex;
  transition: transform 350ms ease;
  will-change: transform;
}

.slide {
  min-width: 100%;
  min-height: 340px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.hero-card {
  width: 100%;
  max-width: 760px;
  background: transparent;
  padding: 24px 20px;
  text-align: center;
}

.hero-kicker {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: #d6b14a;
  margin-bottom: 14px;
}

.title {
  margin: 0;
  font-size: 32px;
  line-height: 1.22;
  font-weight: 800;
  color: #ffffff;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.18);
}

.subtitle {
  margin: 14px 0 0;
  font-size: 17px;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.92);
}

.tap-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 7%;
  border: 0;
  background: transparent;
  cursor: pointer;
  z-index: 3;
}

.tap-zone.left {
  left: 0;
}

.tap-zone.right {
  right: 0;
}

.dots {
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  justify-content: center;
  z-index: 4;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.5);
  transition:
    width 0.2s ease,
    background 0.2s ease;
}

.dot.active {
  width: 26px;
  background: #d6b14a;
}

.courses-section {
  padding: 36px 18px;
}

.courses-band {
  background: #004671;
  border-radius: 24px 24px 0 0;
  padding: 16px 20px;
}

.courses-title {
  color: #fff;
  text-align: center;
  font-weight: 700;
  font-size: 18px;
  margin: 0;
}

.wrap-local {
  background: #e0e0e0;
  border-radius: 0 0 24px 24px;
  padding: 20px;
}

.state-text {
  margin: 10px 0;
  font-size: 16px;
  text-align: center;
}

.no-courses {
  text-align: center;
  padding: 30px 20px 34px;
  max-width: 540px;
  margin: 0 auto;
}

.no-courses-icon {
  font-size: 46px;
  color: #004671;
  opacity: 0.85;
  margin-bottom: 14px;
}

.no-courses-title {
  margin: 0 0 8px;
  font-size: 20px;
  font-weight: 800;
  color: #111827;
}

.no-courses-text {
  margin: 0;
  font-size: 15px;
  line-height: 1.55;
  color: rgba(17, 24, 39, 0.72);
  text-align: center;
}

.courses-section :deep(.wrap) {
  padding: 8px;
  min-height: 0;
}

@media (max-width: 768px) {
  .hero-carousel,
  .slide {
    min-height: 300px;
  }

  .hero-card {
    min-height: auto;
    padding: 26px 20px;
    border-radius: 24px;
  }

  .title {
    font-size: 22px;
  }

  .subtitle {
    font-size: 15px;
  }

  .courses-section {
    padding: 0 12px 26px;
  }
}

@media (max-width: 480px) {
  .slide {
    padding-inline: 14px;
  }

  .hero-card {
    padding: 22px 18px;
  }

  .title {
    font-size: 20px;
  }

  .tap-zone {
    width: 12%;
  }
}
</style>
