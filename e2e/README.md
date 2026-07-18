# Pruebas E2E (Playwright)

Pruebas de extremo a extremo sobre la app desplegada, cubriendo la creación de
usuarios de cada tipo y las validaciones clave.

## Cómo correrlas

```bash
npm run test:e2e            # corre toda la suite
npm run test:e2e:report    # abre el reporte HTML del último run
npm run test:e2e:ui        # modo interactivo (UI de Playwright)
```

Por defecto apunta a `https://programa-tutorias.vercel.app`. Se puede cambiar:

```bash
E2E_BASE_URL=http://localhost:5173 npm run test:e2e
```

## Qué cubre

| Archivo | Escenario |
|---|---|
| `01-home.spec.js` | La home pública muestra cursos y filtros |
| `02-register-student.spec.js` | Registro de **estudiante** + validación de cédula (10 dígitos) y de contraseñas que coinciden |
| `03-admin-create-tutor.spec.js` | Un **admin** crea un **tutor** y luego lo elimina (autolimpieza) |
| `04-validations.spec.js` | El alta de tutor rechaza cédula inválida sin crear nada |
| `05-superadmin-create-admin.spec.js` | Un **super admin** crea un **admin** y lo elimina (requiere credenciales) |

## Notas de diseño

- **No se cuelga por el cold start:** `global-setup.js` "despierta" el backend de
  Render antes de correr; además hay timeouts holgados y `retries: 1`.
- **No ensucia la base:** las pruebas de admin/tutor y super admin/admin
  **crean y luego borran** el registro. Los correos usan `@example.com` (no
  entregan) y las cédulas/teléfonos son únicos por corrida.
- **En serie (`workers: 1`)** para evitar choques al escribir en la BD real.
- El registro de estudiante sí deja un usuario `@example.com` (no hay borrado de
  estudiantes por interfaz); se puede limpiar por base si se desea.

## Credenciales

- Admin de prueba: `ana.torres@example.com` / `password123`
  (override con `E2E_ADMIN_EMAIL` / `E2E_ADMIN_PASSWORD`).
- Super admin: se pasa por entorno (no hay contraseña de prueba conocida):

  ```bash
  E2E_SUPERADMIN_EMAIL=... E2E_SUPERADMIN_PASSWORD=... npm run test:e2e
  ```
