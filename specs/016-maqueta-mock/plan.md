# Plan 016 — Maqueta navegable con datos simulados

- **Spec:** `spec.md` · **Dueño:** prototipo (temporal)
- **Constitución:** v1.2.1

## 1. Enfoque

Crear el proyecto Expo desde cero y construir un prototipo aislado en `src/app/prototipo/`. La concha oficial de la spec 003 no se toca: la raíz solo redirige al prototipo. Los datos viven en `src/mocks/` y las pantallas consumen hooks de `src/features/`.

## 2. Estructura

```
src/app/
  _layout.tsx                         # QueryClientProvider + AuthProvider + Stack
  index.tsx                           # Redirect a /prototipo
  prototipo/
    _layout.tsx                       # Stack del prototipo
    (auth)/{login,register}.tsx
    (tabs)/{_layout,index,explorar,cuenta}.tsx
    asistente.tsx
    herramienta/[id].tsx
src/features/
  auth/{AuthProvider.tsx,useAuth.ts,mockAuthRequest.ts}
  projects/{hooks.ts,components/{ProjectCard,KitItem,WorkCard}.tsx}
  tools/{hooks.ts,components/{ToolCard,ProjectToolRow,NeighborMap}.tsx}
  requests/{hooks.ts,components/RequestCard.tsx}
  chat/components/{MessageBubble,AssistantFab}.tsx
src/lib/domain/models.ts
src/mocks/{tools,projects,requests,users,works,index}.ts
src/components/ui/{Screen,AppText,Button,Card,Badge,Avatar,EmptyState,LoadingState,ErrorState,TextField,Checkbox,TextLink,ToolIcon}.tsx
src/theme/{tokens.ts,index.ts}
src/i18n/es-MX.ts
src/utils/schemas.ts                  # esquemas de Login/Registro del prototipo
src/__tests__/{prototipo,auth-schemas}.test.*
```

## 3. Datos simulados

- `tools.ts`: Taladro percutor/Carlos/3 cuadras/Disponible; Nivel de burbuja/Ana/1 cuadra/Disponible; Juego de brocas/Luis/4 cuadras/Prestada.
- `projects.ts`: Colgar un cuadro (Nivel, Taladro, Brocas); Armar un mueble (Atornillador, Martillo); Podar el jardín (Tijeras, Podadora).
- `requests.ts`: M... por Taladro percutor/Hoy 5:00 PM/Pendiente; David por Nivel de burbuja/Aceptada.
- `users.ts`: Mariana.
- `works.ts`: dos trabajos realizados por Mariana para la sección “Mis trabajos realizados”.
- Las solicitudes usan `toolName`; no se vinculan por id.
- Los proyectos usan `toolId` opcional solo para las tres herramientas existentes.
- El detalle recibe un id de proyecto o de herramienta; si es herramienta, resuelve el primer proyecto que la requiere.

## 4. Rutas

| Ruta | Archivo | Contenido |
|---|---|---|
| `/` | `src/app/index.tsx` | Redirect a `/prototipo` |
| `/prototipo` | `(tabs)/index.tsx` | Inicio |
| `/prototipo/explorar` | `(tabs)/explorar.tsx` | Herramientas |
| `/prototipo/asistente` | `asistente.tsx` | Chat simulado, abierto desde el FAB |
| `/prototipo/cuenta` | `(tabs)/cuenta.tsx` | Mi Perfil: Entrar/Mariana + Solicitudes |
| `/prototipo/login` | `(auth)/login.tsx` | Login simulado con campos y Compartir |
| `/prototipo/register` | `(auth)/register.tsx` | Registro simulado con términos |
| `/prototipo/herramienta/[id]` | `herramienta/[id].tsx` | Detalle de proyecto/herramientas, mapa y solicitudes |

## 5. Decisiones

| # | Decisión | Motivo |
|---|---|---|
| P-01 | Prototipo bajo `/prototipo` | Evita conflictos con la concha oficial de 003 |
| P-02 | Auth en memoria con `AuthProvider` | Sin backend ni almacenamiento |
| P-03 | “Entrar” autentica como Mariana | Sesión de demostración |
| P-04 | Solicitudes en Mi Perfil y en el detalle del proyecto | Indicación del maquetado |
| P-05 | “Kit sugerido para tu proyecto” como sección del Inicio autenticado | Indicación del maquetado |
| P-06 | Mocks tipados y validados en pruebas | Integridad de datos |
| P-07 | Tokens de la spec 002 + terracota/naranja y tamaños | Consistencia visual provisional |
| P-08 | Sin librería de mapas; mapa simulado con pines numerados | Evitar dependencias nuevas |
| P-09 | Barra inferior de 3 tabs; Asistente como pantalla apilada desde FAB | Indicación del maquetado |
| P-10 | Login/registro con `useState` y componentes `TextField`/`Checkbox` | Sin autenticación real; no agregar dependencias |
| P-11 | Detalle resuelve proyecto por id de proyecto o de herramienta | Mantener la ruta `/herramienta/[id]` del maquetado |
| P-12 | “Pedir” cambia a “Solicitada” en memoria | Demostrar interacción sin backend |
| P-13 | Login/Registro con `react-hook-form` + `zodResolver` y esquemas en `src/utils/schemas.ts` | Desacoplar reglas de la UI; ruta solicitada explícitamente por el responsable del prototipo |
| P-14 | `mode: 'onBlur'`, `reValidateMode: 'onChange'` | Evitar errores antes de interactuar y revalidar mientras se corrige |
| P-15 | Envío simulado con `mockAuthRequest` y `Button loading` | Probar el estado de carga y bloquear dobles envíos sin backend |
| P-16 | Los esquemas se consolidarán en `features/auth/schemas.ts` al implementar la spec 003 | Mantener la frontera de feature en la app definitiva |

## 6. Pruebas

- Integridad de mocks: ids únicos, estados válidos y `toolId` existentes.
- Auth: invitado → Mariana → invitado.
- Solicitudes: aceptar/rechazar cambia el estado.
- Render de Inicio invitado/autenticado, Explorar, Asistente, Mi Perfil, Login, Registro y detalle de proyecto.
- Acciones: aceptar/rechazar solicitudes y cambiar “Pedir” a “Solicitada”.
- Esquemas: correo sanitizado, contraseña fuerte, teléfono de 10 dígitos, nombre solo letras/espacios y términos en `true`.
- Formularios: errores visibles sin navegar, envío válido con estado de carga y limpieza de entradas.
- `npm run typecheck`, `npm run lint` y `npm test`.

## 7. Verificación de constitución

| Art. | Cumple | Cómo |
|---|---|---|
| I | Sí | Spec, plan y tareas antes del código |
| II | Sí | Sin API real; datos simulados aislados |
| III | Sí | TypeScript estricto, sin `any` |
| V | Sí | Textos en i18n y distancias en cuadras |
| VI | Sí | Pantallas delgadas y features separadas |
| VII | Sí | Tokens y componentes UI reutilizables |
| IX | Sí | Typecheck, lint y pruebas |
| X | Sí | Solo dependencias justificadas; `@react-native/jest-preset` es peer de `jest-expo` y `expo-asset` es peer de `expo-font`/iconos |
