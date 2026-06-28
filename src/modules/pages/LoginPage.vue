<template>
  <main class="page-form">
    <section class="card">
      <h1 class="form-title">Inicia Sesión</h1>

      <form class="form" @submit.prevent="onSubmit">
        <div class="input-box" :class="{ filled: email }">
          <input id="email" v-model.trim="email" type="email" autocomplete="email" required />
          <label for="email">Email</label>
        </div>

        <div class="input-box" :class="{ filled: password }">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            required
          />
          <label for="password">Contraseña</label>
          <button
            type="button"
            class="eye-btn"
            :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showPassword = !showPassword"
          >
            <FontAwesomeIcon :icon="showPassword ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
          </button>
        </div>

        <div class="row-links">
          <RouterLink class="link" to="/verificarEmail"> ¿Olvidaste tu contraseña? </RouterLink>
          <RouterLink class="link" to="/registrarse"> Regístrate </RouterLink>
        </div>

        <button class="btn-form" type="submit" :disabled="loading">
          {{ loading ? 'Ingresando...' : 'Inicia Sesión' }}
        </button>

        <p v-if="infoMessage && !error" class="success" role="status">{{ infoMessage }}</p>
        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { login } from '../helpers/authenticationHelper'
import { warmUpServer } from '../api/ApiConfig'
import { extractApiErrorMessage, getDefaultRouteByRole, saveAuth } from '../helpers/authSession'

const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const loading = ref(false)
const error = ref('')

// Despierta el backend (cold start de Render free) mientras el usuario escribe.
onMounted(() => {
  warmUpServer()
})

const infoMessage = computed(() => {
  if (route.query.reason === 'session-expired') {
    return 'Tu sesión venció. Iniciá sesión nuevamente para continuar.'
  }

  if (route.query.reason === 'auth-required') {
    return 'Debés iniciar sesión para acceder a esa sección.'
  }

  return ''
})

function redirectByRole(role) {
  const redirect = String(route.query.redirect ?? '').trim()

  if (redirect) return router.push(redirect)

  return router.push(getDefaultRouteByRole(role))
}

async function onSubmit() {
  error.value = ''

  try {
    loading.value = true

    const res = await login({
      email: email.value.trim(),
      password: password.value,
    })

    saveAuth({
      isAuthenticated: true,
      userId: res?.userId,
      role: res?.role,
      name: res?.name,
      lastName: res?.lastName,
      email: res?.email,
      accessToken: res?.accessToken,
      refreshToken: res?.refreshToken,
    })

    window.dispatchEvent(new Event('storage'))

    await redirectByRole(res?.role)
  } catch (e) {
    error.value = extractApiErrorMessage(e, 'Ocurrió un error. Vuelva a intentarlo más tarde.')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-wrapper {
  width: 100%;
  display: flex;
  justify-content: center;
}
</style>
