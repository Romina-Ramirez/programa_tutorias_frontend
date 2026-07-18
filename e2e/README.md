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

## Qué cubre (32 pruebas en 24 archivos)

| Archivo | Escenario |
|---|---|
| `01-home` | Home pública: cursos y filtros |
| `02-register-student` | Registro de estudiante + validaciones (cédula 10 dígitos, contraseñas) |
| `03-admin-create-tutor` | Admin crea y elimina un tutor (autolimpieza) |
| `04-validations` | Alta de tutor rechaza cédula inválida |
| `05-superadmin-create-admin` | Super admin crea y elimina un admin |
| `06-admin-course` | Admin crea curso (valida cupo 5–40) y lo elimina |
| `07-tutor-grade-report` | Tutor califica a todos y crea un reporte |
| `08-student-enroll` | Estudiante se registra, inicia sesión y se inscribe |
| `09-auth-errors` | Login incorrecto/inexistente, ruta protegida → redirige, cerrar sesión |
| `10-admin-tutor-errors` | Errores del alta de tutor (vacíos, email, teléfono, cédula duplicada) |
| `11-admin-tutor-actions` | Editar, reenviar correo, desactivar, reactivar y eliminar un tutor |
| `12-superadmin-actions-errors` | Cédula duplicada + ciclo desactivar/reactivar/eliminar admin |
| `13-register-duplicate` | Registro con correo ya existente → error |
| `14-tutor-input-errors` | Nota > 20 y minutos > 360 → avisos |
| `15-delete-blocked` | Eliminar tutor con cursos → bloqueado, y funciona tras quitarlos |
| `16-forum` | Tutor crea un foro y comenta |
| `17-change-password` | Estudiante cambia su contraseña y la nueva funciona |
| `18-admin-edit-course` | Admin edita un curso |
| `19-superadmin-reassign-gate` | Eliminar admin con tutores exige reasignación (se cancela) |
| `20-reactivate-errors` | Reactivar por cédula inexistente → error (tutor y admin) |
| `21-tutor-edit-meeting` | Tutor edita su enlace de reunión (y lo restaura) |
| `22-reactivate-already-active` | Reactivar un usuario ya activo → error |
| `23-student-view` | Estudiante ve calificaciones, foro y reunión (solo lectura) |
| `24-superadmin-reassign-complete` | Eliminar admin reasignando sus tutores (gated — ver abajo) |

### `24` requiere preparar un escenario

Ese test está desactivado por defecto. Para habilitarlo hay que crear en la BD un
admin con un tutor y un admin destino (script `create-reassign-scenario.js`) y correr con:

```bash
E2E_REASSIGN=1 E2E_SUPERADMIN_EMAIL=... E2E_SUPERADMIN_PASSWORD=... npm run test:e2e
```

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
