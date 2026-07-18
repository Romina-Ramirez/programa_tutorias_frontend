import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const TEST_URL = 'https://meet.google.com/e2e-prueba-automatizada'

test.describe('Tutor: editar el enlace de reunión', () => {
  test('cambia el enlace de reunión y lo restaura', async ({ page }) => {
    await loginAs(page, 'tomas.rios@example.com', 'password123')
    await page.goto('/perfilTutor')

    const input = page.locator('#meetingUrl')
    await expect(input).toBeVisible({ timeout: 30_000 })
    const original = await input.inputValue()

    const editBtn = page.locator('.edit-btn')

    // Editar -> cambiar -> guardar
    await editBtn.click()
    await input.fill(TEST_URL)
    await editBtn.click()

    await expect(page.getByText('Perfil actualizado correctamente')).toBeVisible({ timeout: 30_000 })
    await expect(input).toHaveValue(TEST_URL)

    // Restaurar el valor original (no dejar cambios en los datos reales)
    await editBtn.click()
    await input.fill(original)
    await editBtn.click()
    await expect(input).toHaveValue(original, { timeout: 30_000 })
  })
})
