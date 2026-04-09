<template>
  <section>
    <div v-if="isTutor && mode === 'view'" class="topbar">
      <div class="left-controls">
        <label class="lbl">Estudiante:</label>

        <select v-model="selectedStudentId" class="select" @change="emitLoadStudentGrades">
          <option v-for="s in normalizedStudents" :key="s.id" :value="s.id">
            {{ s.nombre }}
          </option>
        </select>
      </div>

      <button class="btn-action" type="button" @click="startAdd" :disabled="saving">
        Agregar calificaciones
      </button>
    </div>

    <div v-if="isTutor && mode === 'add'" class="topbar">
      <div class="left-controls">
        <label class="lbl">Actividad:</label>

        <input
          v-model.trim="activityName"
          class="input"
          type="text"
          placeholder="Actividad 3"
          :disabled="saving"
        />
      </div>

      <div class="right-actions">
        <button class="btn-cancel" type="button" @click="cancelAdd" :disabled="saving">
          Cancelar
        </button>

        <button
          class="btn-action"
          type="button"
          :disabled="saveDisabled || saving"
          @click="saveActivity"
        >
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <p v-if="isTutor && mode === 'add' && saveDisabled" class="hint-top">
      Debes ingresar una actividad y una nota para todos los estudiantes.
    </p>

    <p v-if="loading" class="hint-top">Cargando calificaciones...</p>

    <div>
      <table v-if="mode === 'view'" class="table">
        <thead>
          <tr>
            <th class="w-activity">Actividad</th>
            <th class="w-score">Nota</th>
            <th class="w-max">Calificación máxima</th>
            <th class="w-obs">Observaciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(r, idx) in rowsToShow" :key="r.id ?? idx">
            <td class="cell-center b">{{ r.activity }}</td>
            <td class="cell-center">{{ r.score }}</td>
            <td class="cell-center b">{{ r.max }}</td>
            <td class="cell-left">{{ r.observations || '' }}</td>
          </tr>

          <tr v-if="rowsToShow.length === 0">
            <td colspan="4">No hay calificaciones aún.</td>
          </tr>
        </tbody>
      </table>

      <table v-else class="table">
        <thead>
          <tr>
            <th class="w-activity">Estudiante</th>
            <th class="w-score">Nota</th>
            <th class="w-max">Calificación máxima</th>
            <th class="w-obs">Observaciones</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(r, idx) in draftRows" :key="r.studentId">
            <td class="cell-center b">{{ r.student }}</td>

            <td class="cell-center">
              <div class="score-cell">
                <input
                  class="cell-input"
                  type="text"
                  inputmode="decimal"
                  maxlength="5"
                  placeholder="-"
                  :value="draftRows[idx].score"
                  @input="onScoreInput($event, idx)"
                  @blur="onScoreBlur(idx)"
                  :disabled="saving"
                />

                <div v-if="draftRows[idx].scoreError" class="cell-error">
                  {{ draftRows[idx].scoreError }}
                </div>
              </div>
            </td>

            <td class="cell-center b">{{ maxScore }}</td>

            <td class="cell-left">
              <input
                class="cell-input cell-input-text"
                type="text"
                v-model.trim="draftRows[idx].observations"
                placeholder=""
                :disabled="saving"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  role: { type: String, default: 'STUDENT' },
  students: { type: Array, default: () => [] },
  studentGrades: { type: Array, default: () => [] },
  gradesByStudent: { type: Object, default: () => ({}) },
  saving: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  maxScore: { type: Number, default: 20 },
})

const emit = defineEmits(['save-grade', 'load-student-grades'])

