<template>
  <main class="page-form">
    <section class="card">
      <p class="text-form">Por favor, ingrese sus datos a continuación</p>

      <form class="form" @submit.prevent="onSubmit">
        <div class="input-box" :class="{ filled: email }">
          <input id="email" v-model.trim="email" type="email" autocomplete="email" required />
          <label for="email">Email</label>
        </div>

        <div class="input-box" :class="{ filled: nombre }">
          <input id="nombre" v-model.trim="nombre" type="text" autocomplete="given-name" required />
          <label for="nombre">Nombre</label>
        </div>

        <div class="input-box" :class="{ filled: apellido }">
          <input
            id="apellido"
            v-model.trim="apellido"
            type="text"
            autocomplete="family-name"
            required
          />
          <label for="apellido">Apellido</label>
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

const email = ref('')
const nombre = ref('')
const apellido = ref('')
const password = ref('')
const confirmPassword = ref('')

const showPassword = ref(false)
const showConfirm = ref(false)

const loading = ref(false)
const error = ref('')

async function onSubmit() {
  error.value = ''

  if (password.value !== confirmPassword.value) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  try {
    loading.value = true

    await registerStudent({
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
