// Textos de perfil, edición y eliminación de cuenta (spec 003 §7.8 a §7.11).

export const profileEs = {
  title: 'Perfil',
  memberSince: 'En Vaivén desde',
  editProfile: 'Editar perfil',
  signOut: 'Cerrar sesión',
  deleteAccount: 'Eliminar cuenta',
  edit: {
    title: 'Editar perfil',
    name: 'Nombre',
    namePlaceholder: 'Tu nombre',
    phone: 'Teléfono (opcional)',
    phonePlaceholder: '5512345678',
    phoneHint: 'Solo lo ves tú.',
    save: 'Guardar',
    saved: 'Guardado',
    phoneInvalid: 'Escribe de 10 a 15 dígitos, con + opcional.',
  },
  delete: {
    title: '¿Eliminar tu cuenta?',
    description: 'No se puede deshacer.',
    password: 'Contraseña',
    passwordPlaceholder: 'Tu contraseña',
    confirm: 'Eliminar',
    cancel: 'Cancelar',
    wrongPassword: 'La contraseña no es correcta.',
    pending: 'Tienes operaciones pendientes',
  },
  publicProfile: {
    title: 'Perfil',
    ratings: 'calificaciones',
    noRatings: 'Aún sin calificaciones',
    deleted: 'Cuenta eliminada',
  },
} as const;
