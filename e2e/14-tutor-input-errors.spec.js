import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

test.describe('Tutor - errores de validación en entradas del curso', () => {
  test.beforeEach(async ({ page }) => {
    // Inicia sesión como tutor y aterriza en "Mis cursos"
    await loginAs(page, 'tomas.rios@example.com', 'password123')

    // Abre el curso "ALGORITMOS AVANZADOS" desde su tarjeta
    const card = page.locator('.card', { hasText: 'ALGORITMOS AVANZADOS' })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await card.getByRole('button', { name: 'Ver curso' }).click()

    // Página del curso cargada (subnav visible)
    await expect(page.getByText(/Bienvenido al curso de/)).toBeVisible({ timeout: 30_000 })
    await expect(
      page.getByRole('button', { name: 'Calificaciones', exact: true }),
    ).toBeVisible({ timeout: 30_000 })
  })

  test('nota mayor a 20 muestra error', async ({ page }) => {
    // Ir a Calificaciones
    await page.getByRole('button', { name: 'Calificaciones', exact: true }).click()

    // Abrir el formulario de agregar calificaciones
    await page.getByRole('button', { name: 'Agregar calificaciones' }).click()

    // Ingresar una nota fuera de rango (mayor a 20)
    const scoreInput = page.locator('.score-cell input').first()
    await expect(scoreInput).toBeVisible({ timeout: 30_000 })
    await scoreInput.fill('25')

    // Debe mostrarse el error de rango (contiene "20")
    const cellError = page.locator('.cell-error').first()
    await expect(cellError).toBeVisible({ timeout: 30_000 })
    await expect(cellError).toContainText('20')

    // No se guarda nada: cancelar (nada que limpiar)
    await page.getByRole('button', { name: 'Cancelar', exact: true }).click()
  })

  test('minutos fuera de rango muestra aviso', async ({ page }) => {
    // Ir a Reportes
    await page.getByRole('button', { name: 'Reportes', exact: true }).click()

    // Abrir el modal de agregar reporte
    await page.getByRole('button', { name: 'Agregar reporte' }).click()

    // Escribir minutos fuera de rango (mayor a 360)
    const minutesInput = page.getByPlaceholder('Minutos realizados')
    await expect(minutesInput).toBeVisible({ timeout: 30_000 })
    await minutesInput.pressSequentially('400')

    // Debe mostrarse el aviso (contiene "Máximo" o "360")
    const err = page.locator('.err')
    await expect(err).toBeVisible({ timeout: 30_000 })
    await expect(err).toContainText(/Máximo|360/)

    // No se guarda nada: cerrar el modal con la × (nada que limpiar)
    await page.getByRole('button', { name: 'Cerrar' }).click()
  })
})
