<template>
  <div class="app-shell">
    <NavBar :is-authenticated="auth.isAuthenticated" :role="auth.role" @logout="logout" />

    <main class="app-main">
      <RouterView />
    </main>

    <!-- Modal de inactivity warning -->
    <div v-if="showInactivityModal" class="modal-overlay">
      <div class="modal">
        <div class="modal-body">
          <p class="text-form">Su sesión está por expirar.</p>
          <p>¿Desea continuar?</p>
          <div class="actions-row">
            <button class="btn-pill" type="button" @click="extendSession">Continuar</button>
            <button class="btn-pill" type="button" @click="forceLogout">Cerrar sesión</button>
          </div>
        </div>
      </div>
    </div>

    <Footer />
  </div>
</template>

<script setup>
import { reactive, onMounted, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import NavBar from './modules/components/NavBarComponent.vue'
import Footer from './modules/components/FooterComponent.vue'
import { clearAuth, readAuth } from './modules/helpers/authSession'

const router = useRouter()

const auth = reactive({
  isAuthenticated: false,
  userId: null,
  role: '',
  name: '',
  lastName: '',
  email: '',
})

const INACTIVITY_TIMEOUT = 10 * 60 * 1000
const WARNING_TIME = 2 * 60 * 1000

let inactivityTimer = null
let warningTimer = null
const showInactivityModal = ref(false)

function loadAuthFromStorage() {
  try {
    const parsed = readAuth()
    if (!parsed) {
      auth.isAuthenticated = false
      auth.userId = null
      auth.role = ''
      auth.name = ''
      auth.lastName = ''
      auth.email = ''
      stopInactivityTimers()
      return
    }

    auth.isAuthenticated = !!parsed?.isAuthenticated
    auth.userId = parsed?.userId ?? null
    auth.role = parsed?.role ?? ''
    auth.name = parsed?.name ?? ''
    auth.lastName = parsed?.lastName ?? ''
    auth.email = parsed?.email ?? ''

    if (auth.isAuthenticated) {
      resetInactivityTimers()
    } else {
      stopInactivityTimers()
    }
  } catch {
    clearAuth()
    auth.isAuthenticated = false
    auth.userId = null
    auth.role = ''
    auth.name = ''
    auth.lastName = ''
    auth.email = ''
    stopInactivityTimers()
  }
}

function resetInactivityTimers() {
  stopInactivityTimers()

  if (!auth.isAuthenticated) return

  warningTimer = setTimeout(() => {
    showInactivityModal.value = true
  }, INACTIVITY_TIMEOUT - WARNING_TIME)

  inactivityTimer = setTimeout(() => {
    forceLogout()
  }, INACTIVITY_TIMEOUT)
}

function stopInactivityTimers() {
  if (inactivityTimer) clearTimeout(inactivityTimer)
  if (warningTimer) clearTimeout(warningTimer)
  inactivityTimer = null
  warningTimer = null
}

function extendSession() {
  showInactivityModal.value = false
  resetInactivityTimers()
}

function forceLogout() {
  const roleKey = String(auth.role ?? '')

  stopInactivityTimers()
  showInactivityModal.value = false
  clearAuth()
  loadAuthFromStorage()

  if (roleKey === 'STUDENT') {
    router.push({ name: 'home' })
  } else {
    router.push({ name: 'login' })
  }
}

function logout() {
  forceLogout()
}

function handleActivity() {
  if (auth.isAuthenticated) {
    resetInactivityTimers()
  }
}

onMounted(() => {
  loadAuthFromStorage()
  window.addEventListener('storage', loadAuthFromStorage)

  document.addEventListener('mousemove', handleActivity)
  document.addEventListener('keydown', handleActivity)
  document.addEventListener('click', handleActivity)
  document.addEventListener('scroll', handleActivity)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', loadAuthFromStorage)
  document.removeEventListener('mousemove', handleActivity)
  document.removeEventListener('keydown', handleActivity)
  document.removeEventListener('click', handleActivity)
  document.removeEventListener('scroll', handleActivity)
  stopInactivityTimers()
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
  width: 100%;
}

.actions-row {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.text-form {
  text-align: center;
  margin-bottom: 12px;
}
</style>
