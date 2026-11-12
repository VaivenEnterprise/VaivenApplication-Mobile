import { useQueries } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { coordKey, searchTool, type ToolCoords } from '@/features/project-guide/api';
import { guideKeys } from '@/features/project-guide/keys';
import { DEFAULT_RADIUS_KM, type ToolHit, type ToolRadiusKm } from '@/features/project-guide/types';

const STALE_MS = 60_000;

export type ToolQuery = {
  toolId: string;
  /** Resultado más cercano; `null` si nadie la tiene dentro del radio. */
  hit: ToolHit | null | undefined;
  radiusKm: ToolRadiusKm;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
  retry: () => void;
};

type ToolRef = { toolId: string; name: string };

/**
 * Una consulta por herramienta (RF-13, plan P-09): `GET /items?q&lat&lng&radiusKm&limit=3`. Cada
 * herramienta tiene su propio radio —3 km al inicio, 10 km al ampliar— y su propio estado de
 * carga y de error, así que una que falla no tumba a las demás.
 */
export function useProjectTools(
  tools: readonly ToolRef[],
  coords: ToolCoords | null,
  radii: Readonly<Record<string, ToolRadiusKm>>,
): ToolQuery[] {
  const coordsKey = coordKey(coords);
  const results = useQueries({
    queries: tools.map(({ toolId, name }) => {
      const radiusKm = radii[toolId] ?? DEFAULT_RADIUS_KM;
      return {
        queryKey: guideKeys.tool(name, coordsKey, radiusKm),
        queryFn: ({ signal }: { signal: AbortSignal }) =>
          searchTool(name, coords, radiusKm, signal),
        staleTime: STALE_MS,
      };
    }),
  });
  return tools.map(({ toolId }, index) => {
    const result = results[index];
    return {
      toolId,
      hit: result?.data,
      radiusKm: radii[toolId] ?? DEFAULT_RADIUS_KM,
      isPending: result === undefined || result.isPending,
      isError: result?.isError ?? false,
      error: result?.error ?? null,
      retry: () => void result?.refetch(),
    };
  });
}

export type ProjectProgress = {
  done: ReadonlySet<number>;
  doneCount: number;
  allDone: boolean;
  /** Primer paso sin completar; `null` cuando ya están todos. */
  activeIndex: number | null;
  toggle: (index: number) => void;
};

/** Avance del paso a paso: vive en memoria de la sesión y no se guarda (RF-15, plan P-10). */
export function useProjectProgress(totalSteps: number): ProjectProgress {
  const [done, setDone] = useState<ReadonlySet<number>>(() => new Set());
  const toggle = useCallback((index: number) => {
    setDone((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }, []);
  return useMemo(() => {
    const doneCount = [...done].filter((index) => index >= 0 && index < totalSteps).length;
    let activeIndex: number | null = null;
    for (let index = 0; index < totalSteps; index += 1) {
      if (!done.has(index)) {
        activeIndex = index;
        break;
      }
    }
    return {
      done,
      doneCount,
      allDone: totalSteps > 0 && doneCount === totalSteps,
      activeIndex,
      toggle,
    };
  }, [done, totalSteps, toggle]);
}
