import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Tutor sembrado con un curso EN PROGRESO (Algoritmos Avanzados) y estudiantes inscritos.
const TUTOR_EMAIL = process.env.E2E_TUTOR_EMAIL || 'tomas.rios@example.com'
const TUTOR_PASS = process.env.E2E_TUTOR_PASSWORD || 'password123'
const COURSE_TITLE = 'ALGORITMOS AVANZADOS'

// Marcadores para poder limpiar por base después.
const GRADE_ACTIVITY = 'E2E-Grade'
const REPORT_TEXT = 'E2E Reporte de prueba automatizada.'

test.describe('Tutor: calificaciones y reportes', () => {
  test('agrega una calificación a todos los estudiantes y crea un reporte', async ({ page }) => {
    await loginAs(page, TUTOR_EMAIL, TUTOR_PASS)

    // Mis cursos -> abrir el curso en progreso.
    const card = page.locator('.card', { hasText: COURSE_TITLE })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await card.getByRole('button', { name: 'Ver curso' }).click()

    // --- Calificaciones ---
    await page.getByRole('button', { name: 'Calificaciones' }).click()
    await page.getByRole('button', { name: 'Agregar calificaciones' }).click()

    // Actividad única arriba (se replica en todas las filas).
    await page.getByPlaceholder('Nombre de la actividad').fill(GRADE_ACTIVITY)

    // Nota para cada estudiante.
    const scores = page.locator('.score-cell input')
    const n = await scores.count()
    expect(n).toBeGreaterThan(0)
    for (let i = 0; i < n; i++) await scores.nth(i).fill('15')

    await page.getByRole('button', { name: 'Guardar', exact: true }).click()

    // Vuelve a vista y la actividad aparece en la tabla.
    await expect(page.getByText(GRADE_ACTIVITY).first()).toBeVisible({ timeout: 30_000 })

    // --- Reporte ---
    await page.getByRole('button', { name: 'Reportes' }).click()
    await page.getByRole('button', { name: 'Agregar reporte' }).click()

    await page.getByPlaceholder('Descripción de la actividad').fill(REPORT_TEXT)
    await page.getByPlaceholder('Minutos realizados').fill('60')
    await page.getByRole('button', { name: 'Ingresar Reporte' }).click()

    await expect(page.getByText(REPORT_TEXT)).toBeVisible({ timeout: 30_000 })
  })
})
