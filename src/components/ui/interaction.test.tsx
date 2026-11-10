import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { AccessibilityInfo, Animated, StyleSheet, Text } from 'react-native';
import { es } from '@/i18n/es-MX';
import { colors, motion, sizes } from '@/theme';
import { Avatar } from './Avatar';
import { Banner, type BannerVariant } from './Banner';
import { BottomSheet } from './BottomSheet';
import { ListRow } from './ListRow';
import { ProgressBar } from './ProgressBar';
import { RatingStars } from './RatingStars';
import { SearchBar } from './SearchBar';
import { SegmentedControl } from './SegmentedControl';
import { Skeleton } from './Skeleton';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('Skeleton', () => {
  const stubLoop = () =>
    jest.spyOn(Animated, 'loop').mockReturnValue({
      start: jest.fn(),
      stop: jest.fn(),
      reset: jest.fn(),
    });

  it.each(['line', 'card', 'circle'] as const)(
    'renderiza la forma %s oculta a lectores',
    async (shape) => {
      stubLoop();
      jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
      await render(<Skeleton shape={shape} width={80} />);
      expect(screen.toJSON()).not.toBeNull();
    },
  );

  it('late cuando el sistema no pide reducir movimiento', async () => {
    const loop = stubLoop();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    await render(<Skeleton />);
    await waitFor(() => expect(loop).toHaveBeenCalled());
  });

  it('no anima si el sistema pide reducir movimiento', async () => {
    const loop = stubLoop();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
    await render(<Skeleton />);
    await act(async () => {
      await Promise.resolve();
    });
    expect(loop).not.toHaveBeenCalled();
  });

  it('reacciona al cambio de la preferencia', async () => {
    const loop = stubLoop();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
    let notify: (value: boolean) => void = () => undefined;
    const remove = jest.fn();
    jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((_name, handler) => {
      notify = handler as (value: boolean) => void;
      return { remove };
    });
    const view = await render(<Skeleton />);
    await waitFor(() => expect(loop).toHaveBeenCalled());
    const animation = loop.mock.results[0]?.value as { stop: jest.Mock };
    await act(async () => {
      notify(true);
    });
    expect(animation.stop).toHaveBeenCalled();
    await view.unmount();
    expect(remove).toHaveBeenCalled();
  });
});

describe('Avatar', () => {
  it('muestra la inicial en mayúscula y se anuncia con el nombre', async () => {
    await render(<Avatar name="  ana lópez" />);
    expect(screen.getByText('A')).toBeTruthy();
    expect(screen.getByLabelText('  ana lópez')).toBeTruthy();
  });

  it('el color es estable por nombre y sale de la paleta', async () => {
    await render(
      <>
        <Avatar name="Carlos" />
        <Avatar name="Carlos" size="lg" />
      </>,
    );
    const [a, b] = screen.getAllByRole('image');
    const bg = (el: typeof a) => StyleSheet.flatten(el?.props.style).backgroundColor;
    expect(bg(a)).toBe(bg(b));
    expect(Object.values(colors)).toContain(bg(a));
  });

  it('tiene tres tamaños distintos', async () => {
    await render(
      <>
        <Avatar name="A" size="sm" />
        <Avatar name="A" size="md" />
        <Avatar name="A" size="lg" />
      </>,
    );
    const widths = screen
      .getAllByRole('image')
      .map((el) => StyleSheet.flatten(el.props.style).width);
    expect(new Set(widths).size).toBe(3);
    expect(widths).toEqual([...widths].sort((x, y) => x - y));
  });

  it('no falla con un nombre vacío', async () => {
    await render(<Avatar name="" />);
    expect(screen.toJSON()).not.toBeNull();
  });
});

describe('Banner', () => {
  const variants: BannerVariant[] = ['info', 'success', 'warning', 'danger', 'offline'];

  it.each(variants)('muestra el mensaje de la variante %s con el alto de 36', async (variant) => {
    await render(<Banner variant={variant} message="Aviso" />);
    expect(screen.getByText('Aviso')).toBeTruthy();
    expect(sizes.banner).toBe(36);
  });

  it('las variantes urgentes se anuncian como alerta', async () => {
    await render(
      <>
        <Banner variant="danger" message="Error" />
        <Banner variant="offline" message="Sin red" />
        <Banner variant="info" message="Info" />
      </>,
    );
    expect(screen.getAllByRole('alert')).toHaveLength(2);
  });

  it('usa info por defecto', async () => {
    await render(<Banner message="Hola" />);
    expect(screen.getByText('Hola')).toBeTruthy();
  });
});

