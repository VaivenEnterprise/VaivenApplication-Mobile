import { fireEvent, render, screen } from '@testing-library/react-native';
import { RequestButton } from '@/features/bookings/components/RequestButton';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { fakeItem } from '@/test/fakeItems';

const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));
jest.mock('@/features/auth/useSession', () => ({
  useSession: () => ({
    status: 'signedIn',
    user: { ...jest.requireActual('@/test/fakeApi').fakeUser },
  }),
}));

const other = { ...fakeItem().owner, id: 'otra-persona' };

beforeEach(() => mockPush.mockReset());

describe('RequestButton', () => {
  it('abre la hoja «Solicitar» de un objeto ajeno y activo', async () => {
    const item = fakeItem({ owner: other });
    await render(<RequestButton item={item} />);
    await fireEvent.press(screen.getByLabelText(es.bookings.request.button));
    expect(mockPush).toHaveBeenCalledWith(routes.request(item.id));
  });

  it('no aparece si el objeto es de quien lo mira', async () => {
    await render(<RequestButton item={fakeItem()} />);
    expect(screen.queryByLabelText(es.bookings.request.button)).toBeNull();
  });

  it.each(['paused', 'blocked', 'removed'] as const)(
    'no aparece si el objeto está %s',
    async (status) => {
      await render(<RequestButton item={fakeItem({ owner: other, status })} />);
      expect(screen.queryByLabelText(es.bookings.request.button)).toBeNull();
    },
  );
});
