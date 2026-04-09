<template>
  <nav class="navbar">
    <RouterLink class="brand" :to="brandTo">
      <img class="brand-logo" src="../store/logo_uce.png" alt="Escudo" />
      <div class="brand-text">Proyecto Tutorías</div>
    </RouterLink>

    <ul class="nav-actions" role="list">
      <li v-for="item in actions" :key="item.key" class="action-item">
        <RouterLink v-if="item.type === 'link'" class="action-link" :to="item.to">
          {{ item.label }}
        </RouterLink>

        <div v-else-if="item.type === 'menu'" class="menu-wrapper" :ref="setMenuRef">
          <button
            type="button"
            class="icon-btn"
            aria-label="Abrir menú de usuario"
            :aria-expanded="isMenuOpen"
            aria-haspopup="menu"
            @click.stop="toggleMenu"
          >
            <FontAwesomeIcon :icon="['fas', 'user-circle']" />
          </button>

          <div v-if="isMenuOpen" class="dropdown" role="menu" @click.stop>
            <template v-for="m in menuItems" :key="m.key">
              <RouterLink
                v-if="m.type === 'link'"
                class="dropdown-item"
                :to="m.to"
                role="menuitem"
                @click="closeMenu"
              >
                {{ m.label }}
              </RouterLink>

              <button v-else class="dropdown-item" type="button" role="menuitem" @click="m.onClick">
                {{ m.label }}
              </button>
            </template>
          </div>
        </div>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  isAuthenticated: { type: Boolean, default: false },
  role: { type: String, default: '' },
})

const emit = defineEmits(['logout'])

const roleKey = computed(() =>
  String(props.role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_'),
)

const isStudent = computed(() => roleKey.value === 'STUDENT')
const isTutor = computed(() => roleKey.value === 'TUTOR')
const isAdmin = computed(() => roleKey.value === 'ADMIN')
const isSuperAdmin = computed(() => roleKey.value === 'SUPER_ADMIN')

const brandTo = computed(() => {
  if (!props.isAuthenticated) return { name: 'home' }

  if (isStudent.value) return { name: 'home' }
  if (isTutor.value) return { name: 'my-courses' }
  if (isAdmin.value) return { name: 'admin' }
  if (isSuperAdmin.value) return { name: 'super-admin' }

  return { name: 'home' }
})

function handleLogout() {
  emit('logout')
}

const actions = computed(() => {
  if (!props.isAuthenticated) {
    return [
      { key: 'register', label: 'Regístrate', to: { name: 'register' }, type: 'link' },
      { key: 'login', label: 'Iniciar Sesión', to: { name: 'login' }, type: 'link' },
    ]
  }

  if (isStudent.value) {
    return [
      { key: 'mis-cursos', label: 'Mis cursos', to: { name: 'my-courses' }, type: 'link' },
      { key: 'user-menu', type: 'menu' },
    ]
  }

  return [{ key: 'user-menu', type: 'menu' }]
})

const menuItems = computed(() => {
  if (isStudent.value) {
    return [
      { key: 'perfil', label: 'Perfil', to: { name: 'profile' }, type: 'link' },
      { key: 'logout', label: 'Cerrar sesión', type: 'button', onClick: logoutFromMenu },
    ]
  }

  return [
    {
      key: 'change-pass',
      label: 'Cambiar contraseña',
      to: { name: 'change-password' },
      type: 'link',
    },
    { key: 'logout', label: 'Cerrar sesión', type: 'button', onClick: logoutFromMenu },
  ]
})

const isMenuOpen = ref(false)
const menuEl = ref(null)

function setMenuRef(el) {
  menuEl.value = el
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

function logoutFromMenu() {
  closeMenu()
  handleLogout()
}

function onGlobalPointerDown(e) {
  if (!isMenuOpen.value) return
  const el = menuEl.value
  if (el && !el.contains(e.target)) closeMenu()
}

function onKeydown(e) {
  if (e.key === 'Escape') closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onGlobalPointerDown, true)
  document.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener('pointerdown', onGlobalPointerDown, true)
  document.removeEventListener('keydown', onKeydown)
})
</script>

<style scoped>
.navbar {
  height: 80px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 28px;
  background: #1b4f78;
  display: flex;
  align-items: center;
  justify-content: space-between;

  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
}

.brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  gap: 10px;
}

.brand-logo {
  height: 58px;
  width: auto;
  object-fit: contain;
  display: block;
}

.brand-text {
  font-size: 18px;
  color: #d6b14a;
  letter-spacing: 0.4px;
  padding-left: 3px;
  font-weight: 500;
}

.nav-actions {
  display: flex;
  align-items: center;
  margin: 0;
  padding: 0;
  list-style: none;
}

.action-item {
  display: flex;
  align-items: center;
  height: 28px;
  padding: 0 18px;
}

.action-item + .action-item {
  border-left: 2px solid rgba(255, 255, 255, 0.55);
}

.action-link {
  color: #fff;
  text-decoration: none;
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 0.4px;

  background: transparent;
  border: 0;
  cursor: pointer;

  display: inline-flex;
  align-items: center;
}

.action-link:hover {
  opacity: 0.9;
  color: yellow;
}

.menu-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 28px;

  color: #fff;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.icon-btn:hover {
  color: yellow;
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;

  min-width: 170px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  padding: 6px 0;

  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;

  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #1b4f78;
  text-decoration: none;

  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(27, 79, 120, 0.08);
}
</style>
