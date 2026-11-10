# Módulo de imágenes (spec 004)

Un solo mecanismo para **elegir, reducir, subir y mostrar** fotos. Lo usan las fotos de objetos
(spec 005) y la evidencia de entrega, devolución e incidencias (specs 009 y 010).

Importa siempre desde `@/features/images`:

| Export | Para qué |
|---|---|
| `useImageUpload(purpose)` | Cola de subida: reduce cada foto (≤ 1600 px, JPEG 0.8), pide una firma por foto y sube directo a Cloudinary. |
| `PhotoPicker` | Selector con vista previa, quitar, portada, avance y error por foto. Se le pasa lo que devuelve `useImageUpload`. |
| `RemoteImage` | Muestra una imagen de la API (`thumbUrl` o `url`) con *placeholder* y estado de error. |
| Tipos | `ImageRef`, `RemoteImageData`, `Purpose`, `LocalImage`, `UploadItem`… |

## Ejemplo: publicar un objeto (spec 005)

```tsx
import { PhotoPicker, useImageUpload } from '@/features/images';

function PublishPhotos({ onSubmit }: { onSubmit: (photos: { publicId: string }[]) => void }) {
  const uploader = useImageUpload('item_photo');

  return (
    <>
      <PhotoPicker uploader={uploader} max={5} />
      <Button
        label={es.items.publish}
        // Bloquea el envío mientras haya fotos subiendo o con error.
        disabled={uploader.isUploading || uploader.hasErrors || uploader.refs.length === 0}
        onPress={() => onSubmit(uploader.refs)} // `ImageRef[]`: [{ publicId }], la primera es la portada
      />
    </>
  );
}
```

`uploader.refs` es exactamente lo que reciben las rutas del backend (`ImageInput`, máximo 5).

## Ejemplo: evidencia (spec 009)

```tsx
const uploader = useImageUpload('evidence'); // firma `authenticated`: la imagen es privada
<PhotoPicker uploader={uploader} max={5} />
```

Para **ver** la evidencia usa la URL firmada que entrega la API y evita la caché persistente:

```tsx
<RemoteImage image={photo} variant="full" evidence accessibilityLabel={es.handover.photoAlt} />
```

## Ejemplo: mostrar fotos de la API

```tsx
<RemoteImage image={item.photos[0] ?? null} variant="thumb" style={{ width: 96, height: 96 }} />
```

- `variant="thumb"` usa `thumbUrl` (listas); `variant="full"` usa `url` (detalle).
- La app **no** construye URL ni conoce el *cloud name*: usa las que calcula el backend (P-05).
- Las URL `authenticated` caducan a los 10 minutos: si una imagen de evidencia deja de cargar,
  vuelve a pedir el recurso a la API para obtener una URL nueva.

## Reglas

- La app **nunca** contiene el API secret; solo reenvía los datos de la firma (RF-07).
- Una firma por imagen (P-02); el reintento reutiliza la foto ya reducida y pide una firma nueva.
- La cámara pide su permiso al usarse; si se niega, `PhotoPicker` muestra el mensaje y el acceso
  a Ajustes. La galería usa el selector del sistema, que no necesita permiso.
- Textos en `src/i18n/images.ts`; colores y tamaños, solo de `src/theme`.
- Máximo de fotos por recurso: 5 (contrato). Edición de fotos ya publicadas: fuera de esta spec.
