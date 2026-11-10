// Catálogo de proyectos empaquetado en la app (spec 006 §6 y plan P-07): textos de los
// cuatro proyectos iniciales. Los pasos de cada proyecto los agrega la spec 007.

export const projectsEs = {
  label: 'Proyecto',
  toolsOne: '1 herramienta',
  toolsMany: 'herramientas',
  minutes: 'min',
  difficulty: { easy: 'Fácil', medium: 'Media' },
  items: {
    'colgar-un-cuadro': {
      title: 'Colgar un cuadro',
      tools: { taladro: 'Taladro', nivel: 'Nivel', 'cinta-metrica': 'Cinta métrica' },
    },
    'armar-un-mueble': {
      title: 'Armar un mueble',
      tools: {
        desarmador: 'Desarmador',
        'martillo-goma': 'Martillo de goma',
        nivel: 'Nivel',
      },
    },
    'podar-el-jardin': {
      title: 'Podar el jardín',
      tools: {
        'tijeras-podar': 'Tijeras de podar',
        podadora: 'Podadora',
        escalera: 'Escalera',
      },
    },
    'repisa-flotante': {
      title: 'Colocar una repisa flotante',
      tools: {
        taladro: 'Taladro',
        nivel: 'Nivel',
        'cinta-metrica': 'Cinta métrica',
        desarmador: 'Desarmador',
      },
    },
  },
} as const;
