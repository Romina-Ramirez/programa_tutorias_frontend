<template>
  <section class="meeting">
    <button class="btn-meeting" type="button" @click="onClick">
      {{ isTutor ? 'Iniciar la Reunión' : 'Unirse a la reunión' }}
    </button>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, default: 'STUDENT' },
})

const roleKey = computed(() =>
  String(props.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isTutor = computed(() => roleKey.value === 'TUTOR')

function onClick() {
  console.log(isTutor.value ? 'Iniciar reunión' : 'Unirse a reunión')
}
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

.btn-meeting {
  width: 220px;
  height: 44px;
  border-radius: 22px;
  border: 0;
  cursor: pointer;
  background: #0b4f77;
  color: #fff;
  font-size: 14px;
  font-weight: 800;
}

.btn-meeti ng:hover {
  opacity: 0.92;
}
</style>
