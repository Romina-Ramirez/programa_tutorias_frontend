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
          <div class="line" v-if="c.fechaInicio">
            <span class="b">Fecha de inicio:</span> {{ c.fechaInicio }}
          </div>
          <div class="line" v-if="c.fechaFin">
            <span class="b">Fecha de fin:</span> {{ c.fechaFin }}
          </div>
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

function normalizeEstado(e) {
  const v = String(e ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')

  if (v === 'ACTIVE') return 'ACTIVE'
  if (v === 'IN_PROGRESS') return 'IN_PROGRESS'
  if (v === 'INACTIVE') return 'INACTIVE'
  if (v === 'ACTIVO') return 'ACTIVE'
  if (v === 'EN_CURSO' || v === 'EN_CURSO.' || v === 'EN_CURSO,' || v === 'EN_CURSO;')
    return 'IN_PROGRESS'
  if (v === 'EN_PROGRESO') return 'IN_PROGRESS'
  if (v === 'FINALIZADO') return 'INACTIVE'
  if (v === 'INACTIVO') return 'INACTIVE'
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
  display: grid;
  grid-template-columns: 240px minmax(0, 1fr);
  gap: 20px;
  padding: 16px;
  min-height: 420px;
  align-items: flex-start;
}

.filters {
  background: #fff;
  border-radius: 24px;
  padding: 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
}

.search {
  margin-bottom: 12px;
}

.search-input {
  width: 100%;
  min-height: 40px;
  border-radius: 999px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 14px;
  outline: none;
  font-size: 15px;
}

.search-input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.filter-block + .filter-block {
  margin-top: 16px;
}

.filter-title {
  font-weight: 800;
  font-size: 15px;
  margin-bottom: 10px;
  color: #111827;
}

.check {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  margin: 9px 0;
}

.muted {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.6);
  margin: 10px 0 0;
}

.content {
  min-width: 0;
}

.messages {
  margin: 0 0 12px;
}

.msg {
  margin: 0 0 6px;
  font-size: 14px;
  color: #374151;
}

.grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.card {
  background: #fff;
  border-radius: 24px;
  padding: 18px 18px 16px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 8px;
}

.card-title {
  font-weight: 800;
  font-size: 16px;
  letter-spacing: 0.3px;
  line-height: 1.35;
  margin-bottom: 4px;
}

.line {
  font-size: 14px;
  line-height: 1.45;
}

.b {
  font-weight: 700;
}

.horario {
  margin-top: 4px;
  font-size: 14px;
  line-height: 1.35;
}

.estado {
  margin-top: 6px;
  font-weight: 800;
  font-size: 14px;
  letter-spacing: 0.2px;
  color: #004671;
}

.btn {
  margin: 12px auto 0;
  min-width: 160px;
  min-height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
}

.btn:hover {
  opacity: 0.92;
}

.empty {
  margin-top: 18px;
  text-align: center;
  font-size: 15px;
}

.pagination {
  margin-top: 18px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 14px;
  flex-wrap: wrap;
}

.page-btn {
  min-height: 36px;
  padding: 0 14px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
}

.page-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.page-info {
  font-size: 14px;
  font-weight: 700;
}

@media (max-width: 1080px) {
  .grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 860px) {
  .wrap {
    grid-template-columns: 1fr;
    padding: 10px 6px;
  }

  .filters {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }

  .card {
    border-radius: 20px;
    padding: 16px 14px;
  }

  .btn {
    width: 100%;
  }
}
</style>
