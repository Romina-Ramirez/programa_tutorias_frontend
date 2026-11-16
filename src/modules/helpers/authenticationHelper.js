import api from '../api/ApiConfig'

/**
 * POST /authentication/login
 * @param {Object} payload { email?, password, token? }
 * @returns {LoginResponseDTO}
 */
export const login = async (payload) => {
  const { data } = await api.post('/authentication/login', payload)
  return data
}

/**
 * POST /authentication/register-student
 * @param {Object} payload RegisterStudentDTO
 * @returns {Boolean}
 */
export const registerStudent = async (payload) => {
  const { data } = await api.post('/authentication/register-student', payload)
  return data
}

/**
 * POST /authentication/request-password-reset?email=
 * @param {String} email
 * @returns {Boolean}
 */
export const requestPasswordReset = async (email) => {
  const { data } = await api.post('/authentication/request-password-reset', null, {
    params: { email },
  })
  return data
}

/**
 * POST /authentication/change-password
 * @param {Object} payload { email, password }
 * @returns {Boolean}
 */
export const changePassword = async (payload) => {
  const { data } = await api.post('/authentication/change-password', payload)
  return data
}

/**
 * POST /authentication/activate
 * Activa una cuenta creada por un administrador: el usuario define su
 * contraseña con el enlace de un solo uso recibido por correo.
 * @param {Object} payload { token, password }
 * @returns {Boolean}
 */
export const activateAccount = async (payload) => {
  const { data } = await api.post('/authentication/activate', payload)
  return data
}
