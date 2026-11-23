# Lanzamiento en producción y plan de reversión (spec 013, T010)

**Estado: preparado; se ejecuta cuando Google apruebe la solicitud.** El envío y la publicación los hace la persona administradora en Play Console. Aquí no hay claves ni contraseñas.

## Antes de publicar (lista de verificación)

- [ ] **API de producción:** `eas.json` → perfil `production` con `EXPO_PUBLIC_API_URL` del backend de producción (hoy apunta a staging; depende de backend 013-T009). Comprobar `GET /healthz` y `GET /readyz` de esa URL (Art. IX).
- [ ] `app.config.ts` con `version: '1.0.0'` (ya lo tiene) y `versionCode` autoincremental en EAS (`appVersionSource: remote`).
- [ ] `EXPO_PUBLIC_LEGAL_URL` apuntando al sitio de la landing, con los textos legales **ya aprobados** (L001-T011).
- [ ] `npm run typecheck && npm run lint && npm test` en verde en la máquina de quien compila.
- [ ] `node .github/scripts/audit.mjs` sin avisos sin excepción (o con la excepción vigente y justificada).
- [ ] Compilar: `eas build -p android --profile production` y descargar el AAB; peso < 150 MB.
- [ ] Instalar el AAB desde la pista cerrada en un teléfono real y recorrer: inicio de sesión contra producción, buscar, solicitar, chat, enlaces de privacidad y eliminación de cuenta, permisos al usarse.
- [ ] Ficha pública completa: textos de `ficha.md`, ícono, gráfico y **≥ 4 capturas** (`assets/store/screenshots/`).
- [ ] Cuenta de revisión creada en producción (credenciales solo en Play Console).

## Publicación

1. En Producción, crear la versión con el AAB `1.0.0` y las notas de la versión.
2. **Despliegue progresivo** si Play lo permite (P-08): 20 % → 50 % → 100 %, vigilando 24 h entre pasos (fallos y ANR en *Android vitals*, reseñas, correo de soporte).
3. Verificar la **ficha pública** y la instalación desde Google Play en un teléfono real (CA-06).
4. **Avisar a la landing** (L002-T010) con la URL pública de la ficha para reemplazar «Próximamente en Google Play».
5. Anotar versión, fecha y respuesta de Google en `seguimiento.md` y en `memoria.md`.

## Plan de reversión

| Situación | Acción |
|---|---|
| Fallos graves tras el despliegue progresivo (cierres, no inicia sesión, datos incorrectos) | **Pausar el despliegue** en Play Console (la versión queda en el porcentaje alcanzado, sin llegar a más personas) |
| La causa está en el backend | Revertir el backend con el mecanismo de reversión que defina backend 013 (en staging existe `scripts/deploy.sh staging --rollback`), sin tocar la app |
| La causa está en la app | Corregir, subir una versión nueva con `versionCode` mayor y retomar el despliegue. Play no permite bajar de versión: la corrección siempre es una versión nueva |
| Problema de contenido o legal | Retirar la ficha de producción (*Cancelar publicación*) mientras se corrige y avisar a la landing |

Responsables: la persona administradora decide pausar o retirar; MO-B prepara la corrección; BE-B el backend.

## Después de publicar

- Seguimiento diario de la primera semana: reseñas, fallos y soporte (vaivenedeltrabajo@gmail.com).
- Las funciones de la v1.1 (IA, recomendaciones) salen como actualización, con su propia revisión de cumplimiento (spec 014).
