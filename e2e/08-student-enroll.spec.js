import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniqueEmail } from './helpers'

test.describe('Estudiante: inscripción a un curso', () => {
  test('se registra, inicia sesión y se inscribe en un curso disponible', async ({ page }) => {
    const email = uniqueEmail('estudiante')

    // 1) Registro
    await page.goto('/registrarse')
    await page.locator('#cedula').fill(uniqueCedula())
    await page.locator('#email').fill(email)
    await page.locator('#nombre').fill('E2E Estudiante')
    await page.locator('#apellido').fill('Inscripcion')
    await page.locator('#password').fill('password123')
    await page.locator('#confirmPassword').fill('password123')
    await page.getByRole('button', { name: 'Regístrate' }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })

    // 2) Login como ese estudiante
    await loginAs(page, email, 'password123')

    // 3) Home -> abrir el primer curso disponible
    await page.getByRole('button', { name: 'Ver curso' }).first().click()

    // 4) Inscribirse
    await page.getByRole('button', { name: 'Inscribirse' }).click()

    // 5) Al inscribirse aparece la navegación del curso (Foro), que solo se ve estando inscrito.
    await expect(page.getByRole('button', { name: 'Foro' })).toBeVisible({ timeout: 30_000 })
    await expect(page.getByRole('button', { name: 'Inscribirse' })).toHaveCount(0)
  })
})
