import api from '../api/ApiConfig'

/**
 * POST /superadmin/admins
 * Crear admin
 */
export const createAdmin = async (payload) => {
  const { data } = await api.post(`/superadmin/admins`, payload)
  return data
}

/**
 * GET /superadmin/admins
 * Listar administradores del super admin
 */
export const listMyAdmins = async () => {
  const { data } = await api.get(`/superadmin/admins`)
  return data
}

/**
 * PUT /superadmin/admins/{adminId}
 * Actualizar administradores
 */
export const updateAdmin = async (adminId, payload) => {
  const { data } = await api.put(`/superadmin/admins/${adminId}`, payload)
  return data
}

/**
 * GET /superadmin/admins/{adminId}/tutor-count
 * Obtener cantidad de tutores asignados a un admin
 */
export const getTutorCountByAdminId = async (adminId) => {
  const { data } = await api.get(`/superadmin/admins/${adminId}/tutor-count`)
  return data
}

/**
 * DELETE /superadmin/admins/{adminId}
 * Eliminar administradores
 */
export const deleteAdmin = async (adminId, newAdminId) => {
  const { data } = await api.delete(`/superadmin/admins/${adminId}`, {
    params: { newAdminId },
  })
  return data
}

/**
 * PUT /superadmin/admins/{adminId}/deactivate
 * Desactivar admin (soft-delete): desaparece de la lista pero queda en BD.
 */
export const deactivateAdmin = async (adminId) => {
  const { data } = await api.put(`/superadmin/admins/${adminId}/deactivate`)
  return data
}

/**
 * DELETE /superadmin/admins/{adminId}/hard
 * Eliminar admin definitivamente. Si tiene tutores activos, newAdminId reasigna.
 */
export const hardDeleteAdmin = async (adminId, newAdminId) => {
  const { data } = await api.delete(`/superadmin/admins/${adminId}/hard`, {
    params: { newAdminId },
  })
  return data
}

/**
 * PUT /superadmin/admins/reactivate?idCard=
 * Reactivar un admin desactivado por cédula.
 */
export const activateAdminByIdCard = async (idCard) => {
  const { data } = await api.put(`/superadmin/admins/reactivate`, null, {
    params: { idCard },
  })
  return data
}
