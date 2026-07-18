import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Este test requiere un escenario preparado en BD (scratchpad/create-reassign-scenario.js):
// Admin A (e2e.reasiga@example.com) con un tutor, y Admin B (E2E ReasigB Prueba) como destino.
// Se habilita con E2E_REASSIGN=1 además de las credenciales del super admin.
const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD
const ENABLED = Boolean(SA_EMAIL && SA_PASS && process.env.E2E_REASSIGN)

const ADMIN_A_EMAIL = 'e2e.reasiga@example.com'
const ADMIN_B_LABEL = 'E2E ReasigB Prueba'

test.describe('Super Admin: eliminar admin con tutores reasignándolos', () => {
  test('elimina el admin y reasigna sus tutores al admin destino', async ({ page }) => {
    test.skip(!ENABLED, 'Requiere E2E_REASSIGN=1, credenciales de super admin y el escenario en BD')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Cargando administradores...')).toBeHidden({ timeout: 30_000 })

    const rows = page.locator('.admin-item')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    const before = await rows.count()

    // Ubicar la fila del admin A por su email.
    const n = await rows.count()
    let target = null
    for (let i = 0; i < n; i++) {
      const val = await rows.nth(i).locator('input[type="email"]').inputValue()
      if (val === ADMIN_A_EMAIL) {
        target = rows.nth(i)
        break
      }
    }
    expect(target, 'No se encontró el admin A del escenario').not.toBeNull()

    await target.locator('.chev-btn').click()
    await target.getByRole('button', { name: 'Eliminar' }).click()

    // El modal exige reasignar; seleccionamos al admin destino B y confirmamos.
    const modal = page.locator('.modal')
    await expect(modal).toContainText('reasignar', { timeout: 30_000 })
    await modal.locator('.modal-select').selectOption({ label: ADMIN_B_LABEL })
    await modal.getByRole('button', { name: 'Confirmar' }).click()

    // El admin A se eliminó (y sus tutores quedaron reasignados a B).
    await expect(modal).toBeHidden({ timeout: 30_000 })
    await expect(rows).toHaveCount(before - 1, { timeout: 30_000 })
  })
})
