import { test, expect } from '@playwright/test'

test.describe('Home pública', () => {
  test('muestra cursos disponibles y filtros', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByText('Cursos disponibles')).toBeVisible()
    await expect(page.getByText('Materia', { exact: true })).toBeVisible()

    // Debe haber al menos un curso con su botón "Ver curso".
    await expect(page.getByRole('button', { name: 'Ver curso' }).first()).toBeVisible()
  })
})
