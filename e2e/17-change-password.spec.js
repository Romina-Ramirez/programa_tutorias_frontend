import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniqueEmail } from './helpers'

test.describe('Cambiar contraseña', () => {
  test('un estudiante cambia su contraseña y la nueva funciona', async ({ page }) => {
    const email = uniqueEmail('cambio')
    const nueva = 'nuevaClave123'

    // Registrar un estudiante nuevo (se limpia luego por base)
    await page.goto('/registrarse')
    await page.locator('#cedula').fill(uniqueCedula())
    await page.locator('#email').fill(email)
    await page.locator('#nombre').fill('E2E Cambio')
    await page.locator('#apellido').fill('Clave')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')
    await page.getByRole('button', { name: 'Regístrate' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

    await loginAs(page, email, 'password123')
    await page.goto('/cambiarContrasenia')

    // Negativo: contraseñas que no coinciden
    await page.locator('#password').fill(nueva)
    await page.locator('#confirmPassword').fill('distinta999')
    await page.getByRole('button', { name: 'Aceptar' }).click()
    await expect(page.getByRole('alert')).toContainText('no coinciden')

    // Positivo: cambio correcto -> redirige a /perfil
    await page.locator('#password').fill(nueva)
    await page.locator('#confirmPassword').fill(nueva)
    await page.getByRole('button', { name: 'Aceptar' }).click()
    await expect(page).toHaveURL(/\/perfil/, { timeout: 30_000 })

    // Cerrar sesión
    await page.getByRole('button', { name: 'Abrir menú de usuario' }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()
    await expect(page).toHaveURL(/\/(login|$)/, { timeout: 30_000 })

    // Iniciar sesión con la NUEVA contraseña
    await loginAs(page, email, nueva)
    await expect(page.getByRole('button', { name: 'Abrir menú de usuario' })).toBeVisible({
      timeout: 30_000,
    })
  })
})
