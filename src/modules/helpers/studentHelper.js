import api from '../api/ApiConfig'

// CURSOS DISPONIBLES

/**
 * GET /student/{userId}/courses/available
 * Listar cursos disponibles
 */
export const getAvailableCourses = async (userId) => {
  const { data } = await api.get(`/student/${userId}/courses/available`)
  return data
}

// MIS CURSOS

/**
 * GET /student/{userId}/courses
 * Listar cursos del estudiante
 */
export const getMyCourses = async (userId) => {
  const { data } = await api.get(`/student/${userId}/courses`)
  return data
}

/**
 * GET /student/courses/{courseId}
 * Detalle público de un curso
 */
export const getCourseDetail = async (courseId) => {
  const { data } = await api.get(`/student/courses/${courseId}`)
  return data
}

// INSCRIPCIÓN

/**
 * POST /student/{userId}/courses/{courseId}/enroll
 * Inscribirse en un curso
 */
export const enrollInCourse = async (userId, courseId) => {
  const { data } = await api.post(`/student/${userId}/courses/${courseId}/enroll`)
  return data
}

// CALIFICACIONES

/**
 * GET /student/{userId}/courses/{courseId}/grades
 * Obtener calificaciones del estudiante
 */
export const getMyGrades = async (userId, courseId) => {
  const { data } = await api.get(`/student/${userId}/courses/${courseId}/grades`)
  return data
}
