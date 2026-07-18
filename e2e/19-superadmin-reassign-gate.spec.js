import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD

// Ana tiene tutores asignados, así que al intentar eliminarla debe exigir reasignación.
const ADMIN_CON_TUTORES = 'ana.torres@example.com'

test.describe('Super Admin: eliminar admin con tutores exige reasignación', () => {
  test('muestra el requisito de reasignar y permite cancelar sin borrar', async ({ page }) => {
    test.skip(!(SA_EMAIL && SA_PASS), 'Define E2E_SUPERADMIN_*')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })
    await expect(page.getByText('Cargando administradores...')).toBeHidden({ timeout: 30_000 })

    const rows = page.locator('.admin-item')
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })

    // Ubicar la fila de Ana por el valor de su input de email.
    const n = await rows.count()
    let target = null
    for (let i = 0; i < n; i++) {
      const val = await rows.nth(i).locator('input[type="email"]').inputValue()
      if (val === ADMIN_CON_TUTORES) {
        target = rows.nth(i)
        break
      }
    }
    expect(target, 'No se encontró la fila del admin con tutores').not.toBeNull()

    await target.locator('.chev-btn').click()
    await target.getByRole('button', { name: 'Eliminar' }).click()

    // El modal exige reasignar y muestra el selector de administrador destino.
    const modal = page.locator('.modal')
    await expect(modal).toContainText('reasignar', { timeout: 30_000 })
    await expect(modal.locator('.modal-select')).toBeVisible()

    // Cancelar: NO se elimina nada.
    await modal.getByRole('button', { name: 'Cancelar' }).click()
    await expect(modal).toBeHidden({ timeout: 30_000 })
    await expect(rows.first()).toBeVisible()
  })
})
