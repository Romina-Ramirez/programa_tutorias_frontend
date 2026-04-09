import api from '../api/ApiConfig'

/**
 * GET /users/{userId}/profile
 * Obtener perfil del usuario
 */
export const getUserProfile = async (userId) => {
  const { data } = await api.get(`/users/${userId}/profile`)
  return data
}
