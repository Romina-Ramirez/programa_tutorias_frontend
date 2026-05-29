<template>
  <section class="forum">
    <div v-if="isTutor && !isInactive" class="toolbar">
      <button
        v-if="!addingForum"
        class="btn-add"
        type="button"
        @click="startAddForum"
        :disabled="savingForum"
      >
        {{ savingForum ? 'Publicando...' : 'Agregar Foro' }}
      </button>

      <div v-else class="composer-card">
        <div class="composer-type">
          <label for="forum-type">Tipo:</label>
          <select id="forum-type" v-model="newForumType" class="type-select">
            <option value="ESTANDAR">📝 Estándar</option>
            <option value="IMPORTANTE">⚠️ Importante</option>
            <option value="RECURSO">📎 Recurso</option>
          </select>
        </div>

        <textarea
          v-model.trim="newForumText"
          class="composer-input"
          rows="3"
          placeholder="Ingrese su texto para publicar el foro"
          :disabled="savingForum"
        />

        <div class="composer-actions">
          <button
            class="icon-round"
            type="button"
            aria-label="Cancelar"
            @click="cancelAddForum"
            :disabled="savingForum"
          >
            <FontAwesomeIcon :icon="['fas', 'xmark']" />
          </button>

          <button
            class="icon-round"
            type="button"
            aria-label="Publicar"
            :disabled="newForumText.trim().length === 0 || savingForum"
            @click="saveForum"
          >
            <FontAwesomeIcon :icon="['fas', 'check']" />
          </button>
        </div>
      </div>
    </div>

    <div v-if="mode === 'list'" class="list">
      <p v-if="loadingForums" class="empty">Cargando foros...</p>

      <template v-else>
        <article
          v-for="p in forumsSorted"
          :key="p.id"
          class="post-card"
          :class="'post-card--' + (p.type || 'ESTANDAR').toLowerCase()"
        >
          <div class="post-row">
            <div class="post-content">
              <div class="post-header">
                <span
                  v-if="p.type && p.type !== 'ESTANDAR'"
                  class="badge"
                  :class="'badge--' + p.type.toLowerCase()"
                >
                  {{ p.type === 'IMPORTANTE' ? '⚠️ Importante' : '📎 Recurso' }}
                </span>
                <div class="author">{{ p.author }}</div>
              </div>
              <p class="body">{{ p.text }}</p>
            </div>

            <div class="post-actions">
              <div class="date">{{ formatDate(p.createdAt) }}</div>

              <button
                class="btn-eye-forum"
                type="button"
                aria-label="Ver comentarios"
                @click="openDetail(p.id)"
              >
                <FontAwesomeIcon :icon="['fas', 'eye']" />
              </button>
            </div>
          </div>
        </article>

        <p v-if="forumsSorted.length === 0" class="empty">No hay foros aún.</p>
      </template>
    </div>

    <div v-else class="detail">
      <div class="detail-top">
        <button class="btn-back" type="button" @click="goBack">Volver</button>
      </div>

      <article v-if="selectedForum" class="post-card">
        <div class="post-row">
          <div class="post-content">
            <div class="author">{{ selectedForum.author }}</div>
            <p class="body">{{ selectedForum.text }}</p>
          </div>

          <div class="post-actions">
            <div class="date">{{ formatDate(selectedForum.createdAt) }}</div>

            <button
              v-if="!isInactive"
              class="btn-comment"
              type="button"
              @click="toggleCommentComposer"
            >
              Agregar comentario
            </button>
          </div>
        </div>
      </article>

      <div v-if="showCommentComposer" class="comment-composer">
        <div class="composer-card composer-card--comment">
          <textarea
            v-model.trim="newCommentText"
            class="composer-input"
            rows="2"
            placeholder="Escribe tu comentario"
            :disabled="savingComment"
          />

          <div class="composer-actions">
            <button
              class="icon-round"
              type="button"
              aria-label="Cancelar"
              @click="cancelAddComment"
              :disabled="savingComment"
            >
              <FontAwesomeIcon :icon="['fas', 'xmark']" />
            </button>

            <button
              class="icon-round"
              type="button"
              aria-label="Guardar"
              :disabled="newCommentText.trim().length === 0 || savingComment"
              @click="saveComment"
            >
              <FontAwesomeIcon :icon="['fas', 'check']" />
            </button>
          </div>
        </div>
      </div>

      <div class="comments">
        <p v-if="loadingComments" class="empty">Cargando comentarios...</p>

        <template v-else>
          <article v-for="c in commentsSorted" :key="c.id" class="comment-card">
            <div class="comment-head">
              <div class="author">{{ c.author }}</div>
              <div class="date">{{ formatDate(c.createdAt) }}</div>
            </div>
            <p class="body body--comment">{{ c.text }}</p>
          </article>

          <p v-if="commentsSorted.length === 0" class="empty">Aún no hay comentarios.</p>
        </template>
      </div>
    </div>
  </section>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'

const props = defineProps({
  role: { type: String, default: 'STUDENT' },
  forums: { type: Array, default: () => [] },
  commentsByForum: { type: Object, default: () => ({}) },
  loadingForums: { type: Boolean, default: false },
  loadingComments: { type: Boolean, default: false },
  savingForum: { type: Boolean, default: false },
  savingComment: { type: Boolean, default: false },
  isInactive: { type: Boolean, default: false },
})

const emit = defineEmits(['create-forum', 'load-comments', 'add-comment'])

