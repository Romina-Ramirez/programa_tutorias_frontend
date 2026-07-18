import { test, expect } from '@playwright/test'
import { loginAs, futureDate } from './helpers'

const NAME = 'E2E Curso Editar'
const NAME2 = 'E2E Curso Editado'

test.describe('Admin: editar un curso', () => {
  test('crea un curso, le cambia el nombre y lo elimina', async ({ page }) => {
    await loginAs(page, 'ana.torres@example.com', 'password123')
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Cargando tutores...')).toBeHidden({ timeout: 30_000 })

    const firstTutor = page.locator('.tutor-item').first()
    await expect(firstTutor).toBeVisible({ timeout: 30_000 })
    await firstTutor.locator('.chev-btn').click()
    await firstTutor.getByRole('button', { name: 'Visualizar cursos activos' }).click()

    const coursesModal = page.locator('.modal-courses')
    await expect(coursesModal).toBeVisible({ timeout: 30_000 })

    // Crear
    await coursesModal.getByRole('button', { name: 'Agregar nuevo curso' }).click()
    let form = page.locator('.modal-course-form')
    await form.getByPlaceholder('Nombre').fill(NAME)
    await form.getByPlaceholder('Descripción').fill('Curso para probar edición.')
    await form.locator('input[type="date"]').nth(0).fill(futureDate(30))
    await form.locator('input[type="date"]').nth(1).fill(futureDate(60))
    await form.getByPlaceholder('Horario').fill('Lunes 08:00-10:00')
    await form.getByPlaceholder('Materia').fill('Programación')
    await form.getByPlaceholder('Cupo máximo (5 - 40)').fill('15')
    await form.getByRole('button', { name: 'Agregar curso' }).click()

    const card = coursesModal.locator('.course-card', { hasText: NAME.toUpperCase() })
    await expect(card).toBeVisible({ timeout: 30_000 })

    // Editar el nombre
    await card.getByRole('button', { name: 'Editar' }).click()
    form = page.locator('.modal-course-form')
    await expect(form).toBeVisible({ timeout: 30_000 })
    await form.getByPlaceholder('Nombre').fill(NAME2)
    await form.getByRole('button', { name: 'Guardar cambios' }).click()

    // El curso ahora muestra el nuevo nombre y ya no el viejo
    await expect(coursesModal.locator('.course-card', { hasText: NAME2.toUpperCase() })).toBeVisible({
      timeout: 30_000,
    })
    await expect(coursesModal.locator('.course-card', { hasText: NAME.toUpperCase() })).toHaveCount(0)

    // Eliminar (autolimpieza)
    await coursesModal
      .locator('.course-card', { hasText: NAME2.toUpperCase() })
      .getByRole('button', { name: 'Eliminar' })
      .click()
    await page.getByRole('button', { name: 'Confirmar' }).click()
    await expect(coursesModal.locator('.course-card', { hasText: NAME2.toUpperCase() })).toHaveCount(
      0,
      { timeout: 30_000 },
    )
  })
})
