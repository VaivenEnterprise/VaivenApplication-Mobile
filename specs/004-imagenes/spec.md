# Spec 004 — Imágenes (móvil)

- **Dueño:** MO-B · **Prioridad:** P0 · **Ventana:** 31 oct–2 nov · **Depende de:** 001, 002 (móvil) y contrato 004 (backend)
- **Constitución:** v1.2.0 · **Estado:** Borrador

## 1. Objetivo y por qué
Un único mecanismo para **elegir, reducir, subir y mostrar** fotos: lo usan las fotos de objetos, la foto de perfil y la evidencia de entrega/devolución e incidencias.

## 2. Historias
| # | Prio. | Historia |
|---|---|---|
| H-01 | P0 | Como propietario, quiero tomar o elegir fotos de mi objeto, para publicarlo. |
| H-02 | P0 | Como persona usuaria, quiero ver las fotos con rapidez y sin gastar muchos datos. |
| H-03 | P1 | Como participante, quiero adjuntar fotos de evidencia, para dejar constancia del estado del objeto. |

## 3. Requisitos
| ID | Requisito |
|---|---|
| RF-01 | `PhotoPicker`: permite hasta *N* fotos (configurable), con opciones «Tomar foto» y «Elegir de la galería», vista previa, quitar y reordenar (mover al inicio). |
| RF-02 | Antes de subir, cada imagen se redimensiona a ≤ 1600 px de lado mayor y se comprime a JPEG calidad ≈ 0.8 (`expo-image-manipulator`). |
| RF-03 | `useImageUpload(purpose)`: pide firma a `POST /uploads/signature` (`purpose`: `item_photo` o `evidence`), sube directo a Cloudinary con `FormData` y devuelve `ImageRef { publicId, width, height, format, bytes }`; con progreso por imagen y reintento. |
| RF-04 | Las subidas fallidas se pueden reintentar sin volver a elegir la imagen; se cancelan al salir de la pantalla. |
| RF-05 | `RemoteImage`: muestra imágenes con las URL `url`/`thumbUrl` que entrega la API (o la URL firmada de evidencia) usando `expo-image` (caché en disco, *placeholder* y estado de error). La evidencia usa la URL firmada que entrega la API y **no** se guarda en caché persistente. |
| RF-06 | Permisos de cámara y galería: se piden al usarse, con mensaje en español si se niegan y acceso directo a Ajustes. |
| RF-07 | La app **nunca** contiene el *API secret*; solo usa los datos de la firma (uploadUrl, apiKey, timestamp, signature, publicId, type). |
| RNF-01 | Una foto típica sube en < 5 s con buena conexión; el peso final ≤ 500 KB. |
| RNF-02 | Cobertura ≥ 80 % de utilidades y hook (con dobles de red). |

## 4. Criterios de aceptación
| ID | Dado / Cuando / Entonces |
|---|---|
| CA-01 | Dada una foto de 4000×3000, entonces se sube con lado mayor 1600 px. |
| CA-02 | Dada una subida fallida, cuando reintento, entonces no se vuelve a pedir la foto. |
| CA-03 | Dado un permiso negado, entonces veo el mensaje y el botón a Ajustes. |
| CA-04 | Dado un objeto con `thumbUrl`, entonces `RemoteImage` muestra la miniatura desde el CDN. |
| CA-05 | Dados 6 intentos con límite de 5, entonces el selector bloquea el sexto. |

## 5. Fuera de alcance
Foto de perfil (avatar), edición/recorte avanzado, video, galería a pantalla completa con zoom (opcional P2).

## 6. Preguntas abiertas
- [NEEDS CLARIFICATION: ¿máximo de fotos por objeto? Provisional: 6.]
