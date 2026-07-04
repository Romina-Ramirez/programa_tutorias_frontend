<template>
  <main class="page-notfound">
    <section class="nf-card" aria-labelledby="nf-title">
      <h2 id="nf-title" class="nf-title">
        Página no encontrada <br />
        (404)
      </h2>

      <p class="nf-text">¡Vaya! La página que buscas no existe.</p>

      <button class="nf-link" type="button" @click="goHome">Volver a la página de inicio.</button>
    </section>
  </main>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const auth = reactive({
  isAuthenticated: false,
  role: '',
})

function loadAuthFromStorage() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) {
      auth.isAuthenticated = false
      auth.role = ''
      return
    }
    const parsed = JSON.parse(raw)
    auth.isAuthenticated = !!parsed?.isAuthenticated
    auth.role = parsed?.role ?? ''
  } catch {
    localStorage.removeItem('auth')
    auth.isAuthenticated = false
    auth.role = ''
  }
}

const roleKey = computed(() =>
  String(auth.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const brandTo = computed(() => {
  if (!auth.isAuthenticated) return { name: 'home' }

  if (roleKey.value === 'STUDENT') return { name: 'home' }
  if (roleKey.value === 'TUTOR') return { name: 'my-courses' }
  if (roleKey.value === 'ADMIN') return { name: 'admin' }
  if (roleKey.value === 'SUPER_ADMIN') return { name: 'super-admin' }

  return { name: 'home' }
})

function goHome() {
  router.push(brandTo.value)
}

onMounted(() => {
  loadAuthFromStorage()
  window.addEventListener('storage', loadAuthFromStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', loadAuthFromStorage)
})
</script>

<style scoped>
.page-notfound {
  background: #e0e0e0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.nf-card {
  width: 520px;
  background: #fff;
  border-radius: 22px;
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.06);
  padding: 100px 40px;
  text-align: center;
}

.nf-title {
  font-size: 20px;
  font-weight: 800;
}

.nf-text {
  margin-top: 30px;
}

.nf-link {
  background: transparent;
  border: 0;
  margin-top: 15px;
  cursor: pointer;
  text-decoration: underline;
}

.nf-link:hover {
  color: #004671;
}
</style>
