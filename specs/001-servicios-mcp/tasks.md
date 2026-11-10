# Tareas 001 — Servicios y entorno local con MCP de Expo (móvil)

> **Spec opcional (9 nov 2026):** ver nota en `spec.md`. Nada depende de estas tareas; T001 y T004 quedan omitidas.

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Lo único humano (Art. XIV.7):** registrarse en Expo, `opencode mcp auth expo`, instalar Expo Go y aprobar acciones; el resto lo hace `probador-expo` desde OpenCode con el MCP de Expo.
- Esta spec no tiene tarea de verificación en Expo Go: todavía no existe la app (la primera es 002-T029).

- [ ] **T001** Autenticar el MCP de Expo (**la hace una persona**) — **OMITIDA (9 nov): no se usa el MCP**
  - Archivos: `memoria.md` (solo anexar)
  - Agente: — (manual) · Depende de: —
  - Aceptación: `opencode mcp auth expo` completado en el navegador; `opencode mcp list` muestra `expo` conectado (CA-01); `dev-expo` rechaza una herramienta MCP y `probador-expo` la ejecuta (CA-02)
  - Refs: RF-01, RF-05

- [ ] **T002** [P] Cuentas y teléfonos (**la hace una persona**)
  - Archivos: `memoria.md` (solo anexar)
  - Agente: — (manual) · Depende de: —
  - Aceptación: cada persona con cuenta de Expo y Expo Go instalado; al menos 2 teléfonos Android identificados; SDK de Expo elegido (≥ 54) registrado
  - Refs: RF-02, RF-03

- [ ] **T003** `docs/entorno-local.md`
  - Archivos: `docs/entorno-local.md`
  - Agente: `spec-writer` · Depende de: T001
  - Aceptación: pasos de arranque, tabla de URLs por plataforma, `EXPO_UNSTABLE_MCP_SERVER=1` y reconexión, limitaciones de Expo Go; solución a 3 errores comunes
  - Refs: RF-04

- [ ] **T004** Repositorio en GitHub y MCP de GitHub (**persona** + `gestor-repo`) — **OMITIDA (9 nov): el repositorio ya existe**
  - Archivos: `.gitignore`, `memoria.md` (solo anexar)
  - Agente: — (la persona crea el repositorio, protege `main` y crea el token) + `gestor-repo` · Depende de: T001
  - Aceptación: repositorio `vaiven-frontend` creado en GitHub con `main` protegida (PR obligatoria, sin push directo ni force-push); `GITHUB_PERSONAL_ACCESS_TOKEN` (permisos mínimos, limitado a este repositorio) definido como variable del sistema y OpenCode reiniciado; `opencode mcp list` muestra `github` conectado; un agente de desarrollo rechaza una herramienta de GitHub y `gestor-repo` la ejecuta; `.gitignore` excluye `.env`, `*.pem` y claves; `gestor-repo` abre una PR de prueba sin secretos y una persona la revisa y la fusiona
  - Refs: Art. XV

- [ ] **T005** Revisión de conformidad
  - Archivos: ninguno (solo informe)
  - Agente: `revisor-constitucion` · Depende de: T002, T003, T004
  - Aceptación: veredicto **CONFORME**; sin secretos; hito H0 (móvil) marcado
  - Refs: DoD

| Total | 5 tareas |
|---|---|
