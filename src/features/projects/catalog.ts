import type { IconName } from '@/components/ui/AppIcon';
import { es } from '@/i18n/es-MX';

// Catálogo de proyectos empaquetado (spec 006 §6, plan P-07). Cambiarlo a backend después solo
// sustituye el origen de `PROJECTS`; las pantallas no cambian.

export type ProjectId = keyof typeof es.projects.items;
export type ProjectTone = 'warm' | 'green';
export type ProjectDifficulty = keyof typeof es.projects.difficulty;

export type Project = {
  readonly id: ProjectId;
  readonly icon: IconName;
  readonly tone: ProjectTone;
  /** Palabras clave ya normalizadas (minúsculas, sin acentos): ver `normalizeText`. */
  readonly keywords: readonly string[];
  readonly minutes: number;
  readonly difficulty: ProjectDifficulty;
  /** Identificadores de herramienta; su nombre está en `es.projects.items[id].tools`. */
  readonly toolIds: readonly string[];
};

export const PROJECTS: readonly Project[] = [
  {
    id: 'colgar-un-cuadro',
    icon: 'image',
    tone: 'warm',
    keywords: ['colgar', 'colgando', 'cuadro', 'cuadros', 'marco', 'espejo', 'pared'],
    minutes: 30,
    difficulty: 'easy',
    toolIds: ['taladro', 'nivel', 'cinta-metrica'],
  },
  {
    id: 'armar-un-mueble',
    icon: 'hammer',
    tone: 'green',
    keywords: [
      'armar',
      'armando',
      'mueble',
      'muebles',
      'ensamblar',
      'ensamble',
      'escritorio',
      'librero',
    ],
    minutes: 90,
    difficulty: 'medium',
    toolIds: ['desarmador', 'martillo-goma', 'nivel'],
  },
  {
    id: 'podar-el-jardin',
    icon: 'leaf',
    tone: 'green',
    keywords: [
      'podar',
      'poda',
      'jardin',
      'jardineria',
      'cesped',
      'pasto',
      'arbusto',
      'arbustos',
      'setos',
    ],
    minutes: 120,
    difficulty: 'medium',
    toolIds: ['tijeras-podar', 'podadora', 'escalera'],
  },
  {
    id: 'repisa-flotante',
    icon: 'construct',
    tone: 'warm',
    keywords: ['repisa', 'repisas', 'flotante', 'flotantes', 'estante', 'estantes', 'anaquel'],
    minutes: 60,
    difficulty: 'medium',
    toolIds: ['taladro', 'nivel', 'cinta-metrica', 'desarmador'],
  },
];

export function getProject(id: string): Project | undefined {
  return PROJECTS.find((project) => project.id === id);
}

export function projectTitle(project: Project): string {
  return es.projects.items[project.id].title;
}

/** Cuántas herramientas pide el proyecto, con el plural correcto («1 herramienta», «3 herramientas»). */
export function toolsLabel(project: Project): string {
  const count = project.toolIds.length;
  return count === 1 ? es.projects.toolsOne : `${count} ${es.projects.toolsMany}`;
}
