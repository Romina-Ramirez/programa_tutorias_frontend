import { test, expect } from '@playwright/test'
import { loginAs, futureDate } from './helpers'

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || 'ana.torres@example.com'
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || 'password123'

const COURSE_NAME = 'E2E Curso Test'

test.describe('Admin: gestión de cursos', () => {
  test('valida el cupo (5-40), crea un curso y luego lo elimina', async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    // Abre los cursos del primer tutor.
    const firstTutor = page.locator('.tutor-item').first()
    await expect(firstTutor).toBeVisible({ timeout: 30_000 })
    await firstTutor.locator('.chev-btn').click()
    await firstTutor.getByRole('button', { name: 'Visualizar cursos activos' }).click()

    const coursesModal = page.locator('.modal-courses')
    await expect(coursesModal).toBeVisible({ timeout: 30_000 })
    await coursesModal.getByRole('button', { name: 'Agregar nuevo curso' }).click()

    // Formulario de curso (modal aparte).
    const form = page.locator('.modal-course-form')
    await expect(form).toBeVisible()
    await form.getByPlaceholder('Nombre').fill(COURSE_NAME)
    await form.getByPlaceholder('Descripción').fill('Curso creado por la prueba E2E automatizada.')
    await form.locator('input[type="date"]').nth(0).fill(futureDate(30))
    await form.locator('input[type="date"]').nth(1).fill(futureDate(60))
    await form.getByPlaceholder('Horario').fill('Lunes 08:00-10:00')
    await form.getByPlaceholder('Materia').fill('Programación')

    // Cupo inválido (3) -> debe mostrar error y NO crear.
    await form.getByPlaceholder('Cupo máximo (5 - 40)').fill('3')
    await form.getByRole('button', { name: 'Agregar curso' }).click()
    await expect(form.locator('.modal-error')).toContainText('entre 5 y 40')

    // Cupo válido -> se crea.
    await form.getByPlaceholder('Cupo máximo (5 - 40)').fill('20')
    await form.getByRole('button', { name: 'Agregar curso' }).click()

    // Aparece la tarjeta del curso (el título se muestra en mayúsculas).
    const card = coursesModal.locator('.course-card', { hasText: COURSE_NAME.toUpperCase() })
    await expect(card).toBeVisible({ timeout: 30_000 })

    // Eliminar el curso recién creado (autolimpieza).
    await card.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(coursesModal.locator('.course-card', { hasText: COURSE_NAME.toUpperCase() })).toHaveCount(0, {
      timeout: 30_000,
    })
  })
})