const roleKey = computed(() =>
  String(props.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isTutor = computed(() => roleKey.value === 'TUTOR')

const normalizedStudents = computed(() =>
  (props.students ?? []).map((s) => ({
    id: s?.id ?? s?.studentId ?? null,
    nombre: s?.nombre || `${s?.name ?? ''} ${s?.lastName ?? ''}`.trim() || 'Sin nombre',
  })),
)

const selectedStudentId = ref(null)
const mode = ref('view')
const activityName = ref('')
const draftRows = ref([])

watch(
  normalizedStudents,
  (list) => {
    if (!list.length) {
      selectedStudentId.value = null
      return
    }

    const exists = list.some((s) => s.id === selectedStudentId.value)
    if (!exists) {
      selectedStudentId.value = list[0].id
    }
  },
  { immediate: true },
)

watch(selectedStudentId, (value) => {
  if (isTutor.value && mode.value === 'view' && value != null) {
    emit('load-student-grades', value)
  }
})

const rowsToShow = computed(() => {
  if (!isTutor.value) return props.studentGrades ?? []
  return props.gradesByStudent?.[selectedStudentId.value] ?? []
})

function startAdd() {
  mode.value = 'add'
  activityName.value = ''
  draftRows.value = normalizedStudents.value.map((s) => ({
    studentId: s.id,
    student: s.nombre,
    score: '',
    scoreError: '',
    observations: '',
  }))
}

function cancelAdd() {
  mode.value = 'view'
  activityName.value = ''
  draftRows.value = []
}

function emitLoadStudentGrades() {
  if (!isTutor.value || selectedStudentId.value == null) return
  emit('load-student-grades', selectedStudentId.value)
}

function onScoreInput(e, idx) {
  const prev = String(draftRows.value[idx].score ?? '')
  let v = String(e.target.value ?? '')

  v = v.replace(/,/g, '.')
  v = v.replace(/[^\d.]/g, '')

  if (v.startsWith('.')) v = '0' + v

  const parts0 = v.split('.')
  if (parts0.length > 2) v = parts0[0] + '.' + parts0.slice(1).join('')

  let [intPart, decPart] = v.split('.')
  intPart = intPart ?? ''
  decPart = decPart ?? ''

  if (intPart.length > 1) {
    intPart = intPart.replace(/^0+/, '')
    if (intPart === '') intPart = '0'
  }

  if (intPart.length > 2) intPart = intPart.slice(0, 2)
  if (decPart.length > 2) decPart = decPart.slice(0, 2)

  const hasDot = v.includes('.')
  let next = hasDot ? `${intPart}.${decPart}` : intPart

  if (next.length > 5) next = next.slice(0, 5)

  const num = next === '' || next === '.' ? NaN : Number(next)
  if (next !== '' && !Number.isFinite(num)) {
    draftRows.value[idx].scoreError = 'Número no permitido.'
    e.target.value = prev
    return
  }

  if (Number.isFinite(num) && num > props.maxScore) {
    draftRows.value[idx].scoreError = `La nota debe estar entre 0 y ${props.maxScore}.`
    e.target.value = prev
    return
  }

  draftRows.value[idx].score = next
  draftRows.value[idx].scoreError = ''
  e.target.value = next
}

function onScoreBlur(idx) {
  let v = String(draftRows.value[idx].score ?? '').trim()
  if (v === '') return

  if (v.endsWith('.')) v = v.slice(0, -1)

  if (v === '') {
    draftRows.value[idx].score = ''
    draftRows.value[idx].scoreError = ''
    return
  }

  const okFormat = /^\d{1,2}(\.\d{1,2})?$/.test(v)
  const n = Number(v)

  if (!okFormat || !Number.isFinite(n) || n < 0 || n > props.maxScore) {
    draftRows.value[idx].scoreError =
      `Número no permitido. (0 a ${props.maxScore}, máx 2 decimales)`
    return
  }

  const [ip, dp] = v.split('.')
  let ip2 = ip
  if (ip2.length > 1) ip2 = ip2.replace(/^0+/, '') || '0'
  const final = dp !== undefined ? `${ip2}.${dp}` : ip2

  if (Number(final) > props.maxScore) {
    draftRows.value[idx].scoreError = `La nota debe estar entre 0 y ${props.maxScore}.`
    return
  }

  draftRows.value[idx].score = final
  draftRows.value[idx].scoreError = ''
}

const saveDisabled = computed(() => {
  if (!isTutor.value) return true
  if (String(activityName.value).trim().length === 0) return true

  for (const r of draftRows.value) {
    const v = String(r.score ?? '').trim()
    if (v === '') return true
    if (v.endsWith('.')) return true
    if (!/^\d{1,2}(\.\d{1,2})?$/.test(v)) return true

    const n = Number(v)
    if (!Number.isFinite(n)) return true
    if (n < 0 || n > props.maxScore) return true
    if (r.scoreError) return true
  }

  return false
})

function saveActivity() {
  if (saveDisabled.value) return

  emit(
    'save-grade',
    draftRows.value.map((r) => ({
      studentId: r.studentId,
      activity: activityName.value.trim(),
      score: Number(r.score),
      max: props.maxScore,
      observations: r.observations ?? '',
    })),
  )

  mode.value = 'view'
  activityName.value = ''
  draftRows.value = []
}
</script>

<style scoped>
.topbar {
  width: 100%;
  padding-bottom: 30px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.right-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.lbl {
  font-size: 18px;
  font-weight: 600;
}

.select,
.input {
  height: 50px;
  border-radius: 15px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding-inline: 20px;
  font-size: 16px;
  outline: none;
  background: #fff;
  min-width: 350px;
}

.select:focus,
.input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.btn-action {
  width: 220px;
  height: 44px;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
}

.btn-action:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.hint-top {
  width: min(1100px, 100%);
  margin: 0px 0px 20px 12px;
  font-size: 16px;
  font-weight: 600;
  text-align: left;
  color: rgba(0, 0, 0, 0.7);
}

.table {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.table th {
  background: #0b4f77;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  padding: 20px 10px;
  border: 2px solid #000000;
}

.table td {
  background: #fff;
  border: 2px solid #000;
  padding: 16px 12px;
  font-size: 16px;
}

.w-activity {
  width: 35%;
}
.w-score {
  width: 12%;
}
.w-max {
  width: 14%;
}
.w-obs {
  width: 39%;
}

.cell-center {
  text-align: center;
}

.cell-left {
  text-align: justify;
}

.b {
  font-weight: 800;
}

.cell-input {
  width: 90px;
  height: 34px;
  border-radius: 10px;
  border: 1px solid rgba(0, 0, 0, 0.18);
  padding: 0 10px;
  font-size: 16px;
  text-align: center;
  outline: none;
}

.cell-input-text {
  width: 96%;
  text-align: justify;
}

.cell-input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.btn-cancel {
  height: 40px;
  padding: 0 18px;
  border-radius: 18px;
  border: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.12);
  font-weight: 700;
  font-size: 16px;
}

.btn-cancel:hover {
  opacity: 0.9;
}

.score-cell {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.cell-error {
  font-size: 16px;
  font-weight: 700;
  color: #b00020;
  line-height: 1.1;
  max-width: 120px;
}
</style>
