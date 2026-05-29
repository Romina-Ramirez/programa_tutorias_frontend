<template>
  <main class="page-form">
    <section class="card">
      <h1 v-if="canChangePassword" class="form-title">
        {{ isLoggedIn ? 'Cambiar contraseña' : 'Restablecer contraseña' }}
      </h1>

      <p v-else class="error" role="alert">
        No se pudo validar el cambio de contraseña.
        {{ isLoggedIn ? 'Inicie sesión nuevamente.' : 'Use el enlace del correo.' }}
      </p>

      <form v-if="canChangePassword" class="form" @submit.prevent="onSubmit">
        <div class="input-box" :class="{ filled: password }">
          <input
            id="password"
            v-model="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="new-password"
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

        <div class="input-box" :class="{ filled: confirmPassword }">
          <input
            id="confirmPassword"
            v-model="confirmPassword"
            :type="showConfirm ? 'text' : 'password'"
            autocomplete="new-password"
            required
          />
          <label for="confirmPassword">Confirme su contraseña</label>
          <button
            type="button"
            class="eye-btn"
            :aria-label="showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'"
            @click="showConfirm = !showConfirm"
          >
            <FontAwesomeIcon :icon="showConfirm ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
          </button>
        </div>

        <button class="btn-form" type="submit" :disabled="loading || !canChangePassword">
          {{ loading ? 'Procesando...' : 'Aceptar' }}
        </button>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { changePassword } from '../helpers/authenticationHelper'

const route = useRoute()
const router = useRouter()

function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const auth = ref(readAuth())

const tokenFromLink = computed(() => {
  const raw = String(route.query.token ?? '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})

const email = computed(() => {
  if (auth.value?.isAuthenticated) return auth.value.email
  return ''
})

const isLoggedIn = computed(() => auth.value?.isAuthenticated === true)
const canChangePassword = computed(() => isLoggedIn.value || !!tokenFromLink.value)

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''

  if (!canChangePassword.value) {
    error.value =
      'No se pudo validar el cambio de contraseña. Inicie sesión o use el enlace del correo.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    loading.value = true

    await changePassword({
      email: isLoggedIn.value ? email.value : undefined,
      password: password.value,
      token: tokenFromLink.value || undefined,
    })

    password.value = ''
    confirmPassword.value = ''

    if (isLoggedIn.value) {
      router.push('/perfil')
    } else {
      router.push('/login')
    }
  } catch (e) {
    error.value = e?.response?.data || 'No se pudo cambiar la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
