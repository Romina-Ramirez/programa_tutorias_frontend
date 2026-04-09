import api from '../api/ApiConfig'

// RELACIONADOS CON FOROS

/**
 * GET /forums/course/{courseId}?userId=
 * Listar foros por curso
 */
export const listForumsByCourse = async (userId, courseId) => {
  const { data } = await api.get(`/forums/course/${courseId}`, {
    params: { userId },
  })
  return data
}

/**
 * POST /forums/course/{courseId}?userId=
 * Crear foro
 */
export const createForum = async (userId, courseId, payload) => {
  const { data } = await api.post(`/forums/course/${courseId}`, payload, {
    params: { userId },
  })
  return data
}

/**
 * DELETE /forums/{forumId}?userId=
 * Eliminar foro
 */
export const deleteForum = async (userId, forumId) => {
  const { data } = await api.delete(`/forums/${forumId}`, {
    params: { userId },
  })
  return data
}

// RELACIONADOS CON COMENTARIOS

/**
 * GET /forums/{forumId}/comments?userId=
 * Listar comentarios
 */
export const listComments = async (userId, forumId) => {
  const { data } = await api.get(`/forums/${forumId}/comments`, {
    params: { userId },
  })
  return data
}

/**
 * POST /forums/{forumId}/comments?userId=
 * Agregar comentario
 */
export const addComment = async (userId, forumId, payload) => {
  const { data } = await api.post(`/forums/${forumId}/comments`, payload, {
    params: { userId },
  })
  return data
}

/**
 * DELETE /forums/comments/{commentId}?userId=
 * Eliminar comentario
 */
export const deleteComment = async (userId, commentId) => {
  const { data } = await api.delete(`/forums/comments/${commentId}`, {
    params: { userId },
  })
  return data
}
