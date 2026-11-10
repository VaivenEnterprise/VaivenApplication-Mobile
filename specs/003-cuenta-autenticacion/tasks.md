# Tareas 003 — Cuenta, autenticación y navegación (móvil)

- **Dueño:** MO-A · **Estado:** sin ejecutar · `[P]` = paralelizable
- **Prioridad:** T001–T009 son el camino crítico del equipo móvil; terminarlas el 7 nov.

- [ ] **T001** Instalar formularios y esquemas
  - Archivos: `package.json`, `package-lock.json`
  - Agente: `dev-expo` · Depende de: 002-T024
  - Aceptación: `react-hook-form` y `@hookform/resolvers` instalados; nada más
  - Refs: Art. II.4

- [ ] **T002** [P] Componentes `FormField`, `TextField`, `PasswordField`, `Checkbox`, `EmptyState` y `SlotPlaceholder`
  - Archivos: `src/components/{FormField,TextField,PasswordField,Checkbox,EmptyState,SlotPlaceholder}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: 002-T015
  - Aceptación: usan tokens; etiqueta y error accesibles (`accessibilityLabel`); `TextField` con `IconBadge` inicial y los estados de spec §7.5 (reposo, foco, error, deshabilitado); `PasswordField` con ojo y etiqueta «Mostrar/Ocultar contraseña»; `Checkbox` con área ≥ 44 y texto con enlaces; `EmptyState` con título, texto y acción opcional; `SlotPlaceholder` (borde punteado, ícono, título y pista, tonos `slotWarm`/`slotGreen`)
  - Refs: RF-09

- [ ] **T003** [P] Textos y esquemas de autenticación y perfil
  - Archivos: `src/i18n/{auth,profile,tabs,inicio}.ts`, `src/i18n/index.ts` (una línea por archivo), `src/features/auth/schemas.ts`, `src/features/auth/keys.ts`, pruebas de esquemas
  - Agente: `dev-expo` · Depende de: 002-T007
  - Aceptación: validaciones del RF-01 (correo, contraseña ≥ 8, confirmación, `isAdult`, `acceptTerms`); mensajes en español; claves de consulta
  - Refs: RF-01 · P-05, P-06

- [ ] **T004** API de autenticación y perfil
  - Archivos: `src/features/auth/api.ts`, `src/features/profile/api.ts`, `src/features/auth/api.test.ts`
  - Agente: `dev-expo` · Depende de: 002-T011, 003-T001 (backend, contrato)
  - Aceptación: funciones tipadas para las 8 rutas (`/auth/*`, `/me`, `/users/{id}`); logout y refresh envían `{refreshToken}`; errores como `ApiError`; sin tokens en logs
  - Refs: plan §2

- [ ] **T005** Cliente de API con renovación *single-flight*
  - Archivos: `src/lib/api/client.ts` (ampliar), `src/lib/api/authInterceptor.ts`, pruebas
  - Agente: `dev-expo` · Depende de: T004
  - Aceptación: adjunta `Authorization`; ante 401 una sola renovación para varias peticiones y reintento (CA-03); si falla → `onSessionExpired` (CA-04); no reintenta rutas `/auth/*`
  - Refs: RF-03 · P-03

- [ ] **T006** `SessionProvider` y `useSession`
  - Archivos: `src/features/auth/{session.tsx, useSession.ts, session.test.tsx}`
  - Agente: `dev-expo` · Depende de: T004, T005, 002-T009
  - Aceptación: restaura sesión desde `SecureStore`; `signIn`, `signUp`, `signOut` (limpia caché); estados `loading/signedOut/signedIn` (CA-02); access token en memoria · Pantallas de sesión restaurando y suspendida: spec §7.12
  - Refs: RF-02, RF-07 · P-02

- [ ] **T007** Pantallas de registro e inicio de sesión
  - Archivos: `src/features/auth/screens/{LoginScreen,RegisterScreen}.tsx`, `src/components/illustrations/NeighborhoodIllustration.tsx`, `src/app/(auth)/{_layout,login,register}.tsx`, pruebas RNTL
  - Agente: `dev-expo` · Depende de: T002, T003, T006
  - Aceptación: CA-01, CA-05, CA-07, CA-08; reproducen spec §7.1 y §7.2 sin los elementos de §5 «NO se muestran»; errores 409/401/429 mostrados; estados de carga y de campo (§7.5); suspensión (`account_suspended`) con fecha
  - Refs: RF-01, RF-10

- [ ] **T008** Layout raíz, *auth gate* y pestañas
  - Archivos: `src/app/_layout.tsx`, `src/app/(tabs)/_layout.tsx`, `src/components/navigation/TabBar.tsx`, `src/app/(tabs)/{inicio,explorar,mis-objetos,actividad,mensajes,perfil}/{_layout,index}.tsx`, `src/app/{objeto,reserva,chat,usuario,incidencia,proyecto}/[id].tsx`
  - Agente: `dev-expo` · Depende de: T006, T002
  - Aceptación: CA-02, CA-06, CA-10; barra de cinco pestañas con `TabBar` (spec §7.4) y `mensajes` oculta con `href: null`; pantallas marcador con `EmptyState`; rutas fuera de pestañas como marcadores; **ningún otro spec vuelve a editar estos layouts** · Marcadores según spec §7.13
  - Refs: RF-04, RF-05 · Art. XIII.1

- [ ] **T009** Perfil: ver, editar, cerrar sesión y eliminar cuenta
  - Archivos: `src/features/profile/screens/{ProfileScreen,EditProfileScreen}.tsx`, `src/features/profile/hooks.ts`, `src/app/(tabs)/perfil/{index,editar}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T008
  - Aceptación: muestra nombre y datos; edita nombre/teléfono; cerrar sesión; eliminar cuenta con confirmación (RF-08); *slots* `renderExtraRows` (011: «Notificaciones») y `renderReputation` (010) en el perfil · Diseño de Perfil, Editar y Eliminar cuenta: spec §7.8 a §7.10
  - Refs: RF-06…RF-08

- [ ] **T010** Pantalla de perfil público `usuario/[id]`
  - Archivos: `src/features/profile/screens/PublicProfileScreen.tsx`, `src/app/usuario/[id].tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T008
  - Aceptación: nombre y antigüedad desde `GET /users/{id}`; reputación y acciones de reporte se agregan en 010 y 011 sin tocar este archivo (reciben *slots* de componentes) · Diseño: spec §7.11
  - Refs: RF-06

- [ ] **T011** Prueba de integración del flujo de sesión
  - Archivos: `src/features/auth/session.integration.test.tsx`
  - Agente: `qa-mobile` · Depende de: T007, T009
  - Aceptación: registro → pestañas → cerrar sesión → inicio; refresco concurrente; cobertura ≥ 80 % de `features/auth`
  - Refs: CA-01…CA-06 · RNF-02

- [ ] **T012** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T011, T014
  - Aceptación: **CONFORME**; hito H1 (móvil) marcado; se avisa al equipo que las pestañas están listas
  - Refs: DoD

- [ ] **T013** Verificación en Expo Go contra staging
  - Archivos: `memoria.md` (solo anexar), `docs/evidencia/003/` (capturas)
  - Agente: `probador-expo` · Depende de: T012 (y todas las anteriores `[x]`) y backend 003-T014 **desplegada**
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; con `EXPO_PUBLIC_API_URL` de staging y `EXPO_UNSTABLE_MCP_SERVER=1`, la app abre en Expo Go y se recorren los criterios de aceptación (CA-xx) de esta spec, con capturas tomadas por el MCP `expo`; lo que Expo Go no permita probar (p. ej. push remoto en Android) se anota en `memoria.md` como no verificable. **La spec siguiente no empieza hasta que esta tarea pase.** · **MCP de Expo opcional (decisión 9 nov):** se verifica a mano o con Claude en Expo Go contra el **backend local**; el staging queda para cuando exista
  - Refs: Art. XIV.4

- [ ] **T014** Inicio funcional y botón de mensajes
  - Archivos: `src/features/home/{api.ts,schemas.ts,hooks.ts}`, `src/features/home/screens/HomeScreen.tsx`, `src/features/home/components/HomeItemTile.tsx`, `src/components/navigation/MessagesButton.tsx`, `src/app/(tabs)/inicio/{_layout,index}.tsx`, pruebas
  - Agente: `dev-expo` · Depende de: T002, T004, T008, 006-T011 (`PopularProjects`), 002-T030 (primera parte: `Skeleton`, `Avatar`, `Banner`)
  - Aceptación: CA-09, CA-10, CA-12; reproduce spec §7.3; `GET /items?limit=6` y `GET /me` con TanStack Query y el cliente de 002 (sin duplicarlo); estados cargando/vacío/error por sección y pull-to-refresh; saludo inmediato desde la sesión; toques a `proyecto/[id]` y `objeto/[id]` (marcadores); `MessagesButton` con *prop* `badgeCount`; el asistente ✦ no se muestra; pruebas con doble de red: éxito, lista vacía, error 500 solo en su sección y 401 con renovación única
  - Refs: RF-12 · P-08, P-09

| Total | 14 tareas |
|---|---|
