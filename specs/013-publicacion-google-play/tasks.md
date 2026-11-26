# Tareas 013 — Publicación en Google Play (móvil)

- **Dueños:** MO-B y el **administrador de la cuenta** (marcado «admin») · **Estado:** EN CURSO, **PENDIENTE DE CIERRE AL FINAL** (decisión del 2026-11-19: se sigue con la 014 mientras Google revisa la 1.0; hechas T004, T006 y T008; faltan T001, T002, T003, T005, T007, T009, T010 y T011; ver `docs/play/seguimiento.md`) · `[P]` = paralelizable
- Las tareas «admin» no las hace un agente: son trámites en Play Console. Se listan para no olvidarlas y se registran en `memoria.md`.

- [x] **T001** Perfiles de EAS (APK `preview` y AAB `production`) y versión
  - Archivos: `eas.json`, `app.config.ts`
  - Agente: `dev-expo` · Depende de: 002-T025, backend 013-T001 (esta tarea crea `eas.json`)
  - Aceptación: perfil `preview` genera **APK** (staging) que se instala y abre en un teléfono real; perfil `production` genera **AAB**; `autoIncrement`; `EXPO_PUBLIC_API_URL` de producción; `version: 0.1.0`; `targetSdkVersion` según el mínimo vigente de Google Play *(se verifica en la documentación de Play y de Expo antes de fijarlo)*; sin secretos
  - Refs: RF-01, RF-02 · P-01, P-03
  - Nota 2026-11-25: se generaron AAB `production` (1.0.0 (4), 1.1.0 (5), 1.1.1 (6) y (7)) y APK `preview`, y `autoIncrement` subió el `versionCode` solo (4 → 7); Play aceptó el AAB 1.1.1. **Cerrada 2026-11-25:** la persona confirmó que la app instalada abre en un teléfono real (captura de pantalla del detalle de un objeto en su teléfono; no se guarda en el repositorio por contener datos personales). La URL de la API era staging **sin puerto**; corregida a `…azure.com:8443` el 2026-11-25 (staging es el servidor que se usa en producción, según la persona responsable). `version` ya no es `0.1.0`: es **1.1.2** (D-226 y D-227).

- [x] **T002** [P] Cuenta de desarrollador de Google Play (**admin**)
  - Archivos: `docs/play/seguimiento.md` (registro de fechas)
  - Agente: — (manual) · Depende de: — · **ya comprada**; falta confirmar la verificación de identidad y teléfono
  - Aceptación: pago único hecho; identidad y teléfono verificados; app «Vaivén» creada (idioma es-MX, gratuita, app); fecha de creación de la cuenta anotada (define si aplica la prueba cerrada)
  - Refs: RF-07 · CA-01
  - Marcada 2026-11-25 según la persona responsable (consta como «Hecha» en `docs/play/seguimiento.md`); no se comprobó en Play Console desde el repositorio.

- [x] **T003** [P] Reunir testers (**admin**)
  - Archivos: `docs/play/testers.md` (instrucciones y mensaje de invitación; la lista de correos **no** va en git)
  - Agente: `spec-writer` (redacta instrucciones) · Depende de: — · **Fecha: antes del primer AAB**
  - Aceptación: ≥ 15 personas con cuenta de Google que aceptaron participar hasta ~el 30 de nov; instrucciones paso a paso (aceptar invitación, instalar, no salirse del programa, abrir la app al menos una vez por semana y enviar comentarios); lista guardada fuera del repositorio
  - Refs: RF-07 · CA-02
  - Marcada 2026-11-25: la persona informa de más de 20 testers; la lista de correo «Vaiven Testers» de Play Console muestra **26 usuarios** (captura vista en la sesión; la lista de correos no va en git). Cumple el mínimo de 15 de la spec.

- [x] **T004** [P] Textos de la ficha
  - Archivos: `docs/play/ficha.md`
  - Agente: `spec-writer` · Depende de: landing L002-T003 (contenido), L001-T010 (URL de privacidad)
  - Aceptación: nombre, descripción breve ≤ 80 y completa ≤ 4000, notas de versión del primer AAB, categoría, correo, sitio web; todo coherente con la landing y con las specs; sin promesas no cumplidas (pagos, seguros)
  - Refs: RF-04

- [x] **T005** [P] Recursos gráficos de la ficha
  - Archivos: `assets/store/icon-512.png`, `assets/store/feature-1024x500.png`, `assets/store/screenshots/*.png`
  - Agente: `dev-expo` (ícono y gráfico) / **persona** (capturas reales) · Depende de: 012-T005, una versión instalable (T008)
  - Aceptación: ícono 512×512; gráfico 1024×500; ≥ 4 capturas del teléfono sin datos personales; una versión provisional alcanza para empezar y se reemplaza antes de producción · Ícono actual provisional; dirección y recursos según spec §7
  - Refs: RF-03
  - Marcada 2026-11-26 según la persona responsable y sus capturas de la ficha en Google Play (vídeo y al menos 5 capturas de teléfono publicadas: inicio de sesión, entrega y devolución, detalle de objeto y solicitud), con datos ficticios. Ícono y gráfico están en `assets/store/`. **Observaciones:** las copias de las capturas no están en `assets/store/screenshots/` (la carpeta está vacía) y son de una versión anterior; la spec permite una versión provisional que se reemplaza antes de producción, por lo que conviene actualizarlas con Explorar («Recomendado para ti») y la sugerencia de la IA.

