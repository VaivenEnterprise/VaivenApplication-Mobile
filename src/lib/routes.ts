import type { Href } from 'expo-router';

// Rutas de la app en un solo lugar. El doble `as` evita depender de los tipos
// generados por Expo Router (`.expo/types`), que no existen en un checkout limpio ni en CI.
const href = (path: string): Href => path as string as Href;

export const routes = {
  root: href('/'),
  login: href('/login'),
  register: href('/register'),
  home: href('/inicio'),
  explore: href('/explorar'),
  myItems: href('/mis-objetos'),
  newItem: href('/mis-objetos/nuevo'),
  editItem: (id: string): Href => href(`/mis-objetos/${encodeURIComponent(id)}/editar`),
  activity: href('/actividad'),
  messages: href('/mensajes'),
  profile: href('/perfil'),
  editProfile: href('/perfil/editar'),
  item: (id: string): Href => href(`/objeto/${encodeURIComponent(id)}`),
  request: (itemId: string): Href => href(`/solicitar/${encodeURIComponent(itemId)}`),
  booking: (id: string): Href => href(`/reserva/${encodeURIComponent(id)}`),
  user: (id: string): Href => href(`/usuario/${encodeURIComponent(id)}`),
  project: (id: string): Href => href(`/proyecto/${encodeURIComponent(id)}`),
  chat: (id: string): Href => href(`/chat/${encodeURIComponent(id)}`),
} as const;
