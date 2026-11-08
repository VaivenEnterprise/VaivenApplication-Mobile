# Tareas 016 — Maqueta navegable con datos simulados

- **Dueño:** prototipo (temporal) · **Estado:** en ejecución
- Una tarea a la vez; al terminar, ejecutar `npm run typecheck && npm run lint && npm test`.

- [x] **T001** Scaffold Expo + TypeScript + Router
  - Archivos: `package.json`, `app.config.ts`, `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `jest.config.js`, `jest.setup.ts`, `babel.config.js`, `src/app/_layout.tsx`
  - Aceptación: Expo Router arranca, alias `@/*`, TypeScript estricto, scripts `typecheck`, `lint`, `format`, `test`
  - Depende de: —

- [x] **T002** Tokens, i18n y componentes UI base
  - Archivos: `src/theme/{tokens.ts,index.ts}`, `src/i18n/es-MX.ts`, `src/components/ui/{Screen,AppText,Button,Card,Badge,Avatar,EmptyState,LoadingState,ErrorState}.tsx`
  - Aceptación: sin colores ni textos visibles literales fuera de tokens/i18n; componentes con estados de carga, error y vacío
  - Depende de: T001

- [x] **T003** Tipos de dominio y mocks
  - Archivos: `src/lib/domain/models.ts`, `src/mocks/{tools,projects,requests,users,index}.ts`, `src/mocks/mocks.test.ts`
  - Aceptación: datos exactos del plan; integridad referencial probada
  - Depende de: T001

- [x] **T004** AuthProvider y useAuth
  - Archivos: `src/features/auth/{AuthProvider.tsx,useAuth.ts}`, `src/features/auth/auth.test.tsx`
  - Aceptación: invitado → Mariana → invitado; sin persistencia
  - Depende de: T002, T003

- [x] **T005** Layout raíz, prototipo y pestañas
  - Archivos: `src/app/_layout.tsx`, `src/app/index.tsx`, `src/app/prototipo/_layout.tsx`, `src/app/prototipo/(tabs)/_layout.tsx`, placeholders de las cuatro pestañas
  - Aceptación: `/` redirige a `/prototipo`; barra inferior con Inicio, Explorar, Asistente, Cuenta
  - Depende de: T002, T004

- [x] **T006** Inicio
  - Archivos: `src/app/prototipo/(tabs)/index.tsx`, `src/features/projects/{hooks.ts,components/ProjectCard.tsx}`
  - Aceptación: saludo según sesión, proyectos populares y sección “Kit para tu proyecto”
  - Depende de: T003, T005

- [x] **T007** Explorar
  - Archivos: `src/app/prototipo/(tabs)/explorar.tsx`, `src/features/tools/{hooks.ts,components/ToolCard.tsx}`
  - Aceptación: Taladro, Nivel y Brocas con dueño, cuadras y estado; chips de categoría
  - Depende de: T003, T005

- [x] **T008** Asistente
  - Archivos: `src/app/prototipo/(tabs)/asistente.tsx`, `src/features/chat/components/MessageBubble.tsx`
  - Aceptación: conversación simulada, entrada de texto y sugerencias rápidas
  - Depende de: T002, T005

- [x] **T009** Cuenta y solicitudes
  - Archivos: `src/app/prototipo/(tabs)/cuenta.tsx`, `src/app/prototipo/(auth)/{login,register}.tsx`, `src/features/requests/{hooks.ts,components/RequestCard.tsx}`
  - Aceptación: Entrar/Salir, solicitudes M.../David, Aceptar/Rechazar actualiza el estado
  - Depende de: T004, T005

- [x] **T010** Detalle de herramienta
  - Archivos: `src/app/prototipo/herramienta/[id].tsx`
  - Aceptación: nombre, dueño, cuadras, estado e imagen; ruta inválida muestra vacío
  - Depende de: T003, T005

- [x] **T011** Cierre de calidad
  - Archivos: `memoria.md` (solo anexar), `specs/016-maqueta-mock/tasks.md`, `specs/016-maqueta-mock/smoke-test.md`, `src/__tests__/prototipo.test.tsx`
  - Aceptación: `npm run typecheck && npm run lint && npm test` en verde; arranque con `npx expo start` y bundle Android verificado
  - Depende de: T001–T010

- [x] **T012** Ajuste visual a las maquetas compartidas
  - Archivos: `specs/016-maqueta-mock/{spec,plan,tasks}.md`, `specs/016-maqueta-mock/smoke-test.md`, `memoria.md` (solo anexar), `src/theme/{tokens,index}.ts`, `src/i18n/es-MX.ts`, `src/components/ui/{Button,TextField,Checkbox,TextLink,ToolIcon,index}.tsx`, `src/lib/domain/models.ts`, `src/mocks/{works,index,mocks.test}.ts`, `src/features/projects/{hooks.ts,components/{ProjectCard,KitItem,WorkCard}.tsx}`, `src/features/tools/components/{ToolCard,ProjectToolRow,NeighborMap}.tsx`, `src/features/chat/components/AssistantFab.tsx`, `src/app/prototipo/(auth)/{login,register}.tsx`, `src/app/prototipo/(tabs)/{_layout,index,cuenta}.tsx`, `src/app/prototipo/asistente.tsx`, `src/app/prototipo/herramienta/[id].tsx`, `src/__tests__/prototipo.test.tsx`
  - Aceptación: login/registro e Inicio invitado/autenticado coinciden con el brief; barra inferior Inicio/Explorar/Mi Perfil; detalle con herramientas, mapa y solicitudes; `typecheck`, `lint` y `npm test` en verde con 20+ pruebas; `npx expo start` sin errores
  - Depende de: T001–T011
  - Nota: T012 reemplaza la barra de cuatro tabs y la ubicación del Asistente descritas en T005/T008. El estado vigente es 3 tabs + FAB.

- [x] **T013** Validación de Login y Registro con react-hook-form + Zod
  - Archivos: `src/utils/schemas.ts`, `src/i18n/es-MX.ts`, `src/components/ui/{TextField,Checkbox}.tsx`, `src/features/auth/mockAuthRequest.ts`, `src/app/prototipo/(auth)/{login,register}.tsx`, `src/__tests__/{prototipo,auth-schemas}.test.*`, `jest.config.js`, `specs/016-maqueta-mock/{spec,plan,tasks,smoke-test}.md`, `memoria.md` (solo anexar)
  - Aceptación: reglas de correo, contraseña, teléfono, nombre y términos; errores accesibles bajo cada campo; `mode: onBlur` con revalidación `onChange`; botón con `ActivityIndicator` y bloqueo durante el envío; entradas sanitizadas; casos válidos e inválidos de Login/Registro probados; `typecheck`, `lint` y `npm test` en verde
  - Depende de: T012
