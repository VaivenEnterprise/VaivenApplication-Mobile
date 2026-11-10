// Tokens de diseño v1 (plan 002 §4.2, diseño de Stitch del 9 nov 2026).
// Es el ÚNICO lugar donde viven colores, espaciados, radios, tipografías, sombras
// y tamaños literales (Art. VII.1). Cualquier valor nuevo se propone aquí primero.

export const colors = {
  // Marca
  primary: '#C24E24',
  primaryPressed: '#A33F1A',
  primarySoft: '#FBE4D8',
  primaryInk: '#8A3A1B',
  secondary: '#1B7A57',
  secondaryPressed: '#146B4B',
  secondarySoft: '#DDF1E7',
  // Neutros
  background: '#FAF6F0',
  surface: '#FFFFFF',
  surfaceMuted: '#F3EEE7',
  border: '#E9DED2',
  ink: '#2A1F1A',
  muted: '#6F6058',
  placeholder: '#8F8179',
  onPrimary: '#FFFFFF',
  // Estado
  danger: '#B3261E',
  dangerSoft: '#FDE8E6',
  success: '#1B7A57',
  warning: '#8A5A00',
  warningSoft: '#FFF1D6',
  scrim: 'rgba(30,18,12,0.72)',
  // Mapa esquemático
  mapLand: '#F1EADF',
  mapBlock: '#E7DDCF',
  mapRoad: '#FFFFFF',
  mapPark: '#D9EAD9',
  userDot: '#2F6BFF',
} as const;

const diagonal = { start: { x: 0, y: 0 }, end: { x: 1, y: 1 } } as const;
const horizontal = { start: { x: 0, y: 0.5 }, end: { x: 1, y: 0.5 } } as const;
const vertical = { start: { x: 0.5, y: 0 }, end: { x: 0.5, y: 1 } } as const;

export const gradients = {
  authBackground: { colors: ['#FFF6EE', '#FBE3D3', '#F6C9B0'], ...diagonal },
  primaryButton: { colors: ['#C65227', '#AE411A'], ...horizontal },
  secondaryButton: { colors: ['#1B7A57', '#146B4B'], ...horizontal },
  // Transparente con el mismo tono del scrim para evitar bordes grises.
  heroScrim: { colors: ['rgba(30,18,12,0)', colors.scrim], ...vertical },
  slotWarm: { colors: ['#FBE4D8', '#F6CFBB'], ...diagonal },
  slotGreen: { colors: ['#DDF1E7', '#C4E6D4'], ...diagonal },
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  smd: 12,
  md: 16,
  /** Margen horizontal de pantalla. */
  gutter: 20,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 14,
  /** Campos y botones. */
  lg: 20,
  /** Tarjetas y hojas. */
  xl: 28,
  pill: 999,
} as const;

export const fontFamily = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} as const;

export const typography = {
  /** Título de bienvenida. */
  display: {
    fontFamily: fontFamily.extrabold,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title: { fontFamily: fontFamily.extrabold, fontSize: 26, lineHeight: 32 },
  heading: { fontFamily: fontFamily.bold, fontSize: 20, lineHeight: 26 },
  subheading: { fontFamily: fontFamily.bold, fontSize: 17, lineHeight: 24 },
  body: { fontFamily: fontFamily.regular, fontSize: 16, lineHeight: 22 },
  bodyStrong: { fontFamily: fontFamily.semibold, fontSize: 16, lineHeight: 22 },
  /** Etiqueta de campo. */
  label: { fontFamily: fontFamily.semibold, fontSize: 14, lineHeight: 20 },
  eyebrow: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  caption: { fontFamily: fontFamily.medium, fontSize: 13, lineHeight: 18 },
  button: { fontFamily: fontFamily.bold, fontSize: 16, lineHeight: 20 },
  tab: { fontFamily: fontFamily.semibold, fontSize: 11, lineHeight: 14 },
} as const;

// `shadowRadius` toma el valor de «desenfoque» del plan sin conversión.
export const shadows = {
  soft: {
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  card: {
    shadowColor: colors.primaryInk,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 3,
  },
  button: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 6,
  },
  fab: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 8,
  },
} as const;

export const sizes = {
  touch: { minSize: 44 },
  /** Campos y botones: alto 56, borde 1.5; adorno inicial de los campos: 36. */
  control: { height: 56, border: 1.5, iconBadge: 36 },
  /** Campos de formulario: borde en reposo, borde con foco y halo (spec 003 §7.5). */
  field: { border: 1, borderFocus: 2, halo: 3, checkbox: 24 },
  avatar: 36,
  brandTile: 40,
  tabBar: { height: 68, pillPaddingX: 14, pillPaddingY: 6 },
  thumb: 56,
  thumbLg: 72,
  pin: 36,
  sheetHandle: { width: 40, height: 4 },
  /** Aviso global bajo la barra de estado (spec §9.1). */
  banner: 36,
  sheetMaxHeight: '85%',
  /** Altura útil mínima (pt) para mostrar la ilustración del pie de inicio de sesión. */
  illustrationMinHeight: 700,
  illustrationHeight: 120,
  /** Tarjetas de proyecto: alto de `hero` y `compact`, alto mínimo de `wide` (spec 006 §7.3). */
  projectCard: { hero: 160, compact: 112, wide: 72 },
  /** Tarjeta de objeto del Inicio y su foto 4:3 (spec 003 §7.3). */
  homeTile: 160,
  /** Botón circular (volver, mensajes). */
  roundButton: 44,
} as const;

export const motion = {
  pressScale: 0.98,
  duration: { fast: 120, skeleton: 900, saved: 900 },
  /** Distancia de arrastre (pt) a partir de la cual una hoja inferior se cierra. */
  sheetDismissDistance: 80,
} as const;
