# Tareas 013 — Publicación en Google Play (móvil)

- **Dueños:** MO-B y el **administrador de la cuenta** (marcado «admin») · **Estado:** sin ejecutar · `[P]` = paralelizable
- Las tareas «admin» no las hace un agente: son trámites en Play Console. Se listan para no olvidarlas y se registran en `memoria.md`.

- [ ] **T001** Perfil de producción de EAS y versión
  - Archivos: `eas.json`, `app.config.ts`
  - Agente: `dev-expo` · Depende de: 002-T025, backend 013-T001 (esta tarea crea `eas.json`)
  - Aceptación: perfil `production` genera **AAB**; `autoIncrement`; `EXPO_PUBLIC_API_URL` de producción; `version: 0.1.0`; `targetSdkVersion` según el mínimo vigente de Google Play *(se verifica en la documentación de Play y de Expo antes de fijarlo)*; sin secretos
  - Refs: RF-01, RF-02 · P-01, P-03

- [ ] **T002** [P] Cuenta de desarrollador de Google Play (**admin**)
  - Archivos: `docs/play/seguimiento.md` (registro de fechas)
  - Agente: — (manual) · Depende de: — · **Fecha: 29–30 oct** (compra de la cuenta; iniciar la verificación ese mismo día)
  - Aceptación: pago único hecho; identidad y teléfono verificados; app «Vaivén» creada (idioma es-MX, gratuita, app); fecha de creación de la cuenta anotada (define si aplica la prueba cerrada)
  - Refs: RF-07 · CA-01

- [ ] **T003** [P] Reunir testers (**admin**)
  - Archivos: `docs/play/testers.md` (instrucciones y mensaje de invitación; la lista de correos **no** va en git)
  - Agente: `spec-writer` (redacta instrucciones) · Depende de: — · **Fecha: 29–31 oct**
  - Aceptación: ≥ 15 personas con cuenta de Google que aceptaron participar hasta ~el 25 de nov; instrucciones paso a paso (aceptar invitación, instalar, no salirse del programa, abrir la app al menos una vez por semana y enviar comentarios); lista guardada fuera del repositorio
  - Refs: RF-07 · CA-02

- [ ] **T004** [P] Textos de la ficha
  - Archivos: `docs/play/ficha.md`
  - Agente: `spec-writer` · Depende de: landing L002-T003 (contenido), L001-T009 (URL de privacidad)
  - Aceptación: nombre, descripción breve ≤ 80 y completa ≤ 4000, notas de versión del primer AAB, categoría, correo, sitio web; todo coherente con la landing y con las specs; sin promesas no cumplidas (pagos, seguros)
  - Refs: RF-04

- [ ] **T005** [P] Recursos gráficos de la ficha
  - Archivos: `assets/store/icon-512.png`, `assets/store/feature-1024x500.png`, `assets/store/screenshots/*.png`
  - Agente: `dev-expo` (ícono y gráfico) / **persona** (capturas reales) · Depende de: 012-T005, una versión instalable (T008)
  - Aceptación: ícono 512×512; gráfico 1024×500; ≥ 4 capturas del teléfono sin datos personales; una versión provisional alcanza para empezar y se reemplaza antes de producción
  - Refs: RF-03

- [ ] **T006** [P] Documento de cumplimiento
  - Archivos: `docs/play/cumplimiento.md`
  - Agente: `spec-writer` · Depende de: landing L001-T005
  - Aceptación: respuestas listas para copiar: seguridad de datos (dato → recopilado/compartido → finalidad → opcional/obligatorio → cifrado en tránsito → borrado), clasificación de contenido, público 18+, anuncios no, permisos con justificación, URL de eliminación de cuenta, declaración de contenido de usuarios (reportes y filtro), acceso de revisión con cuenta de prueba; coincide con el aviso de privacidad (CA-04)
  - Refs: RF-05, RF-06, RF-11 · P-06, P-07

- [ ] **T007** Completar ficha y declaraciones en Play Console (**admin**)
  - Archivos: `docs/play/seguimiento.md` (registro)
  - Agente: — (manual) · Depende de: T004, T005, T006
  - Aceptación: ficha, seguridad de datos, clasificación, público, anuncios y acceso a la app completos sin advertencias; cuenta de revisión creada (P-05)
  - Refs: RF-05, RF-06

- [ ] **T008** Primer AAB a la prueba cerrada (**1 nov**)
  - Archivos: `docs/play/seguimiento.md`, `memoria.md` (solo anexar)
  - Agente: — (manual con `eas build -p android --profile production`; sube el **admin**) · Depende de: T001, T007, 003-T012
  - Aceptación: AAB instalable aprobado en la pista cerrada; testers invitados y con enlace de aceptación; **día 1 de 14 anotado** (1 nov; si la cuenta o el AAB se retrasan, se anota la fecha real); versión y fecha en `memoria.md`
  - Refs: RF-07 · CA-02, CA-03

- [ ] **T009** Actualizaciones por hito y seguimiento diario (**2–14 nov**)
  - Archivos: `docs/play/seguimiento.md` (tabla diaria: testers inscritos, versión, incidencias), `memoria.md` (solo anexar)
  - Agente: — (MO-B compila; admin sube) · Depende de: T008 y cada hito (H1 2 nov, H2 5 nov, H3 8 nov, H4 11 nov)
  - Aceptación: cada hito sube una versión con notas; **diario**: el número de testers inscritos sigue ≥ 12 (si baja, se reponen el mismo día); comentarios de testers recopilados
  - Refs: RF-07, RF-08 · CA-02, CA-03

- [ ] **T010** Solicitud de producción y publicación (**15–25 nov**)
  - Archivos: `docs/play/solicitud-produccion.md`, `docs/play/lanzamiento.md`, `app.config.ts` (`version: 1.0.0`)
  - Agente: `spec-writer` (respuestas) + **admin** (envío y publicación) · Depende de: T009, 012-T011, backend 013-T009
  - Aceptación: solicitud enviada **el 15 de nov** (día 14 cumplido el 14) con respuestas basadas en la evidencia real; publicación en producción cuando Google apruebe (meta 20 nov; estimada 22–25 nov); ficha pública abierta e instalada en un teléfono real (CA-06); plan de reversión escrito (pausar despliegue, corregir, subir versión nueva); **se avisa a la landing** (L002-T010) con la URL pública
  - Refs: RF-09, RF-10 · CA-05, CA-06

- [ ] **T011** Memoria y revisión
  - Archivos: `memoria.md` (solo anexar)
  - Agente: `revisor-constitucion` · Depende de: T010
  - Aceptación: **CONFORME**; hito H6 marcado; lecciones de la publicación anotadas
  - Refs: DoD

| Total | 11 tareas |
|---|---|
