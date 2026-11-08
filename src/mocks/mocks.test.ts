import type { RequestDay, RequestStatus, ToolStatus } from '@/lib/domain/models';
import {
  findProjectById,
  findProjectForToolId,
  findToolById,
  mariana,
  projects,
  requests,
  tools,
  users,
  works,
} from './index';

const toolStatuses: ToolStatus[] = ['available', 'lent'];
const requestStatuses: RequestStatus[] = ['pending', 'accepted', 'rejected'];
const requestDays: RequestDay[] = ['today', 'yesterday'];

function expectUniqueIds(items: readonly { id: string }[]) {
  const ids = items.map((item) => item.id);
  expect(new Set(ids).size).toBe(ids.length);
}

describe('mocks', () => {
  it('tiene ids únicos en cada colección', () => {
    expectUniqueIds(tools);
    expectUniqueIds(projects);
    expectUniqueIds(requests);
    expectUniqueIds(users);
    expectUniqueIds(works);

    const requiredToolIds = projects.flatMap((project) =>
      project.requiredTools.map((requiredTool) => requiredTool.id),
    );
    expect(new Set(requiredToolIds).size).toBe(requiredToolIds.length);
  });

  it('contiene las tres herramientas del maquetado', () => {
    expect(tools.map((tool) => tool.name)).toEqual([
      'Taladro percutor',
      'Nivel de burbuja',
      'Juego de brocas',
    ]);
    expect(tools.map((tool) => tool.ownerName)).toEqual(['Carlos', 'Ana', 'Luis']);
    expect(tools.map((tool) => tool.distanceBlocks)).toEqual([3, 1, 4]);
    expect(tools.map((tool) => tool.status)).toEqual(['available', 'available', 'lent']);
  });

  it('valida estados y distancias de las herramientas', () => {
    for (const tool of tools) {
      expect(toolStatuses).toContain(tool.status);
      expect(tool.distanceBlocks).toBeGreaterThan(0);
    }
  });

  it('contiene los tres proyectos y enlaza solo herramientas existentes', () => {
    expect(projects.map((project) => project.title)).toEqual([
      'Colgar un cuadro',
      'Armar un mueble',
      'Podar el jardín',
    ]);

    for (const project of projects) {
      for (const requiredTool of project.requiredTools) {
        if (requiredTool.toolId) {
          expect(findToolById(requiredTool.toolId)).toBeDefined();
        }
      }
    }

    expect(findProjectById('project-hang-picture')?.requiredTools).toHaveLength(3);
    expect(findProjectForToolId('tool-drill')?.id).toBe('project-hang-picture');
  });

  it('contiene las dos solicitudes y referencia herramientas por nombre', () => {
    expect(requests).toHaveLength(2);
    expect(requests[0]?.requesterName).toBe('M...');
    expect(requests[0]?.status).toBe('pending');
    expect(requests[1]?.requesterName).toBe('David');
    expect(requests[1]?.status).toBe('accepted');

    for (const request of requests) {
      expect(requestStatuses).toContain(request.status);
      expect(requestDays).toContain(request.day);
      expect(tools.some((tool) => tool.name === request.toolName)).toBe(true);
    }
  });

  it('incluye a Mariana como única usuaria', () => {
    expect(users).toHaveLength(1);
    expect(mariana.name).toBe('Mariana');
  });

  it('contiene dos trabajos realizados para el Inicio autenticado', () => {
    expect(works.map((work) => work.title)).toEqual(['Colgar un cuadro', 'Armar un mueble']);
    expect(works.every((work) => work.completedDaysAgo > 0)).toBe(true);
  });
});
