<template>
  <section class="reports">
    <button
      class="btn-add"
      type="button"
      @click="openModal"
      :disabled="saving"
    >
      {{ saving ? 'Guardando...' : 'Agregar reporte' }}
    </button>

    <div class="list">
      <article v-for="r in reportsSorted" :key="r.id" class="report-card">
        <div class="meta">Creado: {{ formatDateTime(r.createdAt) }}</div>

        <p class="text">
          {{ r.text }}
        </p>

        <div class="minutes">Minutos realizados: {{ r.minutes }}</div>
      </article>

      <p v-if="reportsSorted.length === 0 && !loading" class="empty">No hay reportes aún.</p>
      <p v-if="loading" class="empty">Cargando reportes...</p>
    </div>

    <div
      v-if="showModal"
      class="overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Agregar reporte"
      @click="closeModal"
    >
      <div class="modal" @click.stop>
        <button class="modal-close" type="button" aria-label="Cerrar" @click="closeModal">
          <span aria-hidden="true">×</span>
        </button>

        <textarea
          v-model.trim="draftDescription"
          class="modal-textarea"
          placeholder="Descripción de la actividad"
          rows="9"
          :disabled="saving"
        />

        <div class="minutes-box">
          <input
            class="modal-input"
            :value="draftMinutes"
            inputmode="numeric"
            autocomplete="off"
            placeholder="Minutos realizados"
            @keydown="onMinutesKeydown"
            @input="onMinutesInput"
            :disabled="saving"
          />

          <p v-if="minutesMsg" class="err">{{ minutesMsg }}</p>
        </div>

        <button class="btn-submit" type="button" :disabled="submitDisabled || saving" @click="submitReport">
          {{ saving ? 'Ingresando...' : 'Ingresar Reporte' }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'

const props = defineProps({
  reports: { type: Array, default: () => [] },
  saving: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['save-report'])

const MAX_MINUTES = 360

const reportsSorted = computed(() => {
  return [...(props.reports ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
})

const showModal = ref(false)
const draftDescription = ref('')
const draftMinutes = ref('')
const minutesMsg = ref('')

let minutesMsgTimer = null

function setMinutesMsg(msg) {
  minutesMsg.value = msg
  if (minutesMsgTimer) clearTimeout(minutesMsgTimer)
  minutesMsgTimer = setTimeout(() => {
    minutesMsg.value = ''
  }, 1800)
}

onBeforeUnmount(() => {
  if (minutesMsgTimer) clearTimeout(minutesMsgTimer)
})

function openModal() {
  showModal.value = true
  draftDescription.value = ''
  draftMinutes.value = ''
  minutesMsg.value = ''
}

function closeModal() {
  if (props.saving) return
  showModal.value = false
  draftDescription.value = ''
  draftMinutes.value = ''
  minutesMsg.value = ''
}

function onMinutesKeydown(e) {
  const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End']
  if (allowed.includes(e.key)) return

  if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(e.key.toLowerCase())) return

  if (!/^\d$/.test(e.key)) {
    e.preventDefault()
    setMinutesMsg('Solo se permiten números enteros.')
    return
  }

  const current = String(draftMinutes.value ?? '')
  const hasSelection = e.target?.selectionStart !== e.target?.selectionEnd

  if ((current.length === 0 || (hasSelection && current.length === 1)) && e.key === '0') {
    e.preventDefault()
    setMinutesMsg('No puedes iniciar con 0.')
    return
  }

  const nextStr = (current + e.key).replace(/^0+/, '')
  const next = Number(nextStr)

  if (!Number.isNaN(next) && next > MAX_MINUTES) {
    e.preventDefault()
    setMinutesMsg(`Máximo ${MAX_MINUTES} minutos (6 horas).`)
  }
}

function onMinutesInput(e) {
  const raw = String(e.target.value ?? '')
  let v = raw.replace(/\D/g, '')

  if (raw !== v) setMinutesMsg('Solo se permiten números enteros.')

  if (v.startsWith('0')) {
    v = v.replace(/^0+/, '')
    setMinutesMsg('No puedes iniciar con 0.')
  }

  if (v === '') {
    draftMinutes.value = ''
    e.target.value = ''
    return
  }

  if (v.length > 3) v = v.slice(0, 3)

  let n = Number(v)

  if (n === 0) {
    draftMinutes.value = ''
    e.target.value = ''
    setMinutesMsg('Debe ser un entero positivo (mínimo 1).')
    return
  }

  if (n > MAX_MINUTES) {
    n = MAX_MINUTES
    v = String(MAX_MINUTES)
    setMinutesMsg(`Máximo ${MAX_MINUTES} minutos (6 horas).`)
  }

  draftMinutes.value = v
  e.target.value = v
}

const minutesValid = computed(() => {
  const n = Number(draftMinutes.value)
  return Number.isInteger(n) && n >= 1 && n <= MAX_MINUTES
})

const submitDisabled = computed(() => {
  if (draftDescription.value.trim().length === 0) return true
  if (!minutesValid.value) return true
  return false
})

function submitReport() {
  if (submitDisabled.value) {
    if (draftDescription.value.trim().length === 0) setMinutesMsg('Ingresa una descripción.')
    else if (!minutesValid.value) setMinutesMsg(`Minutos inválidos. Debe ser 1 a ${MAX_MINUTES}.`)
    return
  }

  emit('save-report', {
    description: draftDescription.value.trim(),
    minutes: Number(draftMinutes.value),
  })

  showModal.value = false
  draftDescription.value = ''
  draftMinutes.value = ''
  minutesMsg.value = ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDateTime(d) {
  const dt = d instanceof Date ? d : new Date(d)
  const day = pad2(dt.getDate())
  const month = pad2(dt.getMonth() + 1)
  const year = dt.getFullYear()
  const hh = pad2(dt.getHours())
  const mm = pad2(dt.getMinutes())
  return `${day} - ${month} - ${year} ${hh}:${mm}`
}
</script>

<style scoped>
.reports {
  width: 100%;
  padding: 20px 40px 40px;
  box-sizing: border-box;
}

.btn-add {
  height: 42px;
  padding: 0 26px;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.btn-add:hover {
  opacity: 0.92;
}

.btn-add:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.list {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.report-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 18px 22px;
}

.meta {
  font-size: 14px;
  color: rgba(0, 0, 0, 0.75);
  margin-bottom: 10px;
  text-align: left;
}

.text {
  margin: 0 0 10px;
  font-size: 14px;
  line-height: 1.45;
  text-align: left;
}

.minutes {
  font-size: 14px;
  text-align: left;
  color: rgba(0, 0, 0, 0.85);
}

.empty {
  margin: 10px 0 0;
  font-size: 14px;
  text-align: center;
}

.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.55);
  display: grid;
  place-items: center;
  z-index: 2000;
  padding: 16px;
}

.modal {
  width: min(560px, 95vw);
  background: #fff;
  border-radius: 26px;
  box-shadow: 0 18px 50px rgba(0, 0, 0, 0.35);
  padding: 26px 26px 22px;
  position: relative;
  box-sizing: border-box;
}

.modal-close {
  position: absolute;
  top: 10px;
  right: 14px;
  width: 42px;
  height: 42px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  cursor: pointer;
  font-size: 28px;
  color: rgba(0, 0, 0, 0.35);
}

.modal-close:hover {
  color: rgba(0, 0, 0, 0.55);
}

.modal-textarea {
  width: 100%;
  resize: none;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 14px 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.modal-textarea:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.minutes-box {
  margin-top: 14px;
}

.modal-input {
  width: 100%;
  height: 42px;
  border-radius: 14px;
  border: 1px solid rgba(0, 0, 0, 0.12);
  padding: 0 14px;
  font-size: 14px;
  outline: none;
  box-sizing: border-box;
}

.modal-input:focus {
  border: 1px solid rgba(27, 79, 120, 0.75);
  box-shadow: 0 0 0 3px rgba(27, 79, 120, 0.15);
}

.err {
  margin: 8px 2px 0;
  font-size: 13px;
  font-weight: 700;
  color: #b00020;
  text-align: left;
}

.btn-submit {
  display: block;
  margin: 18px auto 0;
  height: 44px;
  padding: 0 28px;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.btn-submit:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}
</style>