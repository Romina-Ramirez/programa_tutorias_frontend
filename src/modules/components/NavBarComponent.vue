<template>
  <nav class="navbar">
    <RouterLink class="brand" :to="brandTo" @click="closeMobilePanel">
      <img class="brand-logo" src="../store/logo_uce.png" alt="Escudo" />
      <div class="brand-text">Proyecto Tutorías</div>
    </RouterLink>

    <button
      type="button"
      class="mobile-toggle"
      :aria-expanded="isMobileOpen"
      aria-label="Abrir navegación"
      @click="toggleMobileMenu"
    >
      <FontAwesomeIcon :icon="isMobileOpen ? ['fas', 'xmark'] : ['fas', 'bars']" />
    </button>

    <ul class="nav-actions" :class="{ open: isMobileOpen }" role="list">
      <li v-for="item in actions" :key="item.key" class="action-item">
        <RouterLink
          v-if="item.type === 'link'"
          class="action-link"
          :to="item.to"
          @click="closeMobilePanel"
        >
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
            <span class="mobile-menu-label">Mi cuenta</span>
          </button>

          <div v-if="isMenuOpen" class="dropdown" role="menu" @click.stop>
            <template v-for="m in menuItems" :key="m.key">
              <RouterLink
                v-if="m.type === 'link'"
                class="dropdown-item"
                :to="m.to"
                role="menuitem"
                @click="closeMobilePanel"
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
      { key: 'login', label: 'Iniciar sesión', to: { name: 'login' }, type: 'link' },
    ]
  }

  if (isStudent.value) {
    return [
      { key: 'mis-cursos', label: 'Mis cursos', to: { name: 'my-courses' }, type: 'link' },
      { key: 'user-menu', type: 'menu' },
    ]
  }

  if (isTutor.value) {
    return [
      { key: 'mis-cursos', label: 'Mis cursos', to: { name: 'my-courses' }, type: 'link' },
      { key: 'perfil', label: 'Mi perfil', to: { name: 'tutor-profile' }, type: 'link' },
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

  if (isTutor.value) {
    return [
      { key: 'perfil', label: 'Mi perfil', to: { name: 'tutor-profile' }, type: 'link' },
      {
        key: 'change-pass',
        label: 'Cambiar contraseña',
        to: { name: 'change-password' },
        type: 'link',
      },
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
const isMobileOpen = ref(false)
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

function toggleMobileMenu() {
  isMobileOpen.value = !isMobileOpen.value
}

function closeMobilePanel() {
  isMobileOpen.value = false
  closeMenu()
}

function logoutFromMenu() {
  closeMobilePanel()
  handleLogout()
}

function onGlobalPointerDown(e) {
  if (!isMenuOpen.value) return
  const el = menuEl.value
  if (el && !el.contains(e.target)) closeMenu()
}

function onKeydown(e) {
  if (e.key === 'Escape') {
    closeMobilePanel()
  }
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
  min-height: 80px;
  width: 100%;
  box-sizing: border-box;
  padding: 0 24px;
  background: #004671;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 1000;
  box-shadow: 0 6px 20px rgba(8, 34, 51, 0.2);
}

.brand {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
  gap: 12px;
  min-width: 0;
}

.brand-logo {
  height: 52px;
  width: auto;
  object-fit: contain;
  display: block;
  flex-shrink: 0;
}

.brand-text {
  font-size: 18px;
  color: #d6b14a;
  letter-spacing: 0.3px;
  font-weight: 700;
  min-width: 0;
  white-space: nowrap;
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
  min-height: 28px;
  padding: 0 16px;
}

.action-item + .action-item {
  border-left: 2px solid rgba(255, 255, 255, 0.55);
}

.action-link {
  color: #fff;
  text-decoration: none;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 0.2px;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
}

.action-link:hover {
  color: #f3d57a;
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
  gap: 8px;
  width: 34px;
  height: 34px;
  font-size: 28px;
  color: #fff;
  background: transparent;
  border: 0;
  cursor: pointer;
}

.mobile-menu-label {
  display: none;
  font-size: 15px;
  font-weight: 600;
}

.icon-btn:hover {
  color: #f3d57a;
}

.dropdown {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  min-width: 180px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.18);
  padding: 8px 0;
  overflow: hidden;
}

.dropdown-item {
  width: 100%;
  display: flex;
  align-items: center;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
  color: #004671;
  text-decoration: none;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.dropdown-item:hover {
  background: rgba(27, 79, 120, 0.08);
}

.mobile-toggle {
  display: none;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
  color: #fff;
  cursor: pointer;
  font-size: 18px;
}

@media (max-width: 900px) {
  .navbar {
    padding: 12px 18px;
    flex-wrap: wrap;
  }

  .brand-logo {
    height: 44px;
  }

  .brand-text {
    font-size: 16px;
  }

  .mobile-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-left: auto;
  }

  .nav-actions {
    display: none;
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
    padding: 12px 0 4px;
  }

  .nav-actions.open {
    display: flex;
  }

  .action-item {
    padding: 0;
    border: 0;
  }

  .action-item + .action-item {
    border-left: 0;
  }

  .action-link,
  .menu-wrapper {
    width: 100%;
  }

  .action-link,
  .icon-btn {
    justify-content: flex-start;
    width: 100%;
    min-height: 44px;
    border-radius: 14px;
    padding: 0 14px;
    background: rgba(255, 255, 255, 0.08);
  }

  .menu-wrapper {
    display: flex;
  }

  .mobile-menu-label {
    display: inline;
  }

  .dropdown {
    top: calc(100% + 8px);
    left: 0;
    right: auto;
    width: min(240px, 100%);
  }
}

@media (max-width: 640px) {
  .navbar {
    min-height: 72px;
    padding: 10px 14px;
  }

  .brand {
    gap: 10px;
    max-width: calc(100% - 58px);
  }

  .brand-logo {
    height: 38px;
  }

  .brand-text {
    font-size: 15px;
  }

  .action-link {
    font-size: 15px;
  }
}
</style>
