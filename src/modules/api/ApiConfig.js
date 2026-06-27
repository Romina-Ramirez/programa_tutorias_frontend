import axios from 'axios'
import { clearAuth, readAuth, saveAuth } from '../helpers/authSession'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8080/API/Tutorias',
  // Render free "duerme" el servicio tras ~15 min de inactividad y tarda ~50s en
  // despertar. Con 10s la primera petición tras inactividad expiraba ("timeout of
  // 10000ms exceeded"). 60s tolera el cold start.
  timeout: 60000,
  headers: {
    'Content-Type': 'application/json',
  },
})

/**
 * Despierta el backend (cold start de Render free) sin bloquear ni redirigir.
 * Se llama al montar la pantalla de login para que el servidor ya esté despierto
 * cuando el usuario envíe sus credenciales. Usa axios "pelado" (sin interceptores)
 * para que un eventual error no dispare el redirect de sesión.
 */
export const warmUpServer = () =>
  axios.get(`${api.defaults.baseURL}/ping`, { timeout: 60000 }).catch(() => {})

function notifyAuthChanged() {
  window.dispatchEvent(new Event('storage'))
}

function redirectToLogin(reason = 'auth-required') {
  const currentPath = `${window.location.pathname}${window.location.search}`
  const params = new URLSearchParams({ reason })

  if (window.location.pathname !== '/login') {
    params.set('redirect', currentPath)
  }

  window.location.href = `/login?${params.toString()}`
}

api.interceptors.request.use(
  (config) => {
    const auth = readAuth()
    if (auth?.accessToken) {
      config.headers.Authorization = `Bearer ${auth.accessToken}`
    }
    return config
  },
  (error) => Promise.reject(error),
)

let isRefreshing = false
let refreshPromise = null

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    const status = error.response?.status

    if (status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/authentication/login')) {
      return Promise.reject(error)
    }

    if (originalRequest.url?.includes('/authentication/refresh')) {
      clearAuth()
      notifyAuthChanged()
      redirectToLogin('session-expired')
      return Promise.reject(error)
    }

    originalRequest._retry = true

    const auth = readAuth()
    if (!auth?.refreshToken) {
      clearAuth()
      notifyAuthChanged()
      redirectToLogin('session-expired')
      return Promise.reject(error)
    }

    try {
      if (!isRefreshing) {
        isRefreshing = true
        refreshPromise = axios.post(
          `${api.defaults.baseURL}/authentication/refresh`,
          { refreshToken: auth.refreshToken },
          { headers: { 'Content-Type': 'application/json' } },
        )
      }

      const { data } = await refreshPromise

      saveAuth({
        isAuthenticated: true,
        userId: data.userId,
        role: data.role,
        name: data.name,
        lastName: data.lastName,
        email: data.email,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
      })
      notifyAuthChanged()

      originalRequest.headers = originalRequest.headers || {}
      originalRequest.headers.Authorization = `Bearer ${data.accessToken}`

      return api(originalRequest)
    } catch (refreshError) {
      clearAuth()
      notifyAuthChanged()
      redirectToLogin('session-expired')
      return Promise.reject(refreshError)
    } finally {
      isRefreshing = false
      refreshPromise = null
    }
  },
)

export { readAuth, saveAuth, clearAuth }
export default api
