<template>
  <main class="page-form">
    <section class="card">
      <p v-if="emailFromLink" class="text-form">Por favor, restablezca su contraseña.</p>

      <p v-if="!emailFromLink" class="error" role="alert">
        El enlace no contiene el email. Vuelve a solicitar el correo de verificación.
      </p>

      <form v-if="emailFromLink" class="form" @submit.prevent="onSubmit">
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

        <button class="btn-form" type="submit" :disabled="loading || !emailFromLink">
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

const emailFromLink = computed(() => {
  const raw = String(route.query.email ?? '').trim()
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

async function onSubmit() {
  error.value = ''

  if (!emailFromLink.value) {
    error.value = 'El enlace no contiene el email.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    loading.value = true

    await changePassword({
      email: emailFromLink.value,
      password: password.value,
    })

    password.value = ''
    confirmPassword.value = ''

    router.push('/login')
  } catch (e) {
    error.value = e?.response?.data || 'No se pudo cambiar la contraseña.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
