import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniquePhone, uniqueEmail, futureDate } from './helpers'

const COURSE_NAME = 'E2E Curso Bloqueo'

test.describe('Admin: no se puede eliminar un tutor con cursos asociados', () => {
  test('el borrado definitivo se bloquea con cursos y funciona tras quitarlos', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Cargando tutores...')).toBeHidden({ timeout: 30_000 })

    const rows = page.locator('.tutor-item')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    const before = await rows.count()

    async function ensureExpanded(row, actionName) {
      const btn = row.getByRole('button', { name: actionName })
      if (!(await btn.isVisible())) await row.locator('.chev-btn').click()
      await expect(btn).toBeVisible({ timeout: 30_000 })
    }

    // Crear tutor
    await page.getByRole('button', { name: 'Agregar nuevo tutor' }).click()
    const modal = page.locator('.modal')
    await modal.getByPlaceholder('Email').fill(uniqueEmail('bloqueo'))
    await modal.getByPlaceholder('Cédula').fill(uniqueCedula())
    await modal.getByPlaceholder('Nombres').fill('E2E Bloqueo')
    await modal.getByPlaceholder('Apellidos').fill('Prueba')
    await modal.getByPlaceholder('Teléfono').fill(uniquePhone())
    await modal.getByPlaceholder('Carrera').fill('Ingeniería E2E')
    await modal.getByPlaceholder('Horario Disponible').fill('Lunes 08:00-10:00')
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()
    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })
    const newRow = rows.last()

    // Crear un curso para ese tutor
    await ensureExpanded(newRow, 'Visualizar cursos activos')
    await newRow.getByRole('button', { name: 'Visualizar cursos activos' }).click()
    const coursesModal = page.locator('.modal-courses')
    await expect(coursesModal).toBeVisible({ timeout: 30_000 })
    await coursesModal.getByRole('button', { name: 'Agregar nuevo curso' }).click()
    const form = page.locator('.modal-course-form')
    await form.getByPlaceholder('Nombre').fill(COURSE_NAME)
    await form.getByPlaceholder('Descripción').fill('Curso para probar el bloqueo de borrado.')
    await form.locator('input[type="date"]').nth(0).fill(futureDate(30))
    await form.locator('input[type="date"]').nth(1).fill(futureDate(60))
    await form.getByPlaceholder('Horario').fill('Lunes 08:00-10:00')
    await form.getByPlaceholder('Materia').fill('Programación')
    await form.getByPlaceholder('Cupo máximo (5 - 40)').fill('10')
    await form.getByRole('button', { name: 'Agregar curso' }).click()
    await expect(
      coursesModal.locator('.course-card', { hasText: COURSE_NAME.toUpperCase() }),
    ).toBeVisible({ timeout: 30_000 })
    await coursesModal.getByRole('button', { name: 'Cerrar' }).click()

    // Intentar eliminar el tutor -> BLOQUEADO (tiene cursos)
    await ensureExpanded(newRow, 'Eliminar')
    await newRow.getByRole('button', { name: 'Eliminar' }).click()
    const deleteModal = page.locator('.modal')
    await deleteModal.getByRole('button', { name: 'Confirmar' }).click()
    await expect(deleteModal.locator('.modal-error')).toContainText('cursos asociados', {
      timeout: 30_000,
    })
    await deleteModal.getByRole('button', { name: 'Cancelar' }).click()
    await expect(rows).toHaveCount(before + 1)

    // Quitar el curso
    await ensureExpanded(newRow, 'Visualizar cursos activos')
    await newRow.getByRole('button', { name: 'Visualizar cursos activos' }).click()
    const cm2 = page.locator('.modal-courses')
    await expect(cm2).toBeVisible({ timeout: 30_000 })
    await cm2
      .locator('.course-card', { hasText: COURSE_NAME.toUpperCase() })
      .getByRole('button', { name: 'Eliminar' })
      .click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(cm2.locator('.course-card', { hasText: COURSE_NAME.toUpperCase() })).toHaveCount(0, {
      timeout: 30_000,
    })
    await cm2.getByRole('button', { name: 'Cerrar' }).click()

    // Ahora sí eliminar el tutor -> éxito (autolimpieza)
    await ensureExpanded(newRow, 'Eliminar')
    await newRow.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(rows).toHaveCount(before, { timeout: 30_000 })
  })
})
