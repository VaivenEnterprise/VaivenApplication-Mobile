import { render, screen } from '@testing-library/react-native';
import { StyleSheet, Text } from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, sizes, typography } from '@/theme';
import { AppIcon } from './AppIcon';
import { AppText, type TextVariant } from './AppText';
import { BrandMark } from './BrandMark';
import { GradientBackground } from './GradientBackground';
import { Screen } from './Screen';

describe('AppText', () => {
  const variants = Object.keys(typography) as TextVariant[];

  it.each(variants)('aplica la tipografía de la variante %s', async (variant) => {
    await render(<AppText variant={variant}>hola</AppText>);
    const style = StyleSheet.flatten(screen.getByText('hola').props.style);
    expect(style).toMatchObject(typography[variant]);
    expect(style.fontWeight).toBeUndefined();
  });

  it('usa body y ink por defecto y acepta otro color de los tokens', async () => {
    await render(
      <>
        <AppText>uno</AppText>
        <AppText color="muted">dos</AppText>
      </>,
    );
    expect(StyleSheet.flatten(screen.getByText('uno').props.style)).toMatchObject({
      ...typography.body,
      color: colors.ink,
    });
    expect(StyleSheet.flatten(screen.getByText('dos').props.style).color).toBe(colors.muted);
  });
});

describe('AppIcon', () => {
  it('es decorativo sin etiqueta', async () => {
    await render(<AppIcon name="compass" />);
    expect(screen.queryByLabelText(/.+/)).toBeNull();
  });

  it('se anuncia cuando tiene etiqueta', async () => {
    await render(<AppIcon name="warning" accessibilityLabel="Advertencia" />);
    expect(screen.getByLabelText('Advertencia')).toBeTruthy();
  });

  it('renderiza cada tamaño', async () => {
    await render(
      <>
        <AppIcon name="arrowForward" size="sm" />
        <AppIcon name="cloudOffline" size="lg" />
        <AppIcon name="info" size="xl" color="muted" />
      </>,
    );
  });
});

describe('GradientBackground', () => {
  it('muestra a sus hijos en ambas variantes', async () => {
    await render(
      <>
        <GradientBackground variant="auth">
          <Text>auth</Text>
        </GradientBackground>
        <GradientBackground>
          <Text>plain</Text>
        </GradientBackground>
      </>,
    );
    expect(screen.getByText('auth')).toBeTruthy();
    expect(screen.getByText('plain')).toBeTruthy();
  });
});

describe('Screen', () => {
  it('muestra título como encabezado y contenido con desplazamiento', async () => {
    await render(
      <Screen title="Hola">
        <Text>contenido</Text>
      </Screen>,
    );
    expect(screen.getByRole('header', { name: 'Hola' })).toBeTruthy();
    expect(screen.getByText('contenido')).toBeTruthy();
  });

  it('admite fondo con degradado y modo sin desplazamiento', async () => {
    await render(
      <Screen background="auth" scroll={false}>
        <Text>fijo</Text>
      </Screen>,
    );
    expect(screen.getByText('fijo')).toBeTruthy();
    expect(screen.queryByRole('header')).toBeNull();
  });
});

describe('BrandMark', () => {
  it('muestra la V y el nombre con etiqueta accesible', async () => {
    await render(<BrandMark />);
    expect(screen.getByLabelText(es.brand.name)).toBeTruthy();
    expect(screen.getByText(es.brand.initial)).toBeTruthy();
    expect(screen.getByText(es.brand.name)).toBeTruthy();
  });

  it('el tamaño md es mayor que sm y puede ocultar el nombre', async () => {
    await render(<BrandMark size="md" showName={false} />);
    expect(screen.queryByText(es.brand.name)).toBeNull();
    expect(sizes.thumb).toBeGreaterThan(sizes.brandTile);
  });
});
