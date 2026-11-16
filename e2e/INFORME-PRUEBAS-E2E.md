# Informe de Pruebas de Extremo a Extremo (E2E) — Proyecto Tutorías

> Documento base para el capítulo de pruebas. Resume la estrategia, la cobertura,
> los defectos encontrados y su corrección, y los resultados obtenidos.

---

## 1. Objetivo y alcance

Validar, sobre la **aplicación desplegada en producción** (frontend en Vercel +
backend en Render + PostgreSQL), que cada funcionalidad del sistema se comporta
correctamente de principio a fin, ejercitando **cada acción de los cuatro roles**
(estudiante, tutor, administrador y super administrador) tanto en sus **caminos
felices** como en sus **casos de error**.

A diferencia de las pruebas unitarias (que verifican piezas aisladas), las pruebas
E2E ejercitan el flujo completo *interfaz → API → base de datos → interfaz*, tal
como lo vive un usuario real. Son las que mejor detectan fallos de integración.

## 2. Metodología

Se siguió el modelo de la **pirámide de pruebas**: una base amplia de pruebas
unitarias/de integración (rápidas y baratas) y, en la cúspide, un conjunto acotado
pero representativo de pruebas E2E que cubren los recorridos críticos. Este informe
corresponde a la **capa E2E**.

Herramienta: **Playwright** (Microsoft), que automatiza un navegador real
(Chromium) e interactúa con la aplicación por su árbol de accesibilidad
(roles y etiquetas), lo que produce pruebas robustas y legibles.

## 3. Herramientas y configuración

| Aspecto | Decisión |
|---|---|
| Framework | Playwright (`@playwright/test`) sobre Chromium |
| Objetivo | App desplegada (`https://programa-tutorias.vercel.app`) |
| Ejecución | En serie (`workers: 1`) para no chocar al escribir en la BD real |
| Reintentos | `retries: 1` |
| Tiempos | test 90 s · aserciones 20 s · navegación 60 s · acción 20 s |
| Evidencia | traza, captura y video **solo en fallo** |
| Arranque en frío | `global-setup` "despierta" el backend de Render antes de correr, para que ninguna prueba se cuelgue por el *cold start* del plan gratuito |

Se ejecuta con:

```bash
E2E_SUPERADMIN_EMAIL=superadmin@tutorias.com \
E2E_SUPERADMIN_PASSWORD=password123 \
npm run test:e2e
```

## 4. Matriz de cobertura

**24 archivos de prueba · 35 casos en la corrida estándar (100 % en verde).**

### 4.1 Caminos felices (acciones)

| Rol | Acciones probadas |
|---|---|
| **Autenticación** | Inicio de sesión, cierre de sesión |
| **Estudiante** | Registro · inicio de sesión · inscripción a un curso · cambio de contraseña · consulta de calificaciones, foro y reunión |
| **Tutor** | Registro de calificaciones a todos los estudiantes · creación de reportes · foro (crear tema y comentar) · edición del enlace de reunión |
| **Administrador** | Alta de tutor · edición · reenvío de correo · desactivación · reactivación · eliminación · alta/edición/eliminación de cursos |
| **Super Administrador** | Alta de administrador · desactivación · reactivación · eliminación · eliminación con reasignación de tutores |

### 4.2 Casos de error (validaciones y bloqueos)

| Escenario provocado | Resultado esperado y verificado |
|---|---|
| Login con contraseña incorrecta / correo inexistente | Muestra error, permanece en login |
| Acceso a ruta protegida sin sesión | Redirige a login |
| Registro: cédula ≠ 10 dígitos / contraseñas distintas / correo ya existente | Mensaje de validación, no se crea |
| Alta de tutor: campos vacíos / email inválido / teléfono corto / **cédula duplicada** | Mensaje específico, no se crea |
| Alta de admin: **cédula duplicada** | Mensaje de error |
| Cupo de curso fuera de 5–40 | Rechazado |
| Calificación > 20 · minutos de reporte > 360 | Aviso de rango |
| **Eliminar tutor con cursos asociados** | Bloqueado; solo se elimina tras quitar los cursos |
| **Eliminar admin con tutores** | Exige reasignarlos a otro administrador |
| Reactivar por cédula inexistente / usuario ya activo | Mensaje de error |

