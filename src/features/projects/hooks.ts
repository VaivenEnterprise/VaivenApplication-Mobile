import type { CompletedWork, Project, ProjectRequiredTool, Tool } from '@/lib/domain/models';
import { findProjectById, findProjectForToolId, findToolById } from '@/mocks';
import { projects } from '@/mocks/projects';
import { works } from '@/mocks/works';

export type ProjectDetailItem = {
  required: ProjectRequiredTool;
  tool?: Tool;
};

export function useProjects(): readonly Project[] {
  return projects;
}

export function useWorks(): readonly CompletedWork[] {
  return works;
}

export function useProjectDetail(id: string): {
  project: Project | undefined;
  tools: readonly ProjectDetailItem[];
} {
  const project = findProjectById(id) ?? findProjectForToolId(id);
  const tools =
    project?.requiredTools.map((required) => ({
      required,
      tool: required.toolId ? findToolById(required.toolId) : undefined,
    })) ?? [];

  return { project, tools };
}
