import type { LinearGradientProps } from 'expo-linear-gradient';
import * as plusJakarta from '@expo-google-fonts/plus-jakarta-sans';
import { colors, fontFamily, gradients, shadows, sizes, spacing, typography } from '@/theme';

// Luminancia relativa y contraste según WCAG 2.1.
function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((i) => {
    const channel = parseInt(hex.slice(i, i + 2), 16) / 255;
    return channel <= 0.03928 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a: string, b: string): number {
  const [light = 0, dark = 0] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

describe('contraste de los tokens (plan 002 §4.2, WCAG AA 4.5:1)', () => {
  it.each<[string, string, string]>([
    ['onPrimary sobre primary', colors.onPrimary, colors.primary],
    ['onPrimary sobre secondary', colors.onPrimary, colors.secondary],
    [
      'onPrimary sobre el inicio del degradado primario',
      colors.onPrimary,
      gradients.primaryButton.colors[0],
    ],
    [
      'onPrimary sobre el final del degradado primario',
      colors.onPrimary,
      gradients.primaryButton.colors[1],
    ],
    ['primaryInk sobre primarySoft', colors.primaryInk, colors.primarySoft],
    ['muted sobre background', colors.muted, colors.background],
    ['primaryPressed sobre background', colors.primaryPressed, colors.background],
    ['primaryPressed sobre primarySoft', colors.primaryPressed, colors.primarySoft],
    ['secondaryPressed sobre secondarySoft', colors.secondaryPressed, colors.secondarySoft],
    ['danger sobre dangerSoft', colors.danger, colors.dangerSoft],
    ['warning sobre warningSoft', colors.warning, colors.warningSoft],
    ['ink sobre background', colors.ink, colors.background],
  ])('%s cumple 4.5:1', (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });

  it('documenta la regla de uso: primary sobre fondo claro no sirve para texto pequeño', () => {
    expect(contrast(colors.primary, colors.background)).toBeLessThan(4.5);
    expect(contrast(colors.primary, colors.primarySoft)).toBeLessThan(4.5);
  });
});

describe('valores del plan', () => {
  it('conserva la escala de espaciado y los tamaños táctiles', () => {
    expect(spacing).toEqual({ xs: 4, sm: 8, smd: 12, md: 16, gutter: 20, lg: 24, xl: 32, xxl: 48 });
    expect(sizes.touch.minSize).toBeGreaterThanOrEqual(44);
    expect(sizes.control.height).toBe(56);
  });

  it('cada variante tipográfica usa una familia declarada', () => {
    const families = Object.values(fontFamily) as string[];
    for (const variant of Object.values(typography)) {
      expect(families).toContain(variant.fontFamily);
    }
  });

  it('las familias existen en el paquete de fuentes', () => {
    for (const name of Object.values(fontFamily)) {
      expect(Object.keys(plusJakarta)).toContain(name);
    }
  });

  it('las sombras usan colores del tema y opacidad entre 0 y 1', () => {
    const palette = Object.values(colors) as string[];
    for (const shadow of Object.values(shadows)) {
      expect(palette).toContain(shadow.shadowColor);
      expect(shadow.shadowOpacity).toBeGreaterThan(0);
      expect(shadow.shadowOpacity).toBeLessThan(1);
    }
  });

  it('los degradados son compatibles con LinearGradient', () => {
    const colorsProp: LinearGradientProps['colors'] = gradients.authBackground.colors;
    const start: LinearGradientProps['start'] = gradients.primaryButton.start;
    expect(colorsProp).toHaveLength(3);
    expect(start).toEqual({ x: 0, y: 0.5 });
  });
});
