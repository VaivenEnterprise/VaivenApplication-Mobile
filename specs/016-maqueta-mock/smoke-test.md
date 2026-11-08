# Smoke test — Prototipo 016

Verificación manual del prototipo navegable con mocks. No requiere backend ni red.

## Preparación

```powershell
cd "C:\Users\Chio Jimenez\Desktop\VaivenApplication-Mobile"
npx expo start
```

- Android: presiona `a`.
- Dispositivo físico: escanea el QR con Expo Go en la misma red.
- Para reiniciar el estado: presiona `r` en Metro o recarga Expo Go.

## 1. Arranque

- [ ] Abre `/`; debe redirigir a `/prototipo`.
- [ ] Como invitado ves “VAIVÉN”, “¿Qué quieres hacer hoy?”, el botón “Entrar” y las tres tarjetas grandes de proyectos.
- [ ] La barra inferior muestra solo Inicio, Explorar y Mi Perfil.
- [ ] No hay pestaña de Asistente.

## 2. Inicio invitado y autenticado

- [ ] Toca “Colgar un cuadro”: abre el detalle del proyecto.
- [ ] Toca “Entrar”: cambia a “Hola, Mariana”, muestra “Roma Norte”, el avatar y el botón naranja del asistente.
- [ ] En autenticado, toca una tarjeta de proyecto: cambia la selección.
- [ ] “Kit sugerido para tu proyecto” muestra Nivel, Taladro y Brocas con íconos y el botón verde “Ver cómo conseguirlo”.
- [ ] Selecciona “Armar un mueble”: el kit muestra Atornillador y Martillo.
- [ ] Selecciona “Podar el jardín”: el kit muestra Tijeras y Podadora.
- [ ] “Mis trabajos realizados” muestra “Colgar un cuadro” y “Armar un mueble”.
- [ ] El FAB naranja abre el Asistente y “Volver” regresa a Inicio.

## 3. Login y registro

- [ ] Desde Mi Perfil invitado, “Inicia sesión” abre Login con logo VAIVÉN, “Compartir”, “Bienvenido de vuelta”, correo, contraseña, “Iniciar sesión ->”, “Explorar la app” y footer “¿No tienes cuenta? Crea una”.
- [ ] El correo muestra el placeholder `vecino@comunidad.es`.
- [ ] El ojo de la contraseña alterna entre mostrar y ocultar.
- [ ] Los errores no aparecen antes de tocar un campo o enviar el formulario.
- [ ] “Iniciar sesión ->” con campos vacíos muestra errores bajo correo y contraseña; no navega.
- [ ] Correo inválido, contraseña corta o sin mayúscula/número/especial muestran su mensaje específico.
- [ ] Con correo válido y contraseña `Segura1!`, el botón muestra spinner, se deshabilita y entra como Mariana.
- [ ] “Explorar la app” abre Inicio sin iniciar sesión.
- [ ] “Crea una” abre Registro con badge “Comunidad segura”, banner “Confianza de barrio”, nombre, correo, teléfono, contraseña, términos y “Crear cuenta ->”.
- [ ] “Crear cuenta ->” con campos vacíos muestra errores de nombre, correo, teléfono, contraseña y términos; no navega.
- [ ] Nombre con números, teléfono de 9 dígitos y contraseña débil muestran sus errores específicos.
- [ ] Con nombre `Mariana López`, correo válido, teléfono `5512345678`, contraseña `Segura1!` y términos aceptados, el botón muestra spinner y entra como Mariana.
- [ ] TalkBack/VoiceOver lee el mensaje al enfocar un campo con error.
- [ ] El ojo de la contraseña alterna entre mostrar y ocultar.

## 4. Explorar

- [ ] Ves Taladro percutor / De Carlos / 3 cuadras / Disponible.
- [ ] Ves Nivel de burbuja / De Ana / 1 cuadra / Disponible.
- [ ] Ves Juego de brocas / De Luis / 4 cuadras / Prestada.
- [ ] El filtro “Herramientas” muestra las 3.
- [ ] “Jardín” y “Cocina” muestran “No hay herramientas en esta categoría.”.
- [ ] “Todo” restaura la lista completa.
- [ ] Toca “Juego de brocas”: el detalle resuelve el proyecto y muestra “Prestada”.

## 5. Detalle de proyecto

- [ ] Desde Inicio abre “Colgar un cuadro”: ves “Detalle del proyecto” y la lista Nivel, Taladro y Brocas con dueño y cuadras.
- [ ] Taladro y Nivel tienen “Pedir”; Brocas muestra “Prestada”.
- [ ] Toca “Pedir” en una herramienta disponible: cambia a “Solicitada”.
- [ ] “Vecinos cerca” muestra un mapa simulado con pines numerados para las herramientas con vecino.
- [ ] “Solicitudes” muestra M.../Taladro percutor/Pendiente y David/Nivel de burbuja/Aceptada.
- [ ] “Aceptar” o “Rechazar” actualiza la solicitud pendiente y desaparecen sus botones.
- [ ] “Volver” regresa a la pantalla anterior o a Explorar.

## 6. Asistente

- [ ] Ves el mensaje inicial y las sugerencias de “Prueba con”.
- [ ] Toca una sugerencia: aparece tu mensaje y la respuesta simulada.
- [ ] Escribe y envía: mismo resultado; con el campo vacío, “Enviar” está deshabilitado.
- [ ] “Volver” regresa a Inicio o a la pantalla anterior.

## 7. Mi Perfil y sesión

- [ ] Invitado: ves “Entra a VAIVÉN”, “Entrar”, “Crea tu cuenta” e “Inicia sesión”.
- [ ] Solicitud de “M...” por Taladro percutor: Hoy 5:00 PM, Pendiente, con Aceptar/Rechazar.
- [ ] Solicitud de David por Nivel de burbuja: Ayer 6:30 PM, Aceptada, sin botones.
- [ ] Con sesión: ves el perfil de Mariana, su correo y “Salir”.
- [ ] “Salir” vuelve al estado invitado y el saludo de Inicio cambia.
- [ ] Recargar la app restaura el estado inicial de auth y solicitudes.

## 8. Cierre

- [ ] Sin pantallas rojas, crashes ni textos cortados.
- [ ] Tabs, FAB e iconos responden.
- [ ] No quedó ninguna pestaña de Asistente en la barra inferior.

## Referencia automática

```powershell
npm run typecheck
npm run lint
npm test
npx expo export --platform android --output-dir .expo-export-check
```

Resultado esperado: typecheck y lint sin errores, 35 pruebas en verde y bundle Android correcto. Elimina `.expo-export-check` después de exportar.
