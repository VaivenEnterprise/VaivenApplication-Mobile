import type { Tool, ToolCategory } from '@/lib/domain/models';
import { tools } from '@/mocks/tools';

export type ToolFilter = 'all' | ToolCategory;

export function useTools(filter: ToolFilter = 'all'): readonly Tool[] {
  if (filter === 'all') {
    return tools;
  }

  return tools.filter((tool) => tool.category === filter);
}
