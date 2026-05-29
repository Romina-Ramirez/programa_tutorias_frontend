<template>
  <section class="meeting">
    <div v-if="meetingUrl" class="meeting-content">
      <p class="meeting-label">
        {{ isTutor ? 'Tu enlace de reunión' : 'Enlace de reunión del tutor' }}
      </p>
      <a :href="meetingUrl" target="_blank" rel="noopener noreferrer" class="btn-meeting">
        {{ isTutor ? 'Abrir mi reunión' : 'Unirse a la reunión' }}
      </a>
    </div>
    <div v-else class="no-meeting">
      <p class="no-meeting-text">El tutor aún no ha configurado un enlace de reunión.</p>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, default: 'STUDENT' },
  meetingUrl: { type: String, default: '' },
})

const roleKey = computed(() =>
  String(props.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isTutor = computed(() => roleKey.value === 'TUTOR')
</script>

<style scoped>
.meeting {
  width: 100%;
  min-height: 420px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 60px 40px;
  box-sizing: border-box;
}

.meeting-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.meeting-label {
  color: #6b7280;
  font-size: 0.95rem;
}

.btn-meeting {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 220px;
  height: 44px;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  transition: opacity 0.2s;
}

.btn-meeting:hover {
  opacity: 0.92;
}

.no-meeting {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 60px;
}

.no-meeting-text {
  color: #9ca3af;
  font-size: 0.95rem;
  text-align: center;
}
</style>
