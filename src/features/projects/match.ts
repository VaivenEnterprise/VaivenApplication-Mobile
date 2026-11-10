import { PROJECTS, type Project } from '@/features/projects/catalog';
import { es } from '@/i18n/es-MX';

// Búsqueda por problema (spec 006 RF-09, plan P-08): función pura, sin red ni IA.

const MAX_MATCHES = 2;
const MIN_PREFIX = 4;

/** Minúsculas, sin acentos ni signos; solo letras y números separados por un espacio. */
export function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function wordsOf(text: string): string[] {
  const normalized = normalizeText(text);
  return normalized === '' ? [] : normalized.split(' ');
}

/** Dos palabras coinciden si son iguales o una es el comienzo de la otra (plurales, «colgando»). */
function matches(word: string, keyword: string): boolean {
  if (word === keyword) return true;
  if (word.length >= MIN_PREFIX && keyword.startsWith(word)) return true;
  return keyword.length >= MIN_PREFIX && word.startsWith(keyword);
}

function scoreOf(project: Project, words: readonly string[]): number {
  const titleWords = wordsOf(es.projects.items[project.id].title);
  let score = 0;
  for (const word of words) {
    if (project.keywords.some((keyword) => matches(word, keyword))) score += 2;
    else if (
      titleWords.some((titleWord) => titleWord.length >= MIN_PREFIX && matches(word, titleWord))
    ) {
      score += 1;
    }
  }
  return score;
}

/** Hasta 2 proyectos con al menos una coincidencia, del más al menos parecido. */
export function matchProjects(text: string): Project[] {
  const words = wordsOf(text);
  if (words.length === 0) return [];
  return PROJECTS.map((project, order) => ({ project, order, score: scoreOf(project, words) }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || a.order - b.order)
    .slice(0, MAX_MATCHES)
    .map((entry) => entry.project);
}
