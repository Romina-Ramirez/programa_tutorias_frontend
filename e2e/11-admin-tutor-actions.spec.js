import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniquePhone, uniqueEmail } from './helpers'

test.describe('Administrador: acciones sobre un tutor (editar, reenviar correo, desactivar, reactivar y eliminar)', () => {
  test('editar, reenviar correo, desactivar, reactivar y eliminar un tutor', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    // Esperar a que carguen los tutores
    await expect(page.getByText('Cargando tutores...')).toBeHidden({ timeout: 30_000 })
    const rows = page.locator('.tutor-item')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })

    const before = await rows.count()

    // Asegura que la fila esté expandida antes de usar los botones de acción.
    // (Tras reactivar por cédula, la fila puede volver ya expandida si conserva el mismo id.)
    async function ensureExpanded(row, actionName) {
      const btn = row.getByRole('button', { name: actionName })
      if (!(await btn.isVisible())) {
        await row.locator('.chev-btn').click()
      }
      await expect(btn).toBeVisible({ timeout: 30_000 })
    }

    // Crear tutor mediante el modal (datos únicos; recordar la cédula)
    const cedula = uniqueCedula()
    await page.getByRole('button', { name: 'Agregar nuevo tutor' }).click()

    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })
    await modal.getByPlaceholder('Email').fill(uniqueEmail('tutor'))
    await modal.getByPlaceholder('Cédula').fill(cedula)
    await modal.getByPlaceholder('Nombres').fill('E2E')
    await modal.getByPlaceholder('Apellidos').fill('Prueba')
    await modal.getByPlaceholder('Teléfono').fill(uniquePhone())
    await modal.getByPlaceholder('Carrera').fill('Ingeniería E2E')
    await modal.getByPlaceholder('Horario Disponible').fill('Lunes 08:00 - 10:00')
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    const newRow = rows.last()

    // a) EDITAR
    await ensureExpanded(newRow, 'Editar')
    await newRow.getByRole('button', { name: 'Editar' }).click()
    const nombreInput = newRow.getByPlaceholder('Nombres')
    await nombreInput.fill('E2E Editado')
    await newRow.getByRole('button', { name: 'Guardar' }).click()
    await expect(nombreInput).toHaveValue('E2E Editado', { timeout: 30_000 })

    // b) REENVIAR CORREO
    await newRow.getByRole('button', { name: 'Reenviar correo' }).click()
    await expect(newRow).toContainText('Correo reenviado', { timeout: 30_000 })

    // c) DESACTIVAR (la fila desaparece)
    await newRow.getByRole('button', { name: 'Desactivar' }).click()
    await expect(rows).toHaveCount(before, { timeout: 30_000 })

    // d) REACTIVAR por cédula
    await page.locator('.info-actions').getByRole('button', { name: 'Activar tutor' }).click()
    const activateModal = page.locator('.modal')
    await expect(activateModal).toBeVisible({ timeout: 30_000 })
    await activateModal.getByPlaceholder('Cédula').fill(cedula)
    await activateModal.getByRole('button', { name: 'Activar tutor' }).click()
    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    // e) ELIMINAR (limpieza: no dejar datos)
    const lastRow = rows.last()
    await ensureExpanded(lastRow, 'Eliminar')
    await lastRow.getByRole('button', { name: 'Eliminar' }).click()
    const deleteModal = page.locator('.modal')
    await expect(deleteModal).toBeVisible({ timeout: 30_000 })
    await deleteModal.getByRole('button', { name: 'Confirmar' }).click()
    await expect(rows).toHaveCount(before, { timeout: 30_000 })
  })
})
