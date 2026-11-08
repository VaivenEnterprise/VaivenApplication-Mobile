import { projects } from './projects';
import { tools } from './tools';

export { projects } from './projects';
export { requests } from './requests';
export { mariana, users } from './users';
export { tools } from './tools';
export { works } from './works';

export function findProjectById(id: string) {
  return projects.find((project) => project.id === id);
}

export function findProjectForToolId(toolId: string) {
  return projects.find((project) =>
    project.requiredTools.some((requiredTool) => requiredTool.toolId === toolId),
  );
}

export function findToolById(id: string) {
  return tools.find((tool) => tool.id === id);
}