- [x] **T006** [P] Documento de cumplimiento
  - Archivos: `docs/play/cumplimiento.md`
  - Agente: `spec-writer` · Depende de: landing L001-T005
  - Aceptación: respuestas listas para copiar: seguridad de datos (dato → recopilado/compartido → finalidad → opcional/obligatorio → cifrado en tránsito → borrado), clasificación de contenido, público 18+, anuncios no, permisos con justificación, URL de eliminación de cuenta, declaración de contenido de usuarios (reportes y filtro), acceso de revisión con cuenta de prueba; coincide con el aviso de privacidad (CA-04)
  - Refs: RF-05, RF-06, RF-11 · P-06, P-07

- [x] **T007** Completar ficha y declaraciones en Play Console (**admin**)
  - Archivos: `docs/play/seguimiento.md` (registro)
  - Agente: — (manual) · Depende de: T004, T005, T006
  - Aceptación: ficha, seguridad de datos, clasificación, público, anuncios y acceso a la app completos sin advertencias; cuenta de revisión creada (P-05)
  - Refs: RF-05, RF-06
  - Marcada 2026-11-25: la ficha y las declaraciones permitieron publicar la prueba cerrada (envíos 3 y 4, capturas en `docs/evidencia/013/`) y Play aceptó el AAB 1.1.1. Según la persona responsable; falta declarar en «Seguridad de datos» la IA y las recomendaciones antes de producción (ver `seguimiento.md`).

- [x] **T008** Primer AAB a la prueba cerrada (**~9 nov**, ver calendario vigente del ROADMAP)
  - Archivos: `docs/play/seguimiento.md`, `memoria.md` (solo anexar)
  - Agente: — (manual con `eas build -p android --profile production`; sube el **admin**) · Depende de: T001, T007, 003-T012
  - Aceptación: AAB instalable aprobado en la pista cerrada; testers invitados y con enlace de aceptación; **día 1 de 14 anotado** (fecha real; si la cuenta o el AAB se retrasan, se anota la fecha real); versión y fecha en `memoria.md`
  - Refs: RF-07 · CA-02, CA-03

- [x] **T009** Actualizaciones por hito y seguimiento diario (**hasta el día 14**)
  - Archivos: `docs/play/seguimiento.md` (tabla diaria: testers inscritos, versión, incidencias), `memoria.md` (solo anexar)
  - Agente: — (MO-B compila; admin sube) · Depende de: T008 y cada hito (H1 7 nov, H2 10 nov, H3 13 nov, H4 17 nov, H5 22 nov)
  - Aceptación: cada hito sube una versión con notas; **diario**: el número de testers inscritos sigue ≥ 12 (si baja, se reponen el mismo día); comentarios de testers recopilados
  - Refs: RF-07, RF-08 · CA-02, CA-03
  - Cerrada por indicación de la persona responsable (2026-11-26), que informa que está completada y probada. En `seguimiento.md` constan 12 testers aceptados el 18 nov y 26 en la lista el 26 nov; el día 14 de la prueba cerrada cae ≈ 29 nov y no se comprobó en Play Console desde el repositorio.

- [ ] **T010** Solicitud de producción y publicación (**23 nov en adelante**)
  - Archivos: `docs/play/solicitud-produccion.md`, `docs/play/lanzamiento.md`, `app.config.ts` (`version: 1.0.0`)
  - Agente: `spec-writer` (respuestas) + **admin** (envío y publicación) · Depende de: T009, 012-T011, backend 013-T009
  - Aceptación: solicitud enviada **el 23 de nov** (día 14 cumplido el 22) con respuestas basadas en la evidencia real; publicación en producción cuando Google apruebe (estimada 30 nov–7 dic); ficha pública abierta e instalada en un teléfono real (CA-06); plan de reversión escrito (pausar despliegue, corregir, subir versión nueva); **se avisa a la landing** (L002-T010) con la URL pública
  - Refs: RF-09, RF-10 · CA-05, CA-06
  - Nota 2026-11-25: la versión que irá a producción es la **1.1.2** (reconstrucción con la API en `:8443`), no la `1.0.0` que dice esta tarea; ajustar la solicitud (`solicitud-produccion.md`) y las declaraciones de datos en consecuencia.

- [ ] **T011** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T010
  - Aceptación: **CONFORME**; hito H6 marcado; lecciones de la publicación anotadas
  - Refs: DoD

| Total | 11 tareas |
|---|---|
