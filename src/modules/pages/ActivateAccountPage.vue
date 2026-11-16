<template>
  <main class="page-form">
    <section class="card">
      <template v-if="!done">
        <h1 v-if="token" class="form-title">Activa tu cuenta</h1>

        <p v-if="token" class="hint">
          Define la contraseña con la que ingresarás al Programa de Tutorías
          (mínimo 8 caracteres).
        </p>

        <p v-if="!token" class="error" role="alert">
          El enlace de activación no es válido. Use el enlace enviado a su correo
          o solicite a su administrador que le reenvíe uno nuevo.
        </p>

        <form v-if="token" class="form" @submit.prevent="onSubmit">
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
            <label for="confirmPassword">Confirma tu contraseña</label>
            <button
              type="button"
              class="eye-btn"
              :aria-label="showConfirm ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              @click="showConfirm = !showConfirm"
            >
              <FontAwesomeIcon :icon="showConfirm ? ['fas', 'eye-slash'] : ['fas', 'eye']" />
            </button>
          </div>

          <button class="btn-form" type="submit" :disabled="loading">
            {{ loading ? 'Activando...' : 'Activar cuenta' }}
          </button>

          <p v-if="error" class="error" role="alert">{{ error }}</p>
        </form>
      </template>

      <template v-else>
        <h1 class="form-title">¡Cuenta activada!</h1>
        <p class="hint">Ya puedes iniciar sesión con tu correo y tu nueva contraseña.</p>
        <button class="btn-form" type="button" @click="router.push('/login')">
          Ir a iniciar sesión
        </button>
      </template>
    </section>
  </main>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { activateAccount } from '../helpers/authenticationHelper'

const route = useRoute()
const router = useRouter()

const token = computed(() => {
  const raw = String(route.query.token ?? '').trim()
  if (!raw) return ''
  try {
    return decodeURIComponent(raw)
  } catch {
    return raw
  }
})

const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirm = ref(false)

const loading = ref(false)
const error = ref('')
const done = ref(false)

async function onSubmit() {
  error.value = ''

  if (password.value.trim().length < 8) {
    error.value = 'La contraseña debe tener al menos 8 caracteres.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    loading.value = true
    await activateAccount({ token: token.value, password: password.value })
    done.value = true
  } catch (e) {
    error.value = e?.response?.data || 'No se pudo activar la cuenta.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.hint {
  color: #555;
  margin: 0 0 16px;
}
</style>
