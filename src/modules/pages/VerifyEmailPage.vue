<template>
  <main class="page-form">
    <section class="card">
      <p class="text-form">
        Ingrese la dirección de correo electrónico asociada a su<br />
        cuenta y le enviaremos un enlace de verificación para<br />
        que pueda restablecer su contraseña.
      </p>

      <form class="form" @submit.prevent="onSubmit">
        <input
          id="email"
          class="input-form"
          v-model.trim="email"
          type="email"
          autocomplete="email"
          placeholder="Email"
          required
        />

        <button class="btn-form" type="submit" :disabled="loading">
          {{ loading ? 'Enviando...' : 'Enviar correo de\nverificación' }}
        </button>

        <p v-if="success" class="success" role="status">Verifica el correo enviado a tu email.</p>

        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { requestPasswordReset } from '../helpers/authenticationHelper'

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''
  success.value = false

  const value = String(email.value ?? '').trim()

  try {
    loading.value = true
    const ok = await requestPasswordReset(value)
    success.value = !!ok
  } catch (e) {
    error.value = e?.response?.data || 'No se pudo enviar el correo.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
