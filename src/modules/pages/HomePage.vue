<template>
  <main>
    <section class="hero-carousel" aria-label="Carrusel de inicio">
      <button class="tap-zone left" type="button" aria-label="Anterior" @click="prev" />
      <button class="tap-zone right" type="button" aria-label="Siguiente" @click="next" />

      <div class="track" :style="trackStyle">
        <div v-for="(s, i) in slides" :key="i" class="slide" :style="{ backgroundColor: s.bg }">
          <div class="content">
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
      <div class="courses-title">Cursos Disponibles</div>

      <div class="wrap-local">
        <p v-if="loadingCourses" class="state-text">Cargando cursos...</p>
        <p v-else-if="coursesError" class="state-text">{{ coursesError }}</p>

        <template v-else>
          <CoursesCard
            v-if="cursosDisponibles.length"
            :cursos="cursosDisponibles"
            :mostrar-estado="false"
          />

          <p v-else class="state-text">No hay cursos disponibles.</p>
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
  { title: 'Bienvenido al Programa de Tutorías', subtitle: '', bg: '#e1f4ff' },
  { title: 'Encuentra cursos disponibles', subtitle: 'y elige tu tutor', bg: '#fff5f5' },
  { title: 'Aprende a tu ritmo', subtitle: 'mejora tus resultados', bg: '#e9e9e9' },
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
.hero-carousel {
  position: relative;
  width: 100%;
  height: 50vh;
  overflow: hidden;
}

.track {
  height: 100%;
  display: flex;
  transition: transform 350ms ease;
  will-change: transform;
}

.slide {
  min-width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.content {
  width: min(900px, 80%);
  text-align: center;
  padding: 0 60px;
}

.title {
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  color: #000;
}

.subtitle {
  margin: 8px 0 0;
  font-size: 18px;
  color: rgba(0, 0, 0, 0.7);
}

.tap-zone {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 5%;
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
  bottom: 12px;
  left: 0;
  right: 0;
  display: flex;
  gap: 10px;
  justify-content: center;
  z-index: 4;
}

.dot {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.25);
}

.dot.active {
  background: rgba(0, 0, 0, 0.75);
}

.courses-section {
  background: #0b4f77;
  padding: 18px 40px 26px;
}

.courses-title {
  color: #fff;
  text-align: center;
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
}

.wrap-local {
  background: #d9d9d9;
  border-radius: 22px;
  padding: 14px;
}

.state-text {
  margin: 10px 0;
  font-size: 16px;
  text-align: center;
}

.courses-section :deep(.wrap) {
  background: #d9d9d9;
  border-radius: 22px;
}
</style>
