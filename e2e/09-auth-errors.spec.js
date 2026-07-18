import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Autenticación: errores de login, rutas protegidas y cierre de sesión', () => {
  test('login con contraseña incorrecta muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.fill('#email', 'ana.torres@example.com')
    await page.fill('#password', 'claveIncorrecta')
    await page.getByRole('button', { name: 'Inicia Sesión' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('login con correo inexistente muestra error', async ({ page }) => {
    await page.goto('/login')

    await page.fill('#email', 'no.existe.' + Date.now() + '@example.com')
    await page.fill('#password', 'x')
    await page.getByRole('button', { name: 'Inicia Sesión' }).click()

    await expect(page.getByRole('alert')).toBeVisible({ timeout: 30_000 })
    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('ruta protegida sin sesión redirige a login', async ({ page }) => {
    await page.goto('/admin')

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })

  test('cerrar sesión', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')

    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Abrir menú de usuario' }).click()
    await page.getByRole('menuitem', { name: 'Cerrar sesión' }).click()

    await expect(page).toHaveURL(/\/login/, { timeout: 30_000 })
  })
})
