import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD

test.describe('Reactivar un usuario que ya está activo muestra error', () => {
  test('admin: activar un tutor ya activo', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.locator('.info-actions').getByRole('button', { name: 'Activar tutor' }).click()
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })
    await modal.getByPlaceholder('Cédula').fill('1710100002') // Carlos, activo, de Ana
    await modal.getByRole('button', { name: 'Activar tutor' }).click()

    await expect(modal.locator('.modal-error')).toContainText('ya está activo', { timeout: 30_000 })
  })

  test('super admin: activar un admin ya activo', async ({ page }) => {
    test.skip(!(SA_EMAIL && SA_PASS), 'Define E2E_SUPERADMIN_*')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Activar admin', exact: true }).click()
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })
    await modal.getByPlaceholder('Cédula').fill('1710000001') // Ana, admin activo
    await modal.getByRole('button', { name: 'Activar administrador' }).click()

    await expect(modal.locator('.modal-error')).toContainText('ya está activo', { timeout: 30_000 })
  })
})
