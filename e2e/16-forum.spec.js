import { test, expect } from '@playwright/test'
import { loginAs } from './helpers'

// Marcadores 'E2E' para poder limpiar por base (foros/comentarios no se borran por interfaz).
const FORUM_TEXT = 'E2E Foro de prueba automatizada ' + Date.now()
const COMMENT_TEXT = 'E2E Comentario de prueba'
const COURSE_TITLE = 'ALGORITMOS AVANZADOS'

test.describe('Tutor: foro (crear tema y comentar)', () => {
  test('crea un foro y agrega un comentario', async ({ page }) => {
    await loginAs(page, 'tomas.rios@example.com', 'password123')

    const card = page.locator('.card', { hasText: COURSE_TITLE })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await card.getByRole('button', { name: 'Ver curso' }).click()

    // Ir al Foro
    await page.getByRole('button', { name: 'Foro', exact: true }).click()

    // Crear el foro
    await page.getByRole('button', { name: 'Agregar Foro' }).click()
    await page.getByPlaceholder('Ingrese su texto para publicar el foro').fill(FORUM_TEXT)
    await page.getByRole('button', { name: 'Publicar' }).click()

    // Aparece la publicación
    const post = page.locator('.post-card', { hasText: FORUM_TEXT })
    await expect(post).toBeVisible({ timeout: 30_000 })

    // Abrir detalle y comentar
    await post.getByRole('button', { name: 'Ver comentarios' }).click()
    await page.getByRole('button', { name: 'Agregar comentario' }).click()
    await page.getByPlaceholder('Escribe tu comentario').fill(COMMENT_TEXT)
    await page.getByRole('button', { name: 'Guardar' }).click()

    // Aparece el comentario
    await expect(page.locator('.comment-card', { hasText: COMMENT_TEXT })).toBeVisible({
      timeout: 30_000,
    })
  })
})
