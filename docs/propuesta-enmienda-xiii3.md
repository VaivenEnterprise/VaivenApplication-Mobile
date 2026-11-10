# Propuesta de enmienda — Art. XIII.3 (PATCH)

- **Fecha:** 2026-11-09 · **Tipo:** PATCH (aclara redacción, no cambia ni elimina un principio)
- **Estado:** propuesta, pendiente de aprobación humana. No se modificó `constitution.md`.

## Motivo
El diseño aprobado de Stitch agrega la pestaña **Inicio** y deja a **Mensajes** fuera de la barra (se abre desde el encabezado de Inicio). El Art. XIII.3 enumera las pestañas y hoy no coincide.

## Texto actual
> **Concha de navegación:** `src/app/_layout.tsx` y `src/app/(tabs)/_layout.tsx` los crea la spec 003 con todas las pestañas definidas (Explorar, Mis objetos, Actividad, Mensajes, Perfil). Las demás specs solo agregan archivos dentro de su propia carpeta de ruta.

## Texto propuesto
> **Concha de navegación:** `src/app/_layout.tsx` y `src/app/(tabs)/_layout.tsx` los crea la spec 003 con todas las pestañas definidas: la barra muestra Inicio, Explorar, Mis objetos, Actividad y Perfil, y Mensajes existe como ruta de pestaña oculta de la barra. Las demás specs solo agregan archivos dentro de su propia carpeta de ruta.

## Efecto
Ninguno en rutas ni en propiedad de archivos: `(tabs)/mensajes/index.tsx` sigue siendo de la spec 008. Al aprobarse: subir la versión a 1.2.2 y registrar en `memoria.md`.
