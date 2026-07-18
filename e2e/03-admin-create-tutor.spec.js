import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniquePhone, uniqueEmail } from './helpers'

// Credenciales de un admin sembrado (contraseña de prueba conocida).
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ana.torres@example.com'
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || 'password123'

test.describe('Admin: gestión de tutores', () => {
  test('crea un tutor nuevo y luego lo elimina (autolimpieza)', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    const rows = page.locator('.tutor-item')
    // Espera a que la lista de tutores termine de cargar antes de contar.
    await expect(page.getByText('Cargando tutores...')).toBeHidden({ timeout: 30_000 })
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    const before = await rows.count()

    const email = uniqueEmail('tutor')

    await page.getByRole('button', { name: 'Agregar nuevo tutor' }).click()
    const modal = page.locator('.modal')
    await modal.getByPlaceholder('Email').fill(email)
    await modal.getByPlaceholder('Cédula').fill(uniqueCedula())
    await modal.getByPlaceholder('Nombres').fill('E2E Tutor')
    await modal.getByPlaceholder('Apellidos').fill('Prueba Auto')
    await modal.getByPlaceholder('Teléfono').fill(uniquePhone())
    await modal.getByPlaceholder('Carrera').fill('Ingeniería de Pruebas')
    await modal.getByPlaceholder('Horario Disponible').fill('Lunes 10:00-12:00')
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    // Se agregó una fila (el nuevo tutor se añade al final de la lista).
    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    // Eliminar el tutor recién creado (borrado físico: no tiene cursos).
    const newRow = rows.last()
    await newRow.locator('.chev-btn').click()
    await newRow.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    // Vuelve al conteo original → la BD queda limpia.
    await expect(rows).toHaveCount(before, { timeout: 30_000 })
  })
})
