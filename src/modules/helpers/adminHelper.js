import api from '../api/ApiConfig'

// RELACIONADOS CON TUTORES

/**
 * POST /admin/{adminUserId}/tutors
 * Crear tutor
 */
export const createTutor = async (adminUserId, payload) => {
  const { data } = await api.post(`/admin/${adminUserId}/tutors`, payload)
  return data
}

/**
 * PUT /admin/{adminUserId}/tutors/{tutorId}/activate
 * Activar tutor (envÃ­o de correo)
 */
export const activateTutor = async (adminUserId, tutorId) => {
  const { data } = await api.put(`/admin/${adminUserId}/tutors/${tutorId}/activate`)
  return data
}

/**
 * GET /admin/{adminUserId}/tutors
 * Listar tutores del admin
 */
export const listMyTutors = async (adminUserId) => {
  const { data } = await api.get(`/admin/${adminUserId}/tutors`)
  return data
}

/**
 * PUT /admin/{adminUserId}/tutors/{tutorId}
 * Actualizar tutor
 */
export const updateTutor = async (adminUserId, tutorId, payload) => {
  const { data } = await api.put(`/admin/${adminUserId}/tutors/${tutorId}`, payload)
  return data
}

/**
 * DELETE /admin/{adminUserId}/tutors/{tutorId}
 * Eliminar tutor
 */
export const deleteTutor = async (adminUserId, tutorId) => {
  const { data } = await api.delete(`/admin/${adminUserId}/tutors/${tutorId}`)
  return data
}

// RELACIONADOS CON CURSOS

/**
 * POST /admin/{adminUserId}/courses
 * Crear curso
 */
export const createCourse = async (adminUserId, payload) => {
  const { data } = await api.post(`/admin/${adminUserId}/courses`, payload)
  return data
}

/**
 * GET /admin/{adminUserId}/tutors/{tutorId}/courses
 * Obtener cursos del tutor
 */
export const listCoursesByTutor = async (adminUserId, tutorId) => {
  const { data } = await api.get(`/admin/${adminUserId}/tutors/${tutorId}/courses`)
  return data
}

/**
 * PUT /admin/{adminUserId}/courses/{courseId}
 * Actualizar curso
 */
export const updateCourse = async (adminUserId, courseId, payload) => {
  const { data } = await api.put(`/admin/${adminUserId}/courses/${courseId}`, payload)
  return data
}

/**
 * DELETE /admin/{adminUserId}/courses/{courseId}
 * Eliminar curso
 */
export const deleteCourse = async (adminUserId, courseId) => {
  const { data } = await api.delete(`/admin/${adminUserId}/courses/${courseId}`)
  return data
}

// RELACIONADOS CON REPORTES

/**
 * GET /admin/{adminUserId}/tutors/{tutorId}/general-report
 * Reporte general del tutor
 */
export const getTutorGeneralReport = async (adminUserId, tutorId) => {
  const { data } = await api.get(`/admin/${adminUserId}/tutors/${tutorId}/general-report`)
  return data
}
