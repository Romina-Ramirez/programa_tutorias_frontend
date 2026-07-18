import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniqueEmail } from './helpers'

// El super admin no tiene contraseña de prueba conocida: se pasa por entorno.
//   E2E_SUPERADMIN_EMAIL=...  E2E_SUPERADMIN_PASSWORD=...
const SA_EMAIL = process.env.E2E_SUPERADMIN_EMAIL
const SA_PASS = process.env.E2E_SUPERADMIN_PASSWORD
const HAS = Boolean(SA_EMAIL && SA_PASS)

test.describe('Super Admin: gestión de administradores', () => {
  test('crea un admin nuevo y luego lo elimina (autolimpieza)', async ({ page }) => {
    test.skip(!HAS, 'Define E2E_SUPERADMIN_EMAIL y E2E_SUPERADMIN_PASSWORD para habilitar')

    await loginAs(page, SA_EMAIL, SA_PASS)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })

    const rows = page.locator('.admin-item')
    // Espera a que la lista de administradores termine de cargar antes de contar.
    await expect(page.getByText('Cargando administradores...')).toBeHidden({ timeout: 30_000 })
    await expect(rows.first()).toBeVisible({ timeout: 30_000 })
    const before = await rows.count()

    await page.getByRole('button', { name: 'Agregar nuevo admin' }).click()
    const modal = page.locator('.modal')
    await modal.getByPlaceholder('Cédula').fill(uniqueCedula())
    await modal.getByPlaceholder('Nombres').fill('E2E Admin')
    await modal.getByPlaceholder('Apellidos').fill('Prueba Auto')
    await modal.getByPlaceholder('Email').fill(uniqueEmail('admin'))
    await modal.getByRole('button', { name: 'Agregar administrador' }).click()

    await expect(rows).toHaveCount(before + 1, { timeout: 30_000 })

    // Eliminar el admin recién creado (no tiene tutores → sin reasignación).
    const newRow = rows.last()
    await newRow.locator('.chev-btn').click()
    await newRow.getByRole('button', { name: 'Eliminar' }).click()
    await page.getByRole('button', { name: 'Confirmar' }).click()

    await expect(rows).toHaveCount(before, { timeout: 30_000 })
  })
})
