import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Estudiante sembrado inscrito en un curso EN PROGRESO con calificaciones.
const STUDENT = 'mateo.suarez@example.com'
const COURSE = 'INGLÉS INTERMEDIO'

test.describe('Estudiante: vistas de solo lectura del curso', () => {
  test('ve calificaciones, foro y reunión de un curso en progreso', async ({ page }) => {
    await loginAs(page, STUDENT, 'password123')
    await page.goto('/misCursos')

    const card = page.locator('.card', { hasText: COURSE })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await card.getByRole('button', { name: 'Ver curso' }).click()

    await expect(page.getByText(/Bienvenido al curso de/)).toBeVisible({ timeout: 30_000 })

    // Calificaciones (solo lectura): se muestra la tabla
    await page.getByRole('button', { name: 'Calificaciones', exact: true }).click()
    await expect(page.getByRole('columnheader', { name: 'Actividad' })).toBeVisible({
      timeout: 30_000,
    })

    // Foro
    await page.getByRole('button', { name: 'Foro', exact: true }).click()
    await expect(page.locator('.forum')).toBeVisible({ timeout: 30_000 })

    // Reunión
    await page.getByRole('button', { name: 'Reunión', exact: true }).click()
    await expect(page.locator('.meeting')).toBeVisible({ timeout: 30_000 })
  })
})