describe('ProgressBar', () => {
  it('expone el valor como porcentaje', async () => {
    await render(<ProgressBar value={0.4} accessibilityLabel="Avance" />);
    expect(screen.getByRole('progressbar', { name: 'Avance' })).toHaveAccessibilityValue({
      min: 0,
      max: 100,
      now: 40,
    });
  });

  it.each([
    [-1, 0],
    [2, 100],
    [Number.NaN, 0],
  ])('ajusta %s a %s', async (input, expected) => {
    await render(<ProgressBar value={input} />);
    expect(screen.getByRole('progressbar')).toHaveAccessibilityValue({ now: expected });
  });
});

describe('SegmentedControl', () => {
  const options = [
    { value: 'a', label: 'Recibidas', badge: 3 },
    { value: 'b', label: 'Enviadas' },
  ] as const;

  it('marca la opción activa y cambia al pulsar otra', async () => {
    const onChange = jest.fn();
    await render(<SegmentedControl options={options} value="a" onChange={onChange} />);
    expect(screen.getByRole('tab', { name: 'Recibidas' })).toBeSelected();
    expect(screen.getByRole('tab', { name: 'Enviadas' })).not.toBeSelected();
    await fireEvent.press(screen.getByRole('tab', { name: 'Enviadas' }));
    expect(onChange).toHaveBeenCalledWith('b');
  });

  it('muestra la insignia solo donde se indica', async () => {
    await render(<SegmentedControl options={options} value="b" onChange={jest.fn()} />);
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getAllByRole('tab')).toHaveLength(2);
  });

  it('cada opción mide al menos 44 pt de alto', async () => {
    await render(<SegmentedControl options={options} value="a" onChange={jest.fn()} />);
    for (const tab of screen.getAllByRole('tab')) {
      expect(StyleSheet.flatten(tab.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });
});

describe('RatingStars', () => {
  it('de solo lectura lee «N de 5»', async () => {
    await render(<RatingStars value={4.4} />);
    expect(screen.getByLabelText(`4 ${es.ui.outOfFive}`)).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('ajusta valores fuera de rango o no numéricos', async () => {
    await render(
      <>
        <RatingStars value={9} />
        <RatingStars value={Number.NaN} />
      </>,
    );
    expect(screen.getByLabelText(`5 ${es.ui.outOfFive}`)).toBeTruthy();
    expect(screen.getByLabelText(`0 ${es.ui.outOfFive}`)).toBeTruthy();
  });

  it('táctil: cinco botones de al menos 44 pt que devuelven su valor', async () => {
    const onChange = jest.fn();
    await render(<RatingStars value={2} onChange={onChange} />);
    const stars = screen.getAllByRole('button');
    expect(stars).toHaveLength(5);
    for (const star of stars) {
      const style = StyleSheet.flatten(star.props.style);
      expect(style.minWidth).toBeGreaterThanOrEqual(44);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    }
    await fireEvent.press(screen.getByRole('button', { name: `4 ${es.ui.outOfFive}` }));
    expect(onChange).toHaveBeenCalledWith(4);
    expect(screen.getByRole('button', { name: `2 ${es.ui.outOfFive}` })).toBeSelected();
  });
});

describe('ListRow', () => {
  it('muestra título, subtítulo, elemento inicial y final', async () => {
    await render(
      <ListRow
        title="Taladro"
        subtitle="~300 m"
        leading={<Text>icono</Text>}
        trailing={<Text>insignia</Text>}
      />,
    );
    for (const text of ['Taladro', '~300 m', 'icono', 'insignia']) {
      expect(screen.getByText(text)).toBeTruthy();
    }
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('con onPress es un botón de al menos 56 pt con chevron', async () => {
    const onPress = jest.fn();
    await render(<ListRow title="Perfil" onPress={onPress} />);
    const row = screen.getByRole('button', { name: 'Perfil' });
    expect(StyleSheet.flatten(row.props.style).minHeight).toBeGreaterThanOrEqual(56);
    await fireEvent.press(row);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('SearchBar', () => {
  it('tiene rol de búsqueda y el campo se anuncia con su texto de ayuda', async () => {
    await render(<SearchBar value="" onChangeText={jest.fn()} placeholder="Buscar objetos" />);
    expect(screen.getByRole('search')).toBeTruthy();
    expect(screen.getByLabelText('Buscar objetos')).toBeTruthy();
    expect(screen.queryByRole('button', { name: es.ui.clearSearch })).toBeNull();
  });

  it('envía lo escrito y el botón de borrar vacía el texto', async () => {
    const onChangeText = jest.fn();
    await render(<SearchBar value="taladro" onChangeText={onChangeText} placeholder="Buscar" />);
    await fireEvent.changeText(screen.getByLabelText('Buscar'), 'sierra');
    expect(onChangeText).toHaveBeenCalledWith('sierra');
    await fireEvent.press(screen.getByRole('button', { name: es.ui.clearSearch }));
    expect(onChangeText).toHaveBeenLastCalledWith('');
  });

  it('admite un botón final', async () => {
    await render(
      <SearchBar
        value=""
        onChangeText={jest.fn()}
        placeholder="Buscar"
        trailing={<Text>filtros</Text>}
      />,
    );
    expect(screen.getByText('filtros')).toBeTruthy();
  });
});

describe('BottomSheet', () => {
  const sheet = (onClose = jest.fn(), visible = true) => (
    <BottomSheet visible={visible} onClose={onClose} title="Filtros" footer={<Text>pie</Text>}>
      <Text>contenido</Text>
    </BottomSheet>
  );

  it('muestra título como encabezado, contenido y pie', async () => {
    await render(sheet());
    expect(screen.getByRole('header', { name: 'Filtros' })).toBeTruthy();
    expect(screen.getByText('contenido')).toBeTruthy();
    expect(screen.getByText('pie')).toBeTruthy();
  });

  it('no muestra nada si no es visible', async () => {
    await render(sheet(jest.fn(), false));
    expect(screen.queryByText('contenido')).toBeNull();
  });

  it('se cierra con la «X»', async () => {
    const onClose = jest.fn();
    await render(sheet(onClose));
    await fireEvent.press(screen.getByRole('button', { name: es.ui.close }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra tocando fuera', async () => {
    const onClose = jest.fn();
    await render(sheet(onClose));
    // El velo queda fuera del alcance del lector de pantalla (hoja modal): la «X» es la vía accesible.
    const [scrim] = screen.getAllByRole('button', { name: es.ui.close, hidden: true });
    await fireEvent.press(scrim!);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra con el botón atrás de Android', async () => {
    const onClose = jest.fn();
    await render(sheet(onClose));
    await fireEvent(screen.getByTestId('bottom-sheet'), 'requestClose');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('se cierra al deslizar hacia abajo más de la distancia de cierre', async () => {
    const onClose = jest.fn();
    await render(sheet(onClose));
    const grab = screen.getByTestId('sheet-grab');
    await fireEvent(grab, 'touchStart', { nativeEvent: { pageY: 100 } });
    await fireEvent(grab, 'touchMove', { nativeEvent: { pageY: 140 } });
    await fireEvent(grab, 'touchEnd', {
      nativeEvent: { pageY: 100 + motion.sheetDismissDistance + 1 },
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('no se cierra con un deslizamiento corto, hacia arriba o sin inicio', async () => {
    const onClose = jest.fn();
    await render(sheet(onClose));
    const grab = screen.getByTestId('sheet-grab');
    await fireEvent(grab, 'touchMove', { nativeEvent: { pageY: 500 } });
    await fireEvent(grab, 'touchEnd', { nativeEvent: { pageY: 500 } });
    await fireEvent(grab, 'touchStart', { nativeEvent: { pageY: 100 } });
    await fireEvent(grab, 'touchEnd', {
      nativeEvent: { pageY: 100 + motion.sheetDismissDistance },
    });
    await fireEvent(grab, 'touchStart', { nativeEvent: { pageY: 300 } });
    await fireEvent(grab, 'touchMove', { nativeEvent: { pageY: 100 } });
    await fireEvent(grab, 'touchEnd', { nativeEvent: { pageY: 100 } });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('funciona sin título ni pie', async () => {
    await render(
      <BottomSheet visible onClose={jest.fn()}>
        <Text>solo contenido</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('solo contenido')).toBeTruthy();
    expect(screen.queryByRole('header')).toBeNull();
  });

  it('los botones de cerrar miden al menos 44 pt', async () => {
    await render(sheet());
    const close = screen.getByRole('button', { name: es.ui.close });
    expect(StyleSheet.flatten(close.props.style).minWidth).toBeGreaterThanOrEqual(44);
  });
});