const roleKey = computed(() =>
  String(props.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isTutor = computed(() => roleKey.value === 'TUTOR')

const mode = ref('list')
const selectedForumId = ref(null)

const forumsSorted = computed(() =>
  [...(props.forums ?? [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
)

const selectedForum = computed(() => {
  return forumsSorted.value.find((f) => f.id === selectedForumId.value) ?? null
})

const commentsSorted = computed(() => {
  const list = props.commentsByForum?.[selectedForumId.value] ?? []
  return [...list].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
})

function openDetail(id) {
  selectedForumId.value = id
  mode.value = 'detail'
  showCommentComposer.value = false
  newCommentText.value = ''
  emit('load-comments', id)
}

function goBack() {
  mode.value = 'list'
  showCommentComposer.value = false
  newCommentText.value = ''
}

const addingForum = ref(false)
const newForumText = ref('')
const newForumType = ref('ESTANDAR')

function startAddForum() {
  addingForum.value = true
  newForumText.value = ''
  newForumType.value = 'ESTANDAR'
}

function cancelAddForum() {
  addingForum.value = false
  newForumText.value = ''
}

function saveForum() {
  const text = newForumText.value.trim()
  if (!text) return

  emit('create-forum', { text, type: newForumType.value })

  addingForum.value = false
  newForumText.value = ''
  newForumType.value = 'ESTANDAR'
}

const showCommentComposer = ref(false)
const newCommentText = ref('')

function toggleCommentComposer() {
  showCommentComposer.value = !showCommentComposer.value
  if (!showCommentComposer.value) newCommentText.value = ''
}

function cancelAddComment() {
  showCommentComposer.value = false
  newCommentText.value = ''
}

function saveComment() {
  const text = newCommentText.value.trim()
  if (!text || !selectedForumId.value) return

  emit('add-comment', {
    forumId: selectedForumId.value,
    text,
  })

  showCommentComposer.value = false
  newCommentText.value = ''
}

function pad2(n) {
  return String(n).padStart(2, '0')
}

function formatDate(iso) {
  const d = new Date(iso)
  const day = pad2(d.getDate())
  const mon = pad2(d.getMonth() + 1)
  const yr = d.getFullYear()
  const hh = pad2(d.getHours())
  const mm = pad2(d.getMinutes())
  return `${day}/${mon}/${yr} ${hh}:${mm}`
}

watch(
  () => props.forums,
  () => {
    if (mode.value === 'detail' && !selectedForum.value) goBack()
  },
)
</script>

<style scoped>
.forum {
  width: 100%;
}

.toolbar {
  width: 100%;
  margin: 0 0 18px;
}

.composer-type {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.composer-type label {
  font-size: 14px;
  font-weight: 600;
  color: #333;
}

.type-select {
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 14px;
  background: #fff;
  cursor: pointer;
}

.type-select:focus {
  outline: none;
  border-color: #004671;
}

.btn-add {
  height: 40px;
  padding: 0 24px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-weight: 600;
  font-size: 15px;
}

.btn-add:hover {
  opacity: 0.92;
}

.btn-add:disabled {
  opacity: 0.65;
  cursor: not-allowed;
}

.post-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 16px 18px;
  margin-bottom: 18px;
}

.post-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 18px;
}

.post-content {
  flex: 1;
  min-width: 0;
}

.post-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.badge {
  display: inline-block;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 700;
}

.badge--importante {
  background: #dc2626;
  color: #fff;
}

.badge--recurso {
  background: #004671;
  color: #fff;
}

.author {
  font-size: 16px;
  font-weight: 800;
  text-align: left;
}

.body {
  margin: 8px 0 0;
  font-size: 16px;
  line-height: 1.35;
  overflow-wrap: anywhere;
  text-align: justify;
}

.post-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 10px;
  flex: 0 0 auto;
}

.date {
  font-size: 16px;
  font-weight: 600;
}

.btn-eye-forum {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-size: 16px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-eye-forum:hover {
  opacity: 0.92;
}

.btn-comment {
  height: 36px;
  padding: 0 20px;
  border-radius: 8px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  font-weight: 600;
  font-size: 14px;
}

.btn-comment:hover {
  opacity: 0.92;
}

.composer-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 14px 16px;
  display: flex;
  align-items: center;
  gap: 14px;
}

.composer-card--comment {
  margin: 12px 0 18px;
}

.composer-input {
  flex: 1;
  border: 0;
  outline: none;
  resize: none;
  font-size: 16px;
  line-height: 1.35;
  background: transparent;
}

.composer-actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.icon-round {
  width: 38px;
  height: 38px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: #004671;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-round:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.icon-round:hover:not(:disabled) {
  opacity: 0.92;
}

.detail-top {
  display: flex;
  justify-content: flex-start;
  margin: 0 0 12px;
}

.btn-back {
  height: 34px;
  padding: 0 18px;
  border-radius: 999px;
  border: 0;
  cursor: pointer;
  background: rgba(0, 0, 0, 0.12);
  font-weight: 800;
  font-size: 16px;
}

.btn-back:hover {
  opacity: 0.9;
}

.comment-card {
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 14px 18px;
  margin-bottom: 14px;
}

.comment-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

.body--comment {
  margin-top: 6px;
  text-align: justify;
}

.empty {
  margin: 10px 0 0;
  font-size: 16px;
  text-align: center;
  font-weight: 600;
  color: rgba(0, 0, 0, 0.65);
}
</style>
