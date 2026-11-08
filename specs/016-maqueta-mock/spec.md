# Spec 016 — Maqueta navegable con datos simulados (prototipo)

- **Dueño:** prototipo (temporal) · **Prioridad:** P2 · **Estado:** Aprobado · **Fecha:** 2026-11-06
- **Constitución:** v1.2.1
- **Depende de:** ninguna spec funcional; se apoya en la arquitectura de la spec 002 para tokens, i18n, componentes y rutas.

## 1. Objetivo y por qué

Validar visualmente la navegación y el contenido de VAIVÉN antes de conectar el backend. El prototipo permite recorrer las pantallas del maquetado con datos simulados, probar la sesión invitado/Mariana y aceptar o rechazar solicitudes sin depender de staging.

## 2. Alcance

- Prototipo aislado bajo `/prototipo`; **no reemplaza** la concha oficial de la spec 003.
- Barra inferior con tres pestañas: **Inicio**, **Explorar** y **Mi Perfil**. El **Asistente** se abre con un FAB naranja desde el Inicio autenticado.
- Login y registro simulados con campos, compartir, selector de contraseña y aceptación de términos; sin autenticación real.
- Validación de formularios con `react-hook-form` + `zod` desacoplada de los componentes visuales.
- Inicio invitado con tarjetas grandes de proyectos; Inicio autenticado con ubicación, avatar, kit sugerido, trabajos realizados y FAB del asistente.
- Detalle de proyecto/herramientas con lista de herramientas (`Pedir`/`Prestada`), mapa simulado con pines numerados y solicitudes.
- Datos simulados en `src/mocks/` para proyectos, herramientas, solicitudes, usuarios y trabajos realizados.
- Sesión en memoria: invitado (acción “Entrar”) y Mariana.
- “Solicitudes” vive dentro de **Mi Perfil** y en el detalle del proyecto.
- “Kit sugerido para tu proyecto” es una sección de **Inicio** autenticado.
- Sin llamadas reales a la API, sin persistencia y sin secretos.

## 3. Historias

| # | Historia |
|---|---|
| H-01 | Como persona invitada, quiero ver el inicio y entrar como Mariana para recorrer la app. |
| H-02 | Como Mariana, quiero ver proyectos y el kit sugerido para mi proyecto en Inicio. |
| H-03 | Como Mariana, quiero explorar herramientas con su dueño, distancia y estado. |
| H-04 | Como Mariana, quiero conversar con el asistente para pedir ayuda. |
| H-05 | Como Mariana, quiero revisar mis solicitudes recibidas y aceptarlas o rechazarlas. |
| H-06 | Como visitante, quiero ver un login y registro creíbles, aunque la sesión sea simulada. |
| H-07 | Como Mariana, quiero abrir un proyecto, pedir sus herramientas y ver el mapa de vecinos. |
| H-08 | Como visitante, quiero que el login y el registro me indiquen qué campos corregir antes de enviar. |

## 4. Requisitos

| ID | Requisito |
|---|---|
| RF-01 | La app abre en `/` y redirige a `/prototipo`. |
| RF-02 | La barra inferior muestra Inicio, Explorar y Mi Perfil; el Asistente se abre con un FAB naranja. |
| RF-03 | Inicio saluda según la sesión (“¿Qué quieres hacer hoy?” o “Hola, Mariana”); autenticado muestra ubicación “Roma Norte” y avatar. |
| RF-04 | Inicio invitado muestra las tres tarjetas grandes de proyectos; autenticado muestra proyectos populares, “Kit sugerido para tu proyecto” con íconos y botón verde, y “Mis trabajos realizados”. |
| RF-05 | Explorar lista las herramientas con nombre, dueño, cuadras y estado. |
| RF-06 | Asistente muestra una conversación simulada con entrada de texto y se abre desde el FAB. |
| RF-07 | Mi Perfil muestra “Entrar” si no hay sesión; “Mariana” y “Salir” si la hay. |
| RF-08 | “Entrar” autentica directo como Mariana, sin credenciales. |
| RF-09 | Mi Perfil incluye la sección Solicitudes con M.../Taladro y David/Nivel. |
| RF-10 | Las solicitudes pendientes exponen Aceptar y Rechazar; al actuar cambia su estado. |
| RF-11 | Los textos visibles viven en `src/i18n/es-MX.ts`. |
| RF-12 | Los colores, espaciados y tamaños viven en `src/theme/tokens.ts`. |
| RF-13 | TypeScript estricto, sin `any` ni `@ts-ignore`. |
| RF-14 | Login: logo VAIVÉN, botón Compartir, título “Bienvenido de vuelta”, correo/contraseña, CTA terracota, “Explorar la app” verde y footer “¿No tienes cuenta? Crea una”. |
| RF-15 | Registro: badge “Comunidad segura”, banner “Confianza de barrio”, nombre/correo/teléfono/contraseña con ver-ocultar, términos y CTA terracota. |
| RF-16 | Detalle de proyecto: herramientas con “Pedir” o “Prestada”, mapa simulado con pines numerados y solicitudes con Aceptar/Rechazar/Aceptada. |
| RF-17 | Login y registro usan `react-hook-form` + `zod` con reglas desacopladas: correo válido sin espacios y en minúsculas, contraseña ≥ 8 con mayúscula/número/especial, teléfono de 10 dígitos, nombre ≥ 3 solo letras/espacios y términos estrictamente en `true`. |
| RF-18 | Los errores aparecen después de interactuar con el campo o al enviar, se muestran en rojo bajo cada control, el botón se bloquea con indicador de carga durante el envío y los valores se envían sanitizados al mock. |

## 5. Criterios de aceptación

| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Al abrir la app, se llega a la pestaña Inicio del prototipo. |
| CA-02 | Como invitado, “Entrar” cambia la sesión a Mariana sin pedir contraseña. |
| CA-03 | Como Mariana, “Salir” vuelve al estado invitado. |
| CA-04 | Inicio invitado muestra los tres proyectos en tarjetas grandes; autenticado muestra kit sugerido con íconos y botón verde. |
| CA-05 | Explorar muestra Taladro, Nivel y Brocas con sus estados. |
| CA-06 | Mi Perfil muestra las dos solicitudes y sus estados. |
| CA-07 | Aceptar una solicitud pendiente la marca como “Aceptada”. |
| CA-08 | Rechazar una solicitud pendiente la marca como “Rechazada”. |
| CA-09 | `npm run typecheck`, `npm run lint` y `npm test` pasan. |
| CA-10 | Login muestra logo, Compartir, correo, contraseña, “Iniciar sesión ->”, “Explorar la app” y footer de registro. |
| CA-11 | Registro muestra badge, banner, cuatro campos, ver/ocultar contraseña, términos y “Crear cuenta ->”. |
| CA-12 | Detalle muestra herramientas con Pedir/Prestada, mapa con pines y solicitudes con sus acciones. |
| CA-13 | Al enviar Login o Registro con datos inválidos, el formulario muestra los errores de cada campo y no navega. |
| CA-14 | Al enviar datos válidos, el botón muestra carga y se deshabilita; al terminar, la sesión simulada entra y navega a Inicio. |

## 6. Fuera de alcance

Backend real, persistencia, autenticación con contraseña o tokens, mapas reales, notificaciones, pagos, chat con IA real, publicación y pruebas en tiendas.

## 7. Preguntas abiertas

- Sin preguntas abiertas para este ajuste: los textos y elementos provienen del brief de maquetas compartido el 2026-11-07.
