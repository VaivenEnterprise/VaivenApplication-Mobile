import {
  chatRoles,
  requestDays,
  requestStatuses,
  toolCategories,
  toolStatuses,
} from '@/lib/domain/models';
import type {
  ChatMessage,
  ChatRole,
  CompletedWork,
  Project,
  ProjectRequiredTool,
  RequestDay,
  RequestStatus,
  Tool,
  ToolCategory,
  ToolRequest,
  ToolStatus,
  User,
} from '@/lib/domain/models';

describe('modelos de dominio', () => {
  it('expone los estados y categorías de herramienta', () => {
    const statuses: readonly ToolStatus[] = toolStatuses;
    const categories: readonly ToolCategory[] = toolCategories;

    expect(statuses).toEqual(['available', 'lent']);
    expect(categories).toEqual(['tools', 'garden', 'kitchen']);
  });

  it('expone los estados y días de solicitud', () => {
    const statuses: readonly RequestStatus[] = requestStatuses;
    const days: readonly RequestDay[] = requestDays;

    expect(statuses).toEqual(['pending', 'accepted', 'rejected']);
    expect(days).toEqual(['today', 'yesterday']);
  });

  it('expone los roles de chat', () => {
    const roles: readonly ChatRole[] = chatRoles;

    expect(roles).toEqual(['assistant', 'user']);
  });

  it('construye un usuario con y sin avatar', () => {
    const withAvatar: User = {
      avatarUri: 'file://avatar.png',
      email: 'mariana@vaiven.mx',
      id: 'user-1',
      name: 'Mariana',
    };
    const withoutAvatar: User = {
      email: 'carlos@vaiven.mx',
      id: 'user-2',
      name: 'Carlos',
    };

    expect(withAvatar.avatarUri).toBe('file://avatar.png');
    expect(withoutAvatar.avatarUri).toBeUndefined();
  });

  it('construye una herramienta completa', () => {
    const tool: Tool = {
      category: 'tools',
      distanceBlocks: 3,
      id: 'tool-drill',
      name: 'Taladro percutor',
      ownerName: 'Carlos',
      status: 'available',
    };

    expect(tool).toMatchObject({ id: 'tool-drill', status: 'available' });
  });

  it('construye un proyecto con herramientas requeridas', () => {
    const linked: ProjectRequiredTool = {
      id: 'required-drill',
      name: 'Taladro',
      toolId: 'tool-drill',
    };
    const unlinked: ProjectRequiredTool = { id: 'required-hammer', name: 'Martillo' };
    const project: Project = {
      id: 'project-hang-picture',
      requiredTools: [linked, unlinked],
      title: 'Colgar un cuadro',
    };

    expect(project.requiredTools).toHaveLength(2);
    expect(unlinked.toolId).toBeUndefined();
  });

  it('construye una solicitud de herramienta', () => {
    const request: ToolRequest = {
      day: 'today',
      id: 'request-1',
      requesterName: 'Ana',
      status: 'pending',
      time: '10:30',
      toolName: 'Taladro',
    };

    expect(request).toMatchObject({ day: 'today', status: 'pending' });
  });

  it('construye un trabajo completado y un mensaje de chat', () => {
    const work: CompletedWork = {
      completedDaysAgo: 2,
      id: 'work-1',
      title: 'Colgar un cuadro',
    };
    const message: ChatMessage = {
      id: 'message-1',
      role: 'assistant',
      text: 'Hola, soy tu asistente.',
    };

    expect(work.completedDaysAgo).toBe(2);
    expect(message.role).toBe('assistant');
  });
});
