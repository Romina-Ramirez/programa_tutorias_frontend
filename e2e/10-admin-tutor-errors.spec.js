import { test, expect } from '@playwright/test'
import { loginAs, uniqueCedula, uniquePhone, uniqueEmail } from './helpers'

// Errores de validación del modal "Agregar nuevo tutor" (AdminPage.vue -> addTutor).
// Orden de validación en addTutor: vacíos -> email -> longitud cédula -> longitud teléfono -> backend.
// Todos son casos negativos: la validación/backend impide crear, por lo que NO queda data residual.

const ADMIN_EMAIL = 'ana.torres@example.com'
const ADMIN_PASSWORD = 'password123'

async function fillValid(modal, overrides = {}) {
  const data = {
    email: uniqueEmail('err'),
    cedula: uniqueCedula(),
    nombre: 'Tutor',
    apellido: 'Prueba',
    telefono: uniquePhone(),
    carrera: 'Ingenieria de Software',
    horario: 'Lunes 08:00 - 10:00',
    ...overrides,
  }
  await modal.getByPlaceholder('Email').fill(data.email)
  await modal.getByPlaceholder('Cédula').fill(data.cedula)
  await modal.getByPlaceholder('Nombres').fill(data.nombre)
  await modal.getByPlaceholder('Apellidos').fill(data.apellido)
  await modal.getByPlaceholder('Teléfono').fill(data.telefono)
  await modal.getByPlaceholder('Carrera').fill(data.carrera)
  await modal.getByPlaceholder('Horario Disponible').fill(data.horario)
  return data
}

test.describe('Admin - Errores al registrar un nuevo tutor', () => {
  test.beforeEach(async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD)
    await expect(page.getByText(/Bienvenido Administrador/)).toBeVisible({ timeout: 30_000 })
    await page.getByRole('button', { name: 'Agregar nuevo tutor' }).click()
    await expect(page.locator('.modal')).toBeVisible({ timeout: 30_000 })
  })

  test('campos vacíos: muestra "Debe completar todos los campos."', async ({ page }) => {
    const modal = page.locator('.modal')

    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    await expect(modal.locator('.modal-error')).toHaveText('Debe completar todos los campos.')
    await expect(modal).toBeVisible()
  })

  test('email inválido: muestra "El email no es válido."', async ({ page }) => {
    const modal = page.locator('.modal')

    // Todos los campos válidos EXCEPTO el email.
    await fillValid(modal, { email: 'correo-malo' })
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    await expect(modal.locator('.modal-error')).toContainText('email no es válido')
    await expect(modal).toBeVisible()
  })

  test('teléfono incompleto: muestra "El teléfono debe tener 10 dígitos."', async ({ page }) => {
    const modal = page.locator('.modal')

    // Email y cédula válidos para superar sus validaciones previas; teléfono corto.
    await fillValid(modal, { telefono: '123' })
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    await expect(modal.locator('.modal-error')).toContainText('teléfono debe tener 10')
    await expect(modal).toBeVisible()
  })

  test('cédula duplicada: el backend responde con un error que contiene "existe"', async ({
    page,
  }) => {
    const modal = page.locator('.modal')

    // Todo válido a nivel de cliente (email único, teléfono de 10 dígitos, cédula de 10 dígitos)
    // para llegar al backend; la cédula 1710100002 ya existe.
    await fillValid(modal, { email: uniqueEmail('dup'), cedula: '1710100002' })
    await modal.getByRole('button', { name: 'Registrar Tutor' }).click()

    await expect(modal.locator('.modal-error')).toContainText('existe', { timeout: 30_000 })
    await expect(modal).toBeVisible()
  })
})
