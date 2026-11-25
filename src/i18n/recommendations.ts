// Textos de «Recomendado para ti» y del borrado del historial (spec 015 §7). Segunda persona,
// breves (Art. V). El motivo llega del servidor como código; aquí se arma el texto en es-MX.

export const recommendationsEs = {
  title: 'Recomendado para ti',
  rowLoading: 'Cargando recomendaciones',
  reason: {
    // «Porque viste: Taladro Bosch»; sin título, la variante genérica.
    similarTo: 'Porque viste:',
    similarToGeneric: 'Parecido a lo que viste',
    popularInCategory: 'Popular en una categoría que viste',
    popularNearby: 'Popular cerca de ti',
    popular: 'Popular en Vaivén',
  },
  free: 'Gratis',
  perDay: '/ día',
  clear: {
    row: 'Borrar historial de recomendaciones',
    title: '¿Borrar tu historial?',
    body: 'Dejaremos de recomendarte por lo que viste.',
    confirm: 'Borrar',
    cancel: 'Cancelar',
    success: 'Historial borrado',
    error: 'No pudimos borrar tu historial. Intenta de nuevo.',
  },
} as const;
