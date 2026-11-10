import { fireEvent, render, screen } from '@testing-library/react-native';
import { PROJECTS, getProject, projectTitle, toolsLabel } from '@/features/projects/catalog';
import { PopularProjects, ProjectCard, matchProjects, normalizeText } from '@/features/projects';
import { es } from '@/i18n/es-MX';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn(), replace: jest.fn() }),
}));

beforeEach(() => mockPush.mockReset());

describe('catálogo', () => {
  it('trae los cuatro proyectos iniciales con identificadores únicos', () => {
    expect(PROJECTS.map((project) => project.id)).toEqual([
      'colgar-un-cuadro',
      'armar-un-mueble',
      'podar-el-jardin',
      'repisa-flotante',
    ]);
  });

  it.each(PROJECTS.map((project) => [project.id, project] as const))(
    '%s: textos presentes y palabras clave normalizadas',
    (_id, project) => {
      expect(projectTitle(project).trim()).not.toBe('');
      expect(project.keywords.length).toBeGreaterThan(0);
      for (const keyword of project.keywords) expect(keyword).toBe(normalizeText(keyword));
      const tools = es.projects.items[project.id].tools as Record<string, string>;
      for (const toolId of project.toolIds) expect(tools[toolId]?.trim()).toBeTruthy();
    },
  );

  it('ninguna palabra clave se repite entre proyectos', () => {
    const all = PROJECTS.flatMap((project) => project.keywords);
    expect(new Set(all).size).toBe(all.length);
  });

  it('getProject encuentra por id y devuelve undefined si no existe', () => {
    expect(getProject('podar-el-jardin')?.icon).toBe('leaf');
    expect(getProject('nada')).toBeUndefined();
  });

  it('toolsLabel usa singular y plural', () => {
    const one = { ...PROJECTS[0]!, toolIds: ['taladro'] };
    expect(toolsLabel(one)).toBe('1 herramienta');
    expect(toolsLabel(PROJECTS[0]!)).toBe('3 herramientas');
  });
});

describe('matchProjects (CA-07)', () => {
  it.each([
    ['necesito colgar un cuadro', ['colgar-un-cuadro']],
    ['NECESITO COLGAR UN CUADRO', ['colgar-un-cuadro']],
    ['  ¡Quiero colgar un espejo!  ', ['colgar-un-cuadro']],
    ['cuadros', ['colgar-un-cuadro']],
    ['quiero podar el jardín', ['podar-el-jardin']],
    ['PODAR EL JARDIN', ['podar-el-jardin']],
    ['armar un mueble de ikea', ['armar-un-mueble']],
    ['una repisa flotante', ['repisa-flotante']],
    ['colgar una repisa', ['colgar-un-cuadro', 'repisa-flotante']],
  ])('«%s» → %j', (text, expected) => {
    expect(matchProjects(text).map((project) => project.id)).toEqual(expected);
  });

  it.each(['xyz', '', '   ', '¿?!', 'taladro', 'un el de la'])(
    '«%s» no coincide con nada',
    (text) => {
      expect(matchProjects(text)).toEqual([]);
    },
  );

  it('devuelve como máximo dos proyectos', () => {
    expect(matchProjects('colgar armar podar repisa').length).toBeLessThanOrEqual(2);
  });

  it('ordena por parecido: el que más palabras comparte va primero', () => {
    const ids = matchProjects('repisa flotante para colgar').map((project) => project.id);
    expect(ids[0]).toBe('repisa-flotante');
  });
});

describe('normalizeText', () => {
  it('quita acentos, signos y mayúsculas', () => {
    expect(normalizeText('  ¡Jardín, PODA! ')).toBe('jardin poda');
  });
});

describe('ProjectCard', () => {
  const project = PROJECTS[0]!;

  it.each(['hero', 'compact', 'wide'] as const)(
    'variante %s: título, herramientas y toque',
    async (variant) => {
      const onPress = jest.fn();
      await render(<ProjectCard project={project} variant={variant} onPress={onPress} />);
      const card = screen.getByRole('button', { name: 'Colgar un cuadro. 3 herramientas' });
      await fireEvent.press(card);
      expect(onPress).toHaveBeenCalledWith(project);
    },
  );

  it('la variante wide muestra la etiqueta «Proyecto» y «3 herramientas ›»', async () => {
    await render(<ProjectCard project={project} variant="wide" onPress={jest.fn()} />);
    expect(screen.getByText(es.projects.label)).toBeTruthy();
    expect(screen.getByText('3 herramientas ›')).toBeTruthy();
  });

  it('por defecto es compact y, como en la referencia, solo muestra el título (sin etiqueta)', async () => {
    await render(<ProjectCard project={project} onPress={jest.fn()} />);
    expect(screen.getByText('Colgar un cuadro')).toBeTruthy();
    expect(screen.queryByText('3 herramientas')).toBeNull();
  });

  it('solo la variante hero muestra la etiqueta de herramientas', async () => {
    await render(<ProjectCard project={project} variant="hero" onPress={jest.fn()} />);
    expect(screen.getByText('3 herramientas')).toBeTruthy();
  });
});

describe('PopularProjects', () => {
  it('muestra una tarjeta grande y dos pequeñas', async () => {
    await render(<PopularProjects />);
    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('button', { name: /Colgar un cuadro/ })).toBeTruthy();
  });

  it('al tocar abre proyecto/[id]', async () => {
    await render(<PopularProjects />);
    await fireEvent.press(screen.getByRole('button', { name: /Armar un mueble/ }));
    expect(mockPush).toHaveBeenCalledWith('/proyecto/armar-un-mueble');
  });

  it('acepta un manejador propio', async () => {
    const onSelect = jest.fn();
    await render(<PopularProjects onSelect={onSelect} />);
    await fireEvent.press(screen.getByRole('button', { name: /Podar el jardín/ }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'podar-el-jardin' }));
    expect(mockPush).not.toHaveBeenCalled();
  });
});
