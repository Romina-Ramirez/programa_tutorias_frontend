import { chromium } from '@playwright/test'

const BASE_URL = process.env.E2E_BASE_URL || 'https://programa-tutorias.vercel.app'

// El backend en Render (plan gratis) se duerme tras inactividad y la primera
// petición puede tardar ~50s. Aquí lo "despertamos" antes de correr los tests
// para que ninguno se cuelgue por el cold start.
export default async function globalSetup() {
  const browser = await chromium.launch()
  const page = await browser.newPage()
  // eslint-disable-next-line no-console
  console.log('[warm-up] Despertando backend (cold start de Render)...')

  const deadline = Date.now() + 150_000
  let ok = false
  while (Date.now() < deadline && !ok) {
    try {
      await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 60_000 })
      // Que aparezca "Cursos disponibles" indica que la API ya respondió.
      await page.getByText('Cursos disponibles', { exact: false }).waitFor({ timeout: 30_000 })
      ok = true
    } catch {
      await page.waitForTimeout(3000)
    }
  }

  await browser.close()
  // eslint-disable-next-line no-console
  console.log(ok ? '[warm-up] Backend listo.' : '[warm-up] Sin confirmación; se seguirá con reintentos.')
}