## 5. Defectos encontrados y corregidos

El mayor valor de esta fase fue **descubrir dos defectos reales de producción** que
estaban ocultos. En ambos se aplicó el ciclo **prueba → diagnóstico → corrección →
verificación automática**.

### Defecto 1 — Falla al eliminar un tutor

- **Síntoma:** al eliminar definitivamente un tutor, el servidor respondía con
  `org.hibernate.TransientPropertyValueException`. Como todo tutor tiene un reporte
  general, **ningún tutor podía eliminarse**.
- **Causa:** la entidad `Tutor` cargaba su `GeneralReport` por una relación
  `@OneToOne`, y los borrados masivos posteriores dejaban esa entidad "colgada" en
  el contexto de persistencia, provocando el error al confirmar la transacción.
- **Corrección (backend):** limpiar el contexto de persistencia
  (`entityManager.clear()`) tras validar y antes de los borrados. *(commit `780ba25`)*
- **Verificación:** la misma prueba que lo destapó volvió a ejecutarse **en verde**.

### Defecto 2 — Los comentarios del foro se guardaban vacíos

- **Síntoma:** al comentar en un foro, el comentario se creaba pero **sin texto**.
- **Causa:** el frontend enviaba el campo `text` mientras que el DTO del backend
  esperaba `comment`; el backend ignoraba `text` y guardaba el comentario en blanco.
- **Corrección (frontend):** enviar el campo `comment`. *(commit `8016b68`)*
- **Verificación:** tras desplegar el fix, la prueba del foro pasó **en verde**.

## 6. Resultados

- **35 / 35** casos en verde en una única ejecución (≈ 2,6 min).
- **2 defectos** reales encontrados, corregidos, desplegados y re-verificados.
- **0 residuos** en la base de datos tras las corridas (integridad de los datos de
  demostración preservada).

```
Running 32 tests using 1 worker
  ... (01 a 21) ...
  32 passed (2.6m)
```
*(más `22` y `23` con credenciales de super admin, y `24` con escenario preparado)*

## 7. Buenas prácticas aplicadas

- **Datos únicos por corrida** (cédulas, teléfonos y correos), evitando colisiones.
- **Correos `@example.com`** (dominio reservado que nunca entrega) para no enviar
  correos reales durante las pruebas.
- **Autolimpieza:** las pruebas que crean datos los **eliminan por la propia
  interfaz**; lo que no tiene borrado por UI se limpia por base con marcadores.
- **Aislamiento del arranque en frío** mediante *warm-up* previo.
- **Verificación cruzada en base de datos** en los flujos críticos (p. ej., se
  comprobó que, al eliminar un admin, sus tutores quedaban reasignados al destino).

## 8. Limitaciones

- La **eliminación de foros/comentarios** no se prueba por E2E porque, si bien el
  backend expone los endpoints, **la interfaz no ofrece esa acción**.
- El flujo de **eliminación de admin con reasignación completa** es destructivo, por
  lo que su prueba se mantiene *deshabilitada por defecto* y se ejecuta solo sobre un
  escenario preparado, para no afectar los datos reales.

## 9. Conclusiones

La suite E2E cubre de forma exhaustiva los recorridos funcionales de los cuatro
roles y sus casos de error, y demostró su utilidad de la manera más concreta
posible: **detectó dos defectos reales que la aplicación tenía ocultos**, los cuales
fueron corregidos y verificados automáticamente. El conjunto queda versionado en el
repositorio y puede reejecutarse en cualquier momento, constituyendo una red de
seguridad frente a futuras regresiones.
