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
      steps: [
        {
          title: 'Marca el lugar',
          text: 'Decide la altura con la cinta métrica y haz una marca suave en la pared.',
          tip: 'Un buen punto de partida: el centro del cuadro a 1.45 m del piso.',
        },
        {
          title: 'Perfora y coloca los taquetes',
          text: 'Con el taladro, haz el hoyo en la marca y pon el taquete.',
          tip: 'Usa cinta sobre la pared para que el polvo no ensucie.',
        },
        {
          title: 'Cuelga y nivela',
          text: 'Pon el cuadro y revisa con el nivel que quede derecho.',
          tip: 'Si el cuadro es pesado, usa dos puntos de apoyo.',
        },
      ],
      tools: { taladro: 'Taladro', nivel: 'Nivel', 'cinta-metrica': 'Cinta métrica' },
    },
    'armar-un-mueble': {
      title: 'Armar un mueble',
      steps: [
        {
          title: 'Revisa las piezas',
          text: 'Ordena las piezas y los tornillos antes de empezar.',
          tip: 'Compara con la lista del manual para no quedarte sin nada.',
        },
        {
          title: 'Arma la estructura',
          text: 'Une los laterales con el desarmador, sin apretar del todo.',
          tip: 'Aprieta al final, cuando todo esté alineado.',
        },
        {
          title: 'Ajusta y nivela',
          text: 'Golpea suave con el martillo de goma y revisa con el nivel.',
          tip: 'Apoya el mueble en su lugar final antes de nivelar.',
        },
      ],
      tools: {
        desarmador: 'Desarmador',
        'martillo-goma': 'Martillo de goma',
        nivel: 'Nivel',
      },
    },
    'podar-el-jardin': {
      title: 'Podar el jardín',
      steps: [
        {
          title: 'Prepara el área',
          text: 'Retira objetos del suelo y revisa que no haya cables.',
          tip: 'Usa guantes y calzado cerrado.',
        },
        {
          title: 'Poda lo alto',
          text: 'Con la escalera firme, corta las ramas altas con las tijeras.',
          tip: 'Corta en diagonal para que el agua escurra.',
        },
        {
          title: 'Corta el pasto',
          text: 'Pasa la podadora en líneas rectas y recoge los restos.',
          tip: 'Evita podar con el pasto mojado.',
        },
      ],
      tools: {
        'tijeras-podar': 'Tijeras de podar',
        podadora: 'Podadora',
        escalera: 'Escalera',
      },
    },
    'repisa-flotante': {
      title: 'Colocar una repisa flotante',
      steps: [
        {
          title: 'Mide y marca',
          text: 'Marca la altura y la longitud de la repisa en la pared.',
          tip: 'Revisa con el nivel antes de perforar.',
        },
        {
          title: 'Perfora y fija',
          text: 'Haz los hoyos con el taladro y coloca los soportes.',
          tip: 'Elige tornillos largos para sostener peso.',
        },
        {
          title: 'Monta y revisa',
          text: 'Desliza la repisa en los soportes y ajusta con el desarmador.',
          tip: 'Prueba con un objeto ligero antes de cargarla.',
        },
      ],
      tools: {
        taladro: 'Taladro',
        nivel: 'Nivel',
        'cinta-metrica': 'Cinta métrica',
        desarmador: 'Desarmador',
      },
    },
  },
} as const;
