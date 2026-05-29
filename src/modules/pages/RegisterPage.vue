<template>
  <main class="page-form">
    <section class="card">
      <h1 class="form-title">Crear cuenta</h1>

      <form class="form" @submit.prevent="onSubmit">
        <div class="input-box" :class="{ filled: cedula }">
          <input id="cedula" v-model.trim="cedula" type="text" autocomplete="cedula" required />
          <label for="cedula">Cédula</label>
        </div>

        <div class="input-box" :class="{ filled: email }">
          <input id="email" v-model.trim="email" type="email" autocomplete="email" required />
          <label for="email">Email</label>
        </div>

        <div class="input-box" :class="{ filled: nombre }">
          <input id="nombre" v-model.trim="nombre" type="text" autocomplete="given-name" required />
          <label for="nombre">Nombres</label>
        </div>

        <div class="input-box" :class="{ filled: apellido }">
          <input
            id="apellido"
            v-model.trim="apellido"
            type="text"
            autocomplete="family-name"
            required
          />
          <label for="apellido">Apellidos</label>
        </div>

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
          {{ loading ? 'Registrando...' : 'Regístrate' }}
        </button>

        <p v-if="error" class="error" role="alert">
          {{ error }}
        </p>
      </form>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerStudent } from '../helpers/authenticationHelper'

const router = useRouter()

const cedula = ref('')
const email = ref('')
const nombre = ref('')
const apellido = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirm = ref(false)

const loading = ref(false)
const error = ref('')

function sanitizeDigits(v) {
  return String(v ?? '').replace(/\D/g, '')
}

async function onSubmit() {
  error.value = ''

  const cedulaVal = sanitizeDigits(cedula.value)
  if (!cedulaVal) {
    error.value = 'Debe ingresar la cédula.'
    return
  }
  if (cedulaVal.length < 7 || cedulaVal.length > 9) {
    error.value = 'La cédula debe tener entre 7 y 9 dígitos.'
    return
  }

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    loading.value = true

    await registerStudent({
      idCard: cedula.value.trim(),
      name: nombre.value.trim(),
      lastName: apellido.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })

    router.push('/login')
  } catch (e) {
    error.value = e?.response?.data || 'Ocurrió un error. Vuelva a intentarlo más tarde.'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped></style>
