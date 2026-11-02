# Tareas 001 — Servicios y entorno local con MCP de Expo (móvil)

- **Dueño:** MO-B · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Lo único humano (Art. XIV.7):** registrarse en Expo, `opencode mcp auth expo`, instalar Expo Go y aprobar acciones; el resto lo hace `probador-expo` desde OpenCode con el MCP de Expo.
- Esta spec no tiene tarea de verificación en Expo Go: todavía no existe la app (la primera es 002-T029).

- [ ] **T001** Autenticar el MCP de Expo (**la hace una persona**)
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

- [ ] **T004** Revisión de conformidad
  - Archivos: ninguno (solo informe)
  - Agente: `revisor-constitucion` · Depende de: T002, T003
  - Aceptación: veredicto **CONFORME**; sin secretos; hito H0 (móvil) marcado
  - Refs: DoD

| Total | 4 tareas |
|---|---|
