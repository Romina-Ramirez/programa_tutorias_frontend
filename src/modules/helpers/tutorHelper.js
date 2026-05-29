import api from '../api/ApiConfig'

/**
 * GET /tutor/{userId}/courses
 * Obtener cursos del tutor
 */
export const getMyCourses = async (userId) => {
  const { data } = await api.get(`/tutor/${userId}/courses`)
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}
 * Obtener detalle de curso del tutor
 */
export const getCourseDetail = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}`)
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}/students
 * Obtener estudiantes inscriptos
 */
export const getEnrolledStudents = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}/students`)
  return data
}

/**
 * POST /tutor/{userId}/courses/{courseId}/students/{studentId}/grades
 * Agregar calificación
 */
export const addGrade = async (userId, courseId, studentId, payload) => {
  const { data } = await api.post(
    `/tutor/${userId}/courses/${courseId}/students/${studentId}/grades`,
    payload,
  )
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}/students/{studentId}/grades
 * Obtener calificaciones por estudiante
 */
export const getGradesByStudent = async (userId, courseId, studentId) => {
  const { data } = await api.get(
    `/tutor/${userId}/courses/${courseId}/students/${studentId}/grades`,
  )
  return data
}

/**
 * POST /tutor/{userId}/courses/{courseId}/reports
 * Agregar reporte
 */
export const addReport = async (userId, courseId, payload) => {
  const { data } = await api.post(`/tutor/${userId}/courses/${courseId}/reports`, payload)
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}/reports
 * Obtener reportes por curso
 */
export const getReportsByCourse = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}/reports`)
  return data
}

/**
 * GET /tutor/{userId}/profile
 * Obtener perfil del tutor
 */
export const getTutorProfile = async (userId) => {
  const { data } = await api.get(`/tutor/${userId}/profile`)
  return data
}

/**
 * PUT /tutor/{userId}/profile
 * Actualizar perfil del tutor
 */
export const updateTutorProfile = async (userId, payload) => {
  const { data } = await api.put(`/tutor/${userId}/profile`, payload)
  return data
}
