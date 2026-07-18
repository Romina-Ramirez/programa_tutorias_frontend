import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniqueEmail } from './helpers'

const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD

test.describe('Super Admin — errores y ciclo de vida de administradores', () => {
  test('cédula duplicada', async ({ page }) => {
    test.skip(!(SA_EMAIL && SA_PASS), 'Define E2E_SUPERADMIN_*')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Agregar nuevo admin' }).click()

    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })

    await modal.getByPlaceholder('Cédula').fill('1710000001')
    await modal.getByPlaceholder('Nombres').fill('Duplicado')
    await modal.getByPlaceholder('Apellidos').fill('Prueba')
    await modal.getByPlaceholder('Email').fill(uniqueEmail('dupadm'))

    await modal.getByRole('button', { name: 'Agregar administrador' }).click()

    await expect(modal.locator('.modal-error')).toContainText(/existe/i, { timeout: 30_000 })
    await expect(modal).toBeVisible()
  })

  test('crear, desactivar, reactivar y eliminar un admin', async ({ page }) => {
    test.skip(!(SA_EMAIL && SA_PASS), 'Define E2E_SUPERADMIN_*')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    // Esperar carga de la lista de administradores antes de contar
    await expect(page.getByText('Cargando administradores...')).toBeHidden({ timeout: 30_000 })
    await expect(page.locator('.admin-item').first()).toBeVisible({ timeout: 30_000 })

    const rows = page.locator('.admin-item')
    const before = await rows.count()

    // Tras reactivar, la fila vuelve con el mismo id y puede renderizarse YA expandida
    // (expandedId quedó apuntando a ese id). Este helper evita colapsarla por error.
    async function ensureExpanded(row, actionName) {
      const btn = row.getByRole('button', { name: actionName })
      if (!(await btn.isVisible())) {
        await row.locator('.chev-btn').click()
      }
      await expect(btn).toBeVisible({ timeout: 30_000 })
    }

    const cedula = uniqueCedula()
    const email = uniqueEmail('newadm')

    // CREAR
    await page.getByRole('button', { name: 'Agregar nuevo admin' }).click()

    const addModal = page.locator('.modal')
    await expect(addModal).toBeVisible({ timeout: 30_000 })

    await addModal.getByPlaceholder('Cédula').fill(cedula)
    await addModal.getByPlaceholder('Nombres').fill('E2E')
    await addModal.getByPlaceholder('Apellidos').fill('Prueba')
    await addModal.getByPlaceholder('Email').fill(email)

    await addModal.getByRole('button', { name: 'Agregar administrador' }).click()

    await expect(addModal).toBeHidden({ timeout: 30_000 })
    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    // DESACTIVAR (la fila creada se agrega al final)
    const createdRow = rows.last()
    await ensureExpanded(createdRow, 'Desactivar')
    await createdRow.getByRole('button', { name: 'Desactivar' }).click()

    await expect(rows).toHaveCount(before, { timeout: 30_000 })

    // REACTIVAR mediante el botón superior "Activar admin"
    await page.getByRole('button', { name: 'Activar admin', exact: true }).click()

    const activateModal = page.locator('.modal')
    await expect(activateModal).toBeVisible({ timeout: 30_000 })

    await activateModal.getByPlaceholder('Cédula').fill(cedula)
    await activateModal.getByRole('button', { name: 'Activar administrador' }).click()

    await expect(activateModal).toBeHidden({ timeout: 30_000 })
    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    // ELIMINAR (fila reactivada nuevamente al final) — limpieza total
    const rowToDelete = rows.last()
    await ensureExpanded(rowToDelete, 'Eliminar')
    await rowToDelete.getByRole('button', { name: 'Eliminar' }).click()

    const deleteModal = page.locator('.modal')
    await expect(deleteModal).toBeVisible({ timeout: 30_000 })
    await deleteModal.getByRole('button', { name: 'Confirmar' }).click()

    await expect(deleteModal).toBeHidden({ timeout: 30_000 })
    await expect(rows).toHaveCount(before, { timeout: 30_000 })
  })
})
