import { test, expect } from '@playwright/test'
import { uniqueCedula, uniqueEmail } from './helpers'

test.describe('Registro de estudiante', () => {
  test('crea un estudiante nuevo y redirige a login', async ({ page }) => {
    await page.goto('/registrarse')

    await page.locator('#cedula').fill(uniqueCedula())
    await page.locator('#email').fill(uniqueEmail('estudiante'))
    await page.locator('#nombre').fill('E2E Estudiante')
    await page.locator('#apellido').fill('Prueba Automatica')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')

    await page.getByRole('button', { name: 'Regístrate' }).click()

    // Registro correcto → el frontend redirige a /login.
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('rechaza cédula con menos de 10 dígitos', async ({ page }) => {
    await page.goto('/registrarse')

    await page.locator('#cedula').fill('123')
    await page.locator('#email').fill(uniqueEmail('bad'))
    await page.locator('#nombre').fill('X')
    await page.locator('#apellido').fill('Y')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')

    await page.getByRole('button', { name: 'Regístrate' }).click()

    await expect(page.getByRole('alert')).toContainText('cédula debe tener 10')
  })

  test('rechaza contraseñas que no coinciden', async ({ page }) => {
    await page.goto('/registrarse')

    await page.locator('#cedula').fill(uniqueCedula())
    await page.locator('#email').fill(uniqueEmail('bad'))
    await page.locator('#nombre').fill('X')
    await page.locator('#apellido').fill('Y')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('otraClave999')

    await page.getByRole('button', { name: 'Regístrate' }).click()

    await expect(page.getByRole('alert')).toContainText('no coinciden')
  })
})
