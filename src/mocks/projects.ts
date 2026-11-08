import type { Project } from '@/lib/domain/models';

export const projects: readonly Project[] = [
  {
    id: 'project-hang-picture',
    title: 'Colgar un cuadro',
    requiredTools: [
      { id: 'required-level', name: 'Nivel', toolId: 'tool-level' },
      { id: 'required-drill', name: 'Taladro', toolId: 'tool-drill' },
      { id: 'required-bits', name: 'Brocas', toolId: 'tool-bits' },
    ],
  },
  {
    id: 'project-assemble-furniture',
    title: 'Armar un mueble',
    requiredTools: [
      { id: 'required-screwdriver', name: 'Atornillador' },
      { id: 'required-hammer', name: 'Martillo' },
    ],
  },
  {
    id: 'project-prune-garden',
    title: 'Podar el jardín',
    requiredTools: [
      { id: 'required-shears', name: 'Tijeras' },
      { id: 'required-trimmer', name: 'Podadora' },
    ],
  },
];
