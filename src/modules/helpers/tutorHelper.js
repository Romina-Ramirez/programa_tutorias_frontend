import api from '../api/ApiConfig'

// MIS CURSOS

/**
 * GET /tutor/{userId}/courses
 * Listar cursos del tutor
 */
export const getMyCourses = async (userId) => {
  const { data } = await api.get(`/tutor/${userId}/courses`)
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}
 * Detalle del curso
 */
export const getCourseDetail = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}`)
  return data
}

// ESTUDIANTES

/**
 * GET /tutor/{userId}/courses/{courseId}/students
 * Estudiantes inscritos
 */
export const getEnrolledStudents = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}/students`)
  return data
}

// CALIFICACIONES

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
 * GET /tutor/{userId}/courses/{courseId}/grades/activity/{activity}
 * Obtener calificaciones por actividad
 */
export const getGradesByActivity = async (userId, courseId, activity) => {
  const { data } = await api.get(
    `/tutor/${userId}/courses/${courseId}/grades/activity/${encodeURIComponent(activity)}`,
  )
  return data
}

/**
 * GET /tutor/{userId}/courses/{courseId}/students/{studentId}/grades
 * Obtener calificaciones de un estudiante en un curso
 */
export const getGradesByStudent = async (userId, courseId, studentId) => {
  const { data } = await api.get(
    `/tutor/${userId}/courses/${courseId}/students/${studentId}/grades`,
  )
  return data
}

// REPORTES

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
 * Listar reportes por curso
 */
export const getReportsByCourse = async (userId, courseId) => {
  const { data } = await api.get(`/tutor/${userId}/courses/${courseId}/reports`)
  return data
}
