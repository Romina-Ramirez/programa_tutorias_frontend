<template>
  <section class="wrap">
    <aside class="filters">
      <div class="search">
        <input v-model.trim="search" type="text" placeholder="Búsqueda" class="search-input" />
      </div>

      <div class="filter-block">
        <div class="filter-title">Materia</div>

        <label v-for="m in materiasUnicas" :key="m" class="check">
          <input type="checkbox" :value="m" v-model="materiasSeleccionadas" />
          <span>{{ m }}</span>
        </label>

        <p v-if="materiasUnicas.length === 0" class="muted">No hay materias disponibles.</p>
      </div>

      <div v-if="mostrarEstado" class="filter-block">
        <div class="filter-title">Estado del curso</div>

        <label v-for="e in ESTADOS" :key="e.key" class="check">
          <input type="checkbox" :value="e.key" v-model="estadosSeleccionados" />
          <span>{{ e.label }}</span>
        </label>
      </div>
    </aside>

    <div class="content">
      <div v-if="mostrarEstado && mensajesEstadosVacios.length" class="messages">
        <p v-for="msg in mensajesEstadosVacios" :key="msg" class="msg">
          {{ msg }}
        </p>
      </div>

      <div class="grid">
        <article v-for="c in cursosPaginados" :key="c.id ?? c.codigo ?? c.nombre" class="card">
          <div class="card-title">{{ getTitulo(c) }}</div>

          <div class="line"><span class="b">Materia:</span> {{ c.materia ?? '-' }}</div>

          <br />
          <div class="line" v-if="c.fechaInicio">
            <span class="b">Fecha de Inicio:</span> {{ c.fechaInicio }}
          </div>
          <div class="line" v-if="c.fechaFin">
            <span class="b">Fecha de Fin:</span> {{ c.fechaFin }}
          </div>

          <br />
          <div class="line" v-if="c.horario">
            <span class="b">Horario:</span>
            <div class="horario">{{ c.horario }}</div>
          </div>

          <div v-if="mostrarEstado" class="estado">
            {{ formatEstado(c.estado) }}
          </div>

          <button class="btn" type="button" @click="irAlCurso(c)">Ver curso</button>
        </article>
      </div>

      <p v-if="cursosFiltrados.length === 0" class="empty">
        No existen cursos para los filtros seleccionados.
      </p>

      <div v-if="totalPages > 1" class="pagination">
        <button class="page-btn" :disabled="page === 1" @click="page--">Anterior</button>
        <span class="page-info">Página {{ page }} de {{ totalPages }}</span>
        <button class="page-btn" :disabled="page === totalPages" @click="page++">Siguiente</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'

const props = defineProps({
  cursos: { type: Array, default: () => [] },
  mostrarEstado: { type: Boolean, default: false },
  pageSize: { type: Number, default: 6 },
})

const router = useRouter()

/** ✅ Keys para filtrar (EN) + Labels para mostrar (ES) */
const ESTADOS = [
  { key: 'ACTIVE', label: 'Activo' },
  { key: 'IN_PROGRESS', label: 'En progreso' },
  { key: 'INACTIVE', label: 'Inactivo' },
]

const STATUS_LABEL_ES = {
  ACTIVE: 'ACTIVO',
  IN_PROGRESS: 'EN PROGRESO',
  INACTIVE: 'INACTIVO',
}

const search = ref('')
const materiasSeleccionadas = ref([])
const estadosSeleccionados = ref([])
const page = ref(1)

