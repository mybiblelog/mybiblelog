---
dateModified: "2026-11-20"
seo:
  title: "Usa un agente de IA con My Bible Log: guía de la API"
  description: "Conecta un agente de IA o tu propio script a la API abierta de My Bible Log para registrar tu lectura bíblica, tomar notas y organizar etiquetas, con referencias como JHN.3.16."
og:
  title: "Usa un agente de IA con My Bible Log: guía de la API"
  description: "Conecta un agente de IA o tu propio script a la API abierta de My Bible Log para registrar tu lectura bíblica, tomar notas y organizar etiquetas, con referencias como JHN.3.16."
---

# Usa un agente de IA con My Bible Log

Todo lo que puedes hacer en My Bible Log está disponible a través de su API abierta. Eso significa que un agente de IA, o un script que un agente te ayude a escribir, puede registrar tu lectura, tomar notas y gestionar etiquetas por ti.

Esta página reúne los pocos datos que un agente necesita para empezar. Dale esta página y la referencia de la API que aparece abajo.

## Referencia de la API

* **Especificación OpenAPI (JSON):** [mybiblelog.com/api/openapi.json](https://www.mybiblelog.com/api/openapi.json)
* **URL base:** `https://www.mybiblelog.com/api`

La mayoría de los agentes pueden leer la especificación OpenAPI directamente y aprender de ella todos los endpoints.

## Los pasajes usan referencias conocidas

Los pasajes se escriben como referencias cortas en el formato que usan YouVersion y Bible.com, así que un agente nunca tiene que trabajar con los números de versículo internos de My Bible Log:

| Pasaje | Referencia |
| --- | --- |
| Génesis | `GEN` |
| Salmo 23 | `PSA.23` |
| Génesis 1-3 | `GEN.1-3` |
| Juan 3:16-18 | `JHN.3.16-18` |
| Génesis 1:1 - 2:3 | `GEN.1.1-2.3` |

Un pasaje no sale de un mismo libro. Los números de capítulo y versículo siguen las Biblias en inglés como la NASB, por lo que Malaquías tiene 4 capítulos.

Las respuestas incluyen la misma referencia en un campo `passage`, junto a los números de versículo internos.

## Iniciar sesión

Cada solicitud necesita un token de sesión, enviado como encabezado:

```
Authorization: Bearer <token>
```

Obtén un token iniciando sesión con tu correo electrónico y contraseña:

```bash
curl -X POST https://www.mybiblelog.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "you@example.com", "password": "your-password"}'
```

El token está en `data.token` dentro de la respuesta y dura 30 días.

* **¿Te registraste con Google?** Crea primero una contraseña en **Configuración → Cambiar correo electrónico**.
* **No compartas tu contraseña.** Inicia sesión tú mismo y dale al agente solo el token.
* **Trata el token como una contraseña.** Tiene acceso total a tu cuenta, incluso para eliminarla.
* **Para revocar un token,** usa **Cerrar todas las sesiones** en Configuración, o cambia tu contraseña.

## Tareas comunes

| Tarea | Solicitud | Cuerpo |
| --- | --- | --- |
| Registrar una lectura | `POST /log-entries` | `{"date": "2026-11-11", "passage": "JHN.3"}` |
| Ver tu lectura | `GET /log-entries` | |
| Crear una nota | `POST /passage-notes` | `{"content": "…", "passages": ["JHN.3.16-18"], "tags": ["<tag id>"]}` |
| Buscar notas de un pasaje | `GET /passage-notes?filterPassage=JHN.3` | |
| Crear una etiqueta | `POST /passage-note-tags` | `{"label": "Oración", "color": "#3a7bd5"}` |
| Ver tus etiquetas | `GET /passage-note-tags` | |
| Leer tu configuración | `GET /settings` | |

Las fechas se escriben como `YYYY-MM-DD`, en tu propia zona horaria. Por ejemplo, para registrar Juan 3 como leído hoy:

```bash
curl -X POST https://www.mybiblelog.com/api/log-entries \
  -H "Authorization: Bearer $MBL_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"date": "2026-11-11", "passage": "JHN.3"}'
```

## Consejos para agentes

* **Los errores de validación son específicos.** Una respuesta `400` indica cada campo que falló y por qué, así que un agente puede corregir su solicitud y volver a intentarlo.
* **Haz una copia de seguridad antes de cambios masivos.** Descarga tus datos en **Configuración → Exportar** antes de dejar que un agente edite o elimine muchos elementos a la vez.
* **El inicio de sesión tiene un límite de frecuencia.** Reutiliza un mismo token en lugar de iniciar sesión en cada solicitud.
