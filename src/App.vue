<template>
  <div class="app-shell">
    <NavBar :is-authenticated="auth.isAuthenticated" :role="auth.role" @logout="logout" />

    <main class="app-main">
      <RouterView />
    </main>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from './modules/components/NavBarComponent.vue'
import Footer from './modules/components/FooterComponent.vue'

const router = useRouter()

const auth = reactive({
  isAuthenticated: false,
  userId: null,
  role: '',
  name: '',
  lastName: '',
})

function loadAuthFromStorage() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) {
      auth.isAuthenticated = false
      auth.userId = null
      auth.role = ''
      auth.name = ''
      auth.lastName = ''
      return
    }

    const parsed = JSON.parse(raw)
    auth.isAuthenticated = !!parsed?.isAuthenticated
    auth.userId = parsed?.userId ?? null
    auth.role = parsed?.role ?? ''
    auth.name = parsed?.name ?? ''
    auth.lastName = parsed?.lastName ?? ''
  } catch {
    localStorage.removeItem('auth')
    auth.isAuthenticated = false
    auth.userId = null
    auth.role = ''
    auth.name = ''
    auth.lastName = ''
  }
}

function logout() {
  const roleKey = String(auth.role ?? '')

  localStorage.removeItem('auth')
  loadAuthFromStorage()

  if (roleKey === 'STUDENT') {
    router.push({ name: 'home' })
  } else {
    router.push({ name: 'login' })
  }
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
.app-shell {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-main {
  flex: 1;
}
</style>
