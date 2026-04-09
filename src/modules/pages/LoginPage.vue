<template>
  <main class="page-form">
    <section class="card">
      <p class="text-form">Bienvenido</p>

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

        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../helpers/authenticationHelper'

const router = useRouter()

const email = ref('')
const password = ref('')
const showPassword = ref(false)

const loading = ref(false)
const error = ref('')

function redirectByRole(role) {
  if (role === 'STUDENT') return router.push('/')
  if (role === 'TUTOR') return router.push('/misCursos')
  if (role === 'ADMIN') return router.push('/admin')
  if (role === 'SUPER_ADMIN') return router.push('/superAdmin')

  return router.push('/')
}

async function onSubmit() {
  error.value = ''

  try {
    loading.value = true

    const res = await login({
      email: email.value.trim(),
      password: password.value,
    })

    localStorage.setItem(
      'auth',
      JSON.stringify({
        isAuthenticated: true,
        userId: res?.userId,
        role: res?.role,
        name: res?.name,
        lastName: res?.lastName,
      }),
    )

    window.dispatchEvent(new Event('storage'))

    await redirectByRole(res?.role)
  } catch (e) {
    error.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.form {
  align-items: unset;
}
</style>
