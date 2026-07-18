import { test, expect } from '@playwright/test'
import { uniqueCedula } from './helpers'

test.describe('Registro de estudiante - correo duplicado', () => {
  test('registro con correo ya existente muestra error', async ({ page }) => {
    await page.goto('/registrarse')

    await page.locator('#cedula').fill(uniqueCedula())
    await page.locator('#email').fill('juan.perez@example.com')
    await page.locator('#nombre').fill('Estudiante')
    await page.locator('#apellido').fill('Duplicado')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')

    await page.getByRole('button', { name: 'Regístrate' }).click()

    const alert = page.getByRole('alert')
    await expect(alert).toBeVisible({ timeout: 30_000 })
    await expect(alert).toContainText(/existe/i)

    await expect(page).toHaveURL(/\/registrarse/, { timeout: 30_000 })
  })
})
