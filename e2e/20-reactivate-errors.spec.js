import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD

const CEDULA_INEXISTENTE = '9999999999'

test.describe('Reactivación por cédula: casos de error', () => {
  test('admin: activar tutor con cédula inexistente muestra error', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.locator('.info-actions').getByRole('button', { name: 'Activar tutor' }).click()
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })
    await modal.getByPlaceholder('Cédula').fill(CEDULA_INEXISTENTE)
    await modal.getByRole('button', { name: 'Activar tutor' }).click()

    await expect(modal.locator('.modal-error')).toContainText('No existe', { timeout: 30_000 })
    await expect(modal).toBeVisible()
  })

  test('super admin: activar admin con cédula inexistente muestra error', async ({ page }) => {
    test.skip(!(SA_EMAIL && SA_PASS), 'Define E2E_SUPERADMIN_*')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Activar admin', exact: true }).click()
    const modal = page.locator('.modal')
    await expect(modal).toBeVisible({ timeout: 30_000 })
    await modal.getByPlaceholder('Cédula').fill(CEDULA_INEXISTENTE)
    await modal.getByRole('button', { name: 'Activar administrador' }).click()

    await expect(modal.locator('.modal-error')).toContainText('No existe', { timeout: 30_000 })
    await expect(modal).toBeVisible()
  })
})
