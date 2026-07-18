import { test, expect } from '@playwright/test'
import { loginAs, uniquePhone, uniqueEmail } from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ana.torres@example.com'
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || 'password123'

test.describe('Validaciones del formulario de tutor', () => {
  test('no permite crear tutor con cédula de menos de 10 dígitos', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    await page.getByRole('button', { name: 'Agregar nuevo tutor' }).click()
    const modal = page.locator('.modal')
    await modal.getByPlaceholder('Email').fill(uniqueEmail('badtutor'))
    await modal.getByPlaceholder('Cédula').fill('123') // inválida
    await modal.getByPlaceholder('Nombres').fill('E2E')
    await modal.getByPlaceholder('Apellidos').fill('Invalido')
    await modal.getByPlaceholder('Teléfono').fill(uniquePhone())
    await modal.getByPlaceholder('Carrera').fill('Pruebas')
    await modal.getByPlaceholder('Horario Disponible').fill('Lunes 10:00-12:00')
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    // Debe mostrar el error y NO cerrar el modal ni crear nada.
    await expect(modal.locator('.modal-error')).toContainText('cédula debe tener 10')
    await expect(modal).toBeVisible()
  })
})
