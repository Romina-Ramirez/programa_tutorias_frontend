import api from '../api/ApiConfig'

/**
 * POST /authentication/login
 * @param {Object} payload { email, password }
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
