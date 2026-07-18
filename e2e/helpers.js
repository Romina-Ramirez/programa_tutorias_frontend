import { expect } from '@playwright/test'

// Sufijo único por corrida (evita choques de cédula/email/teléfono en la BD real).
export function uniqueSuffix() {
  return String(Date.now()).slice(-9)
}

// Cédula de 10 dígitos que empieza en 9 (los reales empiezan en 17.../00...).
export function uniqueCedula() {
  return '9' + uniqueSuffix()
}

// Teléfono de 10 dígitos (09 + 8).
export function uniquePhone() {
  return '09' + uniqueSuffix().slice(0, 8)
}

// Correo SIEMPRE @example.com para no disparar correos reales.
export function uniqueEmail(rol) {
  return `e2e.${rol}.${Date.now()}@example.com`
}

// Fecha futura en formato YYYY-MM-DD (para inputs type=date).
export function futureDate(daysFromNow) {
  return new Date(Date.now() + daysFromNow * 86400000).toISOString().slice(0, 10)
}

// Inicia sesión y espera aterrizar en la vista según el rol.
export async function loginAs(page, email, password) {
  await page.goto('/login')
  await page.locator('#email').fill(email)
  await page.locator('#password').fill(password)
  await page.getByRole('button', { name: 'Inicia Sesión' }).click()
}

export { expect }
