export function normalizeRole(role) {
  return String(role ?? '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
}

export function readAuth() {
  try {
    const raw = localStorage.getItem('auth')
    if (!raw) return null

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveAuth(authData) {
  localStorage.setItem('auth', JSON.stringify(authData))
}

export function clearAuth() {
  localStorage.removeItem('auth')
}

export function getDefaultRouteByRole(role) {
  const normalizedRole = normalizeRole(role)

  if (normalizedRole === 'STUDENT') return { name: 'home' }
  if (normalizedRole === 'TUTOR') return { name: 'my-courses' }
  if (normalizedRole === 'ADMIN') return { name: 'admin' }
  if (normalizedRole === 'SUPER_ADMIN') return { name: 'super-admin' }

  return { name: 'home' }
}

export function extractApiErrorMessage(
  error,
  fallback = 'Ocurrió un error. Inténtelo nuevamente.',
) {
  const data = error?.response?.data

  if (typeof data === 'string' && data.trim()) return data
  if (typeof data?.message === 'string' && data.message.trim()) return data.message
  if (typeof error?.message === 'string' && error.message.trim()) return error.message

  return fallback
}
