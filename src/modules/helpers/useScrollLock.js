import { watch, onBeforeUnmount } from 'vue'

/**
 * Bloquea el scroll del fondo mientras haya una ventana flotante (modal) abierta.
 * Recibe un getter reactivo que devuelve true cuando algún modal está abierto.
 *
 * Usa un contador compartido: pueden convivir varias instancias (p. ej. el modal
 * de inactividad en App.vue y los modales de una página) sin pisarse. El fondo
 * queda bloqueado mientras CUALQUIER instancia tenga el candado tomado.
 *
 * Uso:
 *   const anyModalOpen = computed(() => a.value || b.value)
 *   useScrollLock(() => anyModalOpen.value)
 */
let lockCount = 0

function sync() {
  if (typeof document === 'undefined') return
  document.body.classList.toggle('modal-open', lockCount > 0)
}

export function useScrollLock(getOpen) {
  let held = false

  const apply = (open) => {
    const next = !!open
    if (next === held) return
    held = next
    lockCount += next ? 1 : -1
    if (lockCount < 0) lockCount = 0
    sync()
  }

  watch(getOpen, apply, { immediate: true })

  onBeforeUnmount(() => apply(false))
}
