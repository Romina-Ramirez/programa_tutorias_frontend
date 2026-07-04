<template>
  <section>
    <div class="course-card course-card--big">
      <p class="desc">
        {{ course?.descripcion || 'Sin descripción disponible.' }}
      </p>
    </div>

    <div class="row">
      <div class="course-card course-card--small">
        <div class="line">
          <span class="b">Fecha de Inicio:</span> {{ course?.fechaInicio || '-' }}
        </div>
        <div class="line"><span class="b">Fecha de Fin:</span> {{ course?.fechaFin || '-' }}</div>
        <br />
        <div class="line"><span class="b">Horario:</span> {{ course?.horario || '-' }}</div>
      </div>

      <div class="course-card course-card--small">
        <template v-if="!isTutor">
          <p class="side-text">
            {{ tutorInfo || 'Información del tutor no disponible.' }}
          </p>
        </template>

        <template v-else>
          <div class="participants-title">PARTICIPANTES</div>

          <div v-if="(participants?.length || 0) === 0" class="muted">
            No hay participantes aún.
          </div>

          <ul v-else class="participants">
            <li v-for="(p, idx) in participants" :key="idx">
              {{
                typeof p === 'string'
                  ? p
                  : p.nombre || `${p.name || ''} ${p.lastName || ''}`.trim() || 'Sin nombre'
              }}
            </li>
          </ul>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  role: { type: String, default: 'STUDENT' },
  course: { type: Object, default: () => ({}) },
  tutorInfo: { type: String, default: '' },
  participants: { type: Array, default: () => [] },
})

const isTutor = computed(() => String(props.role) === 'TUTOR')
</script>

<style scoped>
.course-card {
  width: 100%;
  background: #fff;
  border-radius: 24px;
  border: 1px solid rgba(0, 0, 0, 0.06);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  box-sizing: border-box;
}

.course-card--big {
  padding: 26px 32px;
  margin-bottom: 18px;
}

.course-card--small {
  padding: 24px 32px;
  min-height: 110px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
  overflow: hidden;
}

.desc {
  font-size: 16px;
  line-height: 1.55;
  color: #000;
  text-align: justify;
}

.row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 24px;
}

.line {
  font-size: 16px;
  margin: 4px 0;
}
.b {
  font-weight: 700;
}

.side-text {
  margin: 0;
  font-size: 16px;
  line-height: 1.45;
  text-align: justify;
}

.participants-title {
  font-weight: 700;
  font-size: 16px;
  margin-bottom: 10px;
  letter-spacing: 0.3px;
  text-align: center;
}

.participants {
  margin: 0;
  padding-left: 18px;
  padding-right: 6px;
  text-align: left;
  font-size: 15px;
  line-height: 1.4;

  max-height: 120px;
  overflow-y: auto;
}

.participants::-webkit-scrollbar {
  width: 8px;
}

.participants::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.06);
  border-radius: 999px;
}

.participants::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.45);
  border-radius: 999px;
}

.participants::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.65);
}

@media (max-width: 768px) {
  .row {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .course-card--big,
  .course-card--small {
    padding: 24px 20px;
  }
}
</style>
