# Nivel de seguridad de la app y excepción formal (spec 021, T016)

- **Hallazgo:** A-5 de la auditoría del 2026-11-26: «sin controles de nivel fintech (pinning, root, ofuscación, Play Integrity, biometría)».
- **Requisitos:** RF-14 (protección de sesión) y RF-15 (ofuscación y excepción formal) de `specs/021-remediacion-auditoria/spec.md`.
- **Estado:** excepción **aprobada** por la persona responsable de la spec el 2026-11-27 (registro D-246 en `memoria.md`). **`constitution.md` no se modifica.**

## 1. Qué sí se implementó

| Control | Cómo | Evidencia |
|---|---|---|
| Ofuscación y minificación (R8) | `expo-build-properties` con `enableMinifyInReleaseBuilds` y `enableShrinkResourcesInReleaseBuilds` en las compilaciones *release* de Android: el AAB `production` y también el APK `preview` (así el APK de prueba valida lo mismo que va a Play) | `app.config.ts`; reglas S-12o y `src/app.config.test.ts`; `npx expo config --type introspect` muestra `android.enableMinifyInReleaseBuilds=true` y `android.enableShrinkResourcesInReleaseBuilds=true` en `gradle.properties` (2026-11-27) |
| Bloqueo de capturas y grabación en pantallas sensibles | `expo-screen-capture` vía `useSensitiveScreen()` (una etiqueta por pantalla): login, registro, bloqueo, perfil, editar perfil, evidencia y QR de entrega | S-14a en `src/features/auth/sessionProtection.security.test.tsx` |
| Cierre de sesión por inactividad | 15 minutos sin tocar la app, en primer o segundo plano (`INACTIVITY_TIMEOUT_MS`, `src/features/auth/inactivity.ts`); se cierra como «Cerrar sesión» y el login lo explica | S-14b y S-14c |
| Biometría opcional para volver a entrar | `expo-local-authentication`; se activa en Perfil y exige confirmarse. Tras la inactividad, la sesión se **bloquea** (sin token de acceso ni caché en memoria, la app desmontada) y se desbloquea con biometría, que vuelve a validar la sesión con el servidor | S-14d y S-14e; `BiometricUnlockRow.test.tsx` |
| Sin copia de seguridad automática | `android.allowBackup: false` | S-12n; manifiesto efectivo (T012) |

Ya existían, y siguen vigentes: `refreshToken` solo en `expo-secure-store` y token de acceso solo en memoria (S-01, S-03); HTTPS obligatorio fuera de desarrollo (S-07, Art. VIII.5); rotación del token de refresco con detección de reutilización en el servidor; autorización y límites de frecuencia en el backend (Art. II); sin secretos en `EXPO_PUBLIC_*` (S-12d).

## 2. Excepción formal: pinning, detección de root y Play Integrity

### Por qué no se implementan
1. **No hay módulo compatible con Expo Go.** El Art. XIV.1 y XIV.2 fijan que la app se prueba en Expo Go, solo con módulos que funcionen ahí, y que no se usa `expo-dev-client`. El *pinning* de certificados, la detección de root/jailbreak y la API de Play Integrity necesitan código nativo propio que Expo Go no trae. Exigirlos obligaría a pasar a compilaciones de desarrollo, lo que cambia un principio de la constitución.
2. **La app no maneja dinero.** VAIVÉN no ejecuta cobros ni verifica pagos (Art. V.4). Esos controles son habituales en apps financieras porque protegen transacciones en el dispositivo; aquí el valor que protegerían es la cuenta y los datos de préstamo, que ya cubren los controles de la §1 y el backend.

### Riesgo residual (aceptado)
| Control ausente | Amenaza | Probabilidad / impacto | Mitigación existente |
|---|---|---|---|
| *Pinning* de certificados | Intercepción TLS con una CA instalada por la persona o por un MDM malicioso | Baja (requiere control del dispositivo) / medio (sesión y datos de la cuenta) | TLS del sistema; token de acceso de vida corta en memoria; rotación y detección de reutilización del refresco; cierre por inactividad |
| Detección de root/jailbreak | En un dispositivo comprometido se lee la memoria o el almacén del sistema | Baja / medio | `expo-secure-store` (Keystore/Keychain); sin copia de seguridad; nada sensible fuera del almacén seguro (S-12a) |
| Play Integrity | Clientes modificados o automatizados contra la API | Media / bajo-medio | Toda regla de negocio y autorización vive en el backend (Art. II); límites de frecuencia en el servidor; la app no decide nada que el servidor no valide |

### Alcance de la excepción
- Aplica a la app móvil `vaiven-frontend` en todas sus versiones publicadas mientras rija el Art. XIV.2 actual.
- **Se revisa** si la app empieza a procesar pagos o datos financieros, si cambia el Art. XIV (compilaciones de desarrollo) o si una auditoría encuentra abuso real de clientes modificados.

### Qué se haría con una enmienda (Art. XII)
1. Propuesta escrita de enmienda **MAJOR** al Art. XIV para admitir `expo-dev-client` y compilaciones de desarrollo para probar, con su registro en `memoria.md`.
2. *Pinning* con un módulo nativo mantenido, con pines de respaldo y un plan de rotación de certificados antes de que venzan.
3. Detección de root/jailbreak como **señal** que se envía al servidor (no un bloqueo en el cliente, que se evade fácil).
4. Play Integrity: el servidor pide y **verifica** el veredicto en las rutas críticas (login, crear reserva); requiere un proyecto de Google Cloud, credenciales en el backend y su autorización (servicio externo).
5. Pruebas en dispositivo físico de cada control, porque ninguno se puede ver en Expo Go.

## 3. Pendientes de verificación (no ejecutados en esta tarea)
- **Compilación con R8.** La configuración está comprobada con `npx expo config --type introspect`, pero **no se ha compilado** un AAB ni un APK con R8: EAS Build es un servicio externo y se ejecuta con autorización humana (Art. XIV.7). En la siguiente compilación hay que confirmar que el APK `preview` arranca y recorre los flujos principales. Si R8 elimina algo que se necesita, se agregan reglas con `extraProguardRules` en lugar de apagar R8.
- **Archivo de mapeo.** Con R8, los fallos que informe Play Console vienen ofuscados. Hay que subir `mapping.txt` de cada AAB a Play Console (lo hace quien publica; spec 013).
- **Expo Go.** En Expo Go el bloqueo de capturas y la biometría usan los módulos de Expo Go. En iOS, Expo Go no puede usar Face ID con el texto propio de la app (requiere compilación); la huella de Android y el código del dispositivo sí funcionan. La verificación en teléfono es de la fase 6.