const materiasUnicas = computed(() => {
  const set = new Set()
  for (const c of props.cursos) {
    if (c?.materia) set.add(String(c.materia))
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'))
})

watch(materiasUnicas, (list) => {
  materiasSeleccionadas.value = materiasSeleccionadas.value.filter((m) => list.includes(m))
})

watch(
  () => props.mostrarEstado,
  (v) => {
    if (!v) estadosSeleccionados.value = []
  },
  { immediate: true },
)

/**
 * ✅ Normaliza cualquier cosa a las KEYS del backend:
 * ACTIVE | IN_PROGRESS | INACTIVE
 * (compat: ACTIVO/EN CURSO/FINALIZADO/etc)
 */
function normalizeEstado(e) {
  const v = String(e ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  if (v === 'ACTIVE') return 'ACTIVE'
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'INACTIVE') return 'INACTIVE'

  // Compatibles con tus valores viejos en español
  if (v === 'ACTIVO') return 'ACTIVE'
  if (v === 'EN_CURSO' || v === 'EN_CURSO.' || v === 'EN_CURSO,' || v === 'EN_CURSO;')
    return 'IN_PROGRESS'
  if (v === 'EN_CURSO' || v === 'EN_CURSO') return 'IN_PROGRESS'
  if (v === 'EN_CURSO') return 'IN_PROGRESS'
  if (v === 'EN_CURSO' || v === 'EN_CURSO') return 'IN_PROGRESS'
  if (v === 'EN_CURSO' || v === 'ENCURSO') return 'IN_PROGRESS'
  if (v === 'EN_PROGRESO') return 'IN_PROGRESS'
  if (v === 'FINALIZADO') return 'INACTIVE'
  if (v === 'INACTIVO') return 'INACTIVE'

  // fallback: si llega algo raro, lo devolvemos como está
  return v
}

function formatEstado(e) {
  const key = normalizeEstado(e)
  return STATUS_LABEL_ES[key] || key
}

function getTitulo(c) {
  return (c?.nombre ?? c?.titulo ?? c?.nombreCurso ?? 'CURSO').toString().toUpperCase()
}

const baseFiltrados = computed(() => {
  const q = search.value.toLowerCase()

  return props.cursos.filter((c) => {
    const materiaOk =
      materiasSeleccionadas.value.length === 0 ||
      materiasSeleccionadas.value.includes(String(c.materia ?? ''))

    const texto = `${c?.nombre ?? ''} ${c?.titulo ?? ''} ${c?.materia ?? ''}`.toLowerCase()
    const searchOk = q === '' || texto.includes(q)

    return materiaOk && searchOk
  })
})

const mensajesEstadosVacios = computed(() => {
  if (!props.mostrarEstado) return []
  if (estadosSeleccionados.value.length === 0) return []

  const msgs = []
  for (const e of ESTADOS) {
    if (!estadosSeleccionados.value.includes(e.key)) continue

    const count = baseFiltrados.value.filter((c) => normalizeEstado(c.estado) === e.key).length
    if (count === 0) msgs.push(`No existen cursos en estado ${e.label}.`)
  }
  return msgs
})

const cursosFiltrados = computed(() => {
  if (!props.mostrarEstado) return baseFiltrados.value
  if (estadosSeleccionados.value.length === 0) return baseFiltrados.value

  return baseFiltrados.value.filter((c) =>
    estadosSeleccionados.value.includes(normalizeEstado(c.estado)),
  )
})

watch([search, materiasSeleccionadas, estadosSeleccionados, () => props.cursos], () => {
  page.value = 1
})

const totalPages = computed(() =>
  Math.max(1, Math.ceil(cursosFiltrados.value.length / props.pageSize)),
)

const cursosPaginados = computed(() => {
  const start = (page.value - 1) * props.pageSize
  return cursosFiltrados.value.slice(start, start + props.pageSize)
})

watch(totalPages, (tp) => {
  if (page.value > tp) page.value = tp
})

function irAlCurso(curso) {
  sessionStorage.setItem('selectedCurso', JSON.stringify(curso))
  router.push({ name: 'course-principal', params: { id: curso.id } })
}
</script>

<style scoped>
.wrap {
  display: flex;
  gap: 24px;
  padding: 18px 20px;
  background: transparent;
  min-height: 420px;
  align-items: flex-start;
}

.filters {
  width: 220px;
  height: fit-content;
  background: #fff;
  border-radius: 22px;
  padding: 14px 14px 18px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
}

.search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  height: 34px;
  border-radius: 18px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 12px;
  outline: none;
  font-size: 16px;
  box-sizing: border-box;
}

.search-input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.filter-block {
  margin-top: 12px;
}

.filter-title {
  font-weight: 800;
  font-size: 16px;
  margin-bottom: 8px;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  margin: 8px 0;
}

.muted {
  font-size: 16px;
  color: rgba(0, 0, 0, 0.6);
  margin: 10px 0 0;
}

.content {
  flex: 1;
}

.messages {
  margin: 0 0 12px;
}
.msg {
  margin: 0 0 6px;
  font-size: 16px;
  color: #000;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(220px, 1fr));
  gap: 18px;
}

.card {
  width: 100%;
  background: #fff;
  border-radius: 22px;
  padding: 14px 18px 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  text-align: center;
}

.card-title {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: 0.4px;
  margin-bottom: 10px;
}

.line {
  font-size: 16px;
  margin: 4px 0;
}

.b {
  font-weight: 500;
}

.horario {
  margin-top: 2px;
  font-size: 16px;
  line-height: 1.25;
}

.estado {
  margin-top: 10px;
  font-weight: 900;
  font-size: 16px;
  letter-spacing: 0.3px;
}

.btn {
  margin-top: 12px;
  width: 170px;
  height: 34px;
  border-radius: 18px;
  border: 0;
  cursor: pointer;
  background: #1b4f78;
  color: #fff;
  font-size: 16px;
  font-weight: 500;
}

.btn:hover {
  opacity: 0.9;
}

.empty {
  margin-top: 18px;
  text-align: center;
  font-size: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
}

.page-btn {
  height: 34px;
  padding: 0 14px;
  border-radius: 14px;
  border: 0;
  cursor: pointer;
  background: #1b4f78;
  color: #fff;
  font-weight: 500;
  font-size: 16px;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-info {
  font-size: 16px;
  font-weight: 700;
}
</style>
