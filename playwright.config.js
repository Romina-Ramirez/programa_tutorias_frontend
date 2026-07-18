import { defineConfig, devices } from '@playwright/test'

// La app desplegada (Vercel). Se puede sobreescribir con E2E_BASE_URL.
const BASE_URL = process.env.E2E_BASE_URL || 'https://programa-tutorias.vercel.app'

export default defineConfig({
  testDir: './e2e',
  // Calienta el backend (cold start del plan gratis de Render) antes de correr.
  globalSetup: './e2e/global-setup.js',

  // Tiempos holgados para que NO se cuelgue por el arranque en frío.
  timeout: 90_000,
  expect: { timeout: 20_000 },

  // En serie y 1 worker: los tests escriben en la BD de producción, así evitamos
  // choques y hacemos el flujo lo más estable posible.
  fullyParallel: false,
  workers: 1,
  retries: 1,

  reporter: [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    headless: true,
    navigationTimeout: 60_000,
    actionTimeout: 20_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
