import { fireEvent, render, screen } from '@testing-library/react-native';
import { SuspendedScreen } from '@/features/auth/screens/SuspendedScreen';
import { es } from '@/i18n/es-MX';
import { formatDate } from '@/lib/format/date';

jest.setTimeout(30_000);

const t = es.auth.suspended;

describe('SuspendedScreen (spec 003 RF-10)', () => {
  it('muestra el título como encabezado, la descripción y la acción', async () => {
    await render(<SuspendedScreen until={null} onDismiss={jest.fn()} />);
    expect(screen.getByRole('header', { name: t.title })).toBeTruthy();
    expect(screen.getByText(t.description)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.action })).toBeTruthy();
  });

  it('sin fecha de fin no muestra la línea «hasta»', async () => {
    await render(<SuspendedScreen until={null} onDismiss={jest.fn()} />);
    expect(screen.queryByText(new RegExp(t.untilPrefix))).toBeNull();
  });

  it('con fecha de fin la muestra formateada', async () => {
    const until = '2026-12-15T12:00:00.000Z';
    await render(<SuspendedScreen until={until} onDismiss={jest.fn()} />);
    expect(screen.getByText(`${t.untilPrefix} ${formatDate(until)}`)).toBeTruthy();
  });

  it('la acción llama a onDismiss una vez', async () => {
    const onDismiss = jest.fn();
    await render(<SuspendedScreen until={null} onDismiss={onDismiss} />);
    await fireEvent.press(screen.getByRole('button', { name: t.action }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
