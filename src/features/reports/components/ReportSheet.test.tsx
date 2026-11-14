import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { ModerationNotice } from '@/features/reports/components/ModerationNotice';
import { ReportButton } from '@/features/reports/components/ReportButton';
import { ReportSheet } from '@/features/reports/components/ReportSheet';
import { es } from '@/i18n/es-MX';
import { failure, installFakeApi } from '@/test/fakeApi';

jest.mock('@/lib/config', () => ({
  getConfig: () => ({ apiBaseUrl: 'http://api.test', appEnv: 'development' }),
}));
jest.setTimeout(30_000);

const t = es.reports;
const POST = 'POST /reports';

function wrap(node: React.ReactElement) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

afterEach(() => jest.restoreAllMocks());

describe('ReportSheet', () => {
  it('«Enviar» solo se habilita con un motivo y envía motivo y detalles', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    const onSent = jest.fn();
    await wrap(
      <ReportSheet visible onClose={jest.fn()} targetType="item" targetId="i1" onSent={onSent} />,
    );
    const send = screen.getByRole('button', { name: t.sheet.submit });
    expect(send.props.accessibilityState).toEqual(expect.objectContaining({ disabled: true }));
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.spam }));
    await fireEvent.changeText(screen.getByLabelText(t.sheet.detailsLabel), '  Anuncio falso  ');
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(t.sheet.success)).toBeTruthy();
    expect(api.calls[0]?.body).toEqual({
      targetType: 'item',
      targetId: 'i1',
      reason: 'spam',
      details: 'Anuncio falso',
    });
    expect(onSent).toHaveBeenCalledWith({ id: 'r1', duplicate: false });
  });

  it('sin detalles no manda el campo', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    await wrap(<ReportSheet visible onClose={jest.fn()} targetType="user" targetId="u1" />);
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.other }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    await screen.findByText(t.sheet.success);
    expect(api.calls[0]?.body).toEqual({ targetType: 'user', targetId: 'u1', reason: 'other' });
  });

  it('CA-05: un reporte repetido muestra «Ya lo reportaste»', async () => {
    installFakeApi({ [POST]: () => ({ status: 200, body: { id: 'r1' } }) });
    await wrap(<ReportSheet visible onClose={jest.fn()} targetType="item" targetId="i1" />);
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.inappropriate }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(t.sheet.duplicate)).toBeTruthy();
    expect(screen.queryByText(t.sheet.success)).toBeNull();
  });

  it.each([
    [409, 'conflict', t.errors.self],
    [404, 'not_found', t.errors.notFound],
    [500, 'internal_error', t.errors.generic],
  ])('el error %s muestra su aviso y permite reintentar', async (status, code, message) => {
    installFakeApi({ [POST]: () => failure(status, code) });
    await wrap(<ReportSheet visible onClose={jest.fn()} targetType="item" targetId="i1" />);
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.spam }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    expect(await screen.findByText(message)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.sheet.submit })).toBeTruthy();
  });

  it('detalles de más de 500 caracteres bloquean el envío', async () => {
    installFakeApi({});
    await wrap(<ReportSheet visible onClose={jest.fn()} targetType="item" targetId="i1" />);
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.spam }));
    await fireEvent.changeText(screen.getByLabelText(t.sheet.detailsLabel), 'a'.repeat(501));
    expect(screen.getByText(t.errors.detailsTooLong)).toBeTruthy();
    expect(screen.getByRole('button', { name: t.sheet.submit }).props.accessibilityState).toEqual(
      expect.objectContaining({ disabled: true }),
    );
  });

  it('«Listo» cierra la hoja', async () => {
    installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    const onClose = jest.fn();
    await wrap(<ReportSheet visible onClose={onClose} targetType="item" targetId="i1" />);
    await fireEvent.press(screen.getByRole('radio', { name: t.reasons.spam }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    await fireEvent.press(await screen.findByRole('button', { name: t.sheet.done }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('con motivo fijo no muestra la lista y recorta el targetId a 64', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    await wrap(
      <ReportSheet
        visible
        onClose={jest.fn()}
        targetType="moderation_decision"
        targetId={'x'.repeat(80)}
        fixedReason="other"
      />,
    );
    expect(screen.queryByRole('radio')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    await screen.findByText(t.sheet.success);
    expect((api.calls[0]?.body as { targetId: string }).targetId).toHaveLength(64);
  });
});

describe('ReportButton', () => {
  it('abre la hoja con el texto del tipo', async () => {
    installFakeApi({});
    await wrap(<ReportButton targetType="message" targetId="m1" />);
    await fireEvent.press(screen.getByRole('button', { name: t.button.message }));
    expect(await screen.findByText(t.sheet.reasonsLabel)).toBeTruthy();
  });
});

describe('ModerationNotice', () => {
  const rejection = {
    category: 'Armas',
    reason: 'Contiene contenido no permitido: armas.',
    requestId: 'req-9',
  };

  it('CA-04: muestra título, categoría y motivo', async () => {
    installFakeApi({});
    await wrap(<ModerationNotice rejection={rejection} />);
    expect(screen.getByText(t.moderation.title)).toBeTruthy();
    expect(screen.getByText('Armas')).toBeTruthy();
    expect(screen.getByText(rejection.reason)).toBeTruthy();
  });

  it('sin categoría ni motivo usa los textos de respaldo', async () => {
    installFakeApi({});
    await wrap(<ModerationNotice rejection={{ category: null, reason: null, requestId: null }} />);
    expect(screen.getByText(t.moderation.categoryFallback)).toBeTruthy();
    expect(screen.getByText(t.moderation.reasonFallback)).toBeTruthy();
  });

  it('«Reportar esta decisión» envía moderation_decision con la referencia y agradece', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    await wrap(<ModerationNotice rejection={rejection} />);
    await fireEvent.press(screen.getByRole('button', { name: t.moderation.reportDecision }));
    await fireEvent.changeText(screen.getByLabelText(t.sheet.detailsLabel), 'Era una broma');
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    await screen.findByRole('button', { name: t.sheet.done });
    expect(api.calls[0]?.body).toEqual({
      targetType: 'moderation_decision',
      targetId: 'req-9',
      reason: 'other',
      details: 'Era una broma',
    });
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.done }));
    await waitFor(() => expect(screen.getByText(t.moderation.reported)).toBeTruthy());
    expect(screen.queryByRole('button', { name: t.moderation.reportDecision })).toBeNull();
  });

  it('decisionRef tiene prioridad sobre el requestId', async () => {
    const api = installFakeApi({ [POST]: () => ({ status: 201, body: { id: 'r1' } }) });
    await wrap(<ModerationNotice rejection={rejection} decisionRef="msg-ref" />);
    await fireEvent.press(screen.getByRole('button', { name: t.moderation.reportDecision }));
    await fireEvent.press(screen.getByRole('button', { name: t.sheet.submit }));
    await screen.findByRole('button', { name: t.sheet.done });
    expect((api.calls[0]?.body as { targetId: string }).targetId).toBe('msg-ref');
  });
});
