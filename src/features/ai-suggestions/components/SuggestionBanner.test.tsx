import { fireEvent, render, screen } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import { SuggestionBanner } from '@/features/ai-suggestions/components/SuggestionBanner';
import type { SuggestionStatus } from '@/features/ai-suggestions/types';
import { es } from '@/i18n/es-MX';
import { reduceMotionSync } from '@/test/fakeA11y';

const t = es.aiSuggestions;

// El esqueleto de carga anima en bucle; con «reducir movimiento» queda quieto y la prueba no espera.
beforeEach(() => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockImplementation(reduceMotionSync(true));
});
afterEach(() => jest.restoreAllMocks());
const SUGGESTION = { title: 'Taladro inalámbrico 18 V', category: 'herramientas_electricas' };

type Overrides = {
  status?: SuggestionStatus;
  suggestion?: typeof SUGGESTION | null;
  categoryLabel?: string | null;
  applied?: boolean;
};

async function setup({
  status = 'idle',
  suggestion = null,
  categoryLabel = null,
  applied = false,
}: Overrides = {}) {
  const handlers = {
    onSuggest: jest.fn(),
    onCancel: jest.fn(),
    onUse: jest.fn(),
    onEdit: jest.fn(),
    onDismiss: jest.fn(),
  };
  const view = await render(
    <SuggestionBanner
      status={status}
      suggestion={suggestion}
      categoryLabel={categoryLabel}
      applied={applied}
      {...handlers}
    />,
  );
  return { ...handlers, view };
}

describe('SuggestionBanner — en reposo', () => {
  it('muestra el botón y el aviso de que la foto se envía a un servicio de IA (RF-01)', async () => {
    const { onSuggest } = await setup();
    expect(screen.getByText(t.notice)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.button }));
    expect(onSuggest).toHaveBeenCalledTimes(1);
  });

  it('no muestra ninguna tarjeta de resultado', async () => {
    await setup();
    expect(screen.queryByText(t.title)).toBeNull();
    expect(screen.queryByRole('button', { name: t.use })).toBeNull();
  });
});

describe('SuggestionBanner — cargando', () => {
  it('muestra «Analizando…» y deja cancelar', async () => {
    const { onCancel } = await setup({ status: 'loading' });
    expect(screen.getByText(t.loading)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.button })).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: t.cancel }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('anuncia el estado ocupado a los lectores de pantalla', async () => {
    await setup({ status: 'loading' });
    expect(screen.getByText(t.loading).parent?.props.accessibilityState).toEqual({ busy: true });
  });
});

describe('SuggestionBanner — resultado', () => {
  it('muestra título, categoría y las acciones Usar, Editar y Descartar (CA-01)', async () => {
    await setup({
      status: 'success',
      suggestion: SUGGESTION,
      categoryLabel: 'Herramientas eléctricas',
    });
    expect(screen.getByText(t.title)).toBeTruthy();
    expect(screen.getByText(SUGGESTION.title)).toBeTruthy();
    expect(screen.getByText('Herramientas eléctricas')).toBeTruthy();
    expect(screen.getByRole('button', { name: t.use })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.edit })).toBeTruthy();
    expect(screen.getByRole('button', { name: t.dismiss })).toBeTruthy();
  });

  it('describe la sugerencia completa para lectores de pantalla', async () => {
    await setup({
      status: 'success',
      suggestion: SUGGESTION,
      categoryLabel: 'Herramientas eléctricas',
    });
    expect(
      screen.getByLabelText(
        `${t.resultLabel}: ${SUGGESTION.title}. ${t.categoryLabel}: Herramientas eléctricas`,
      ),
    ).toBeTruthy();
  });

  it('sin categoría válida no muestra la píldora', async () => {
    await setup({ status: 'success', suggestion: SUGGESTION, categoryLabel: null });
    expect(screen.getByText(SUGGESTION.title)).toBeTruthy();
    expect(screen.queryByText('Herramientas eléctricas')).toBeNull();
    expect(screen.getByLabelText(`${t.resultLabel}: ${SUGGESTION.title}`)).toBeTruthy();
  });

  it('cada acción llama a su manejador', async () => {
    const { onUse, onEdit, onDismiss } = await setup({
      status: 'success',
      suggestion: SUGGESTION,
      categoryLabel: 'Herramientas eléctricas',
    });
    await fireEvent.press(screen.getByRole('button', { name: t.use }));
    await fireEvent.press(screen.getByRole('button', { name: t.edit }));
    await fireEvent.press(screen.getByRole('button', { name: t.dismiss }));
    expect(onUse).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('tras «Usar» confirma que se aplicó y deja descartar', async () => {
    await setup({ status: 'success', suggestion: SUGGESTION, categoryLabel: null, applied: true });
    expect(screen.getByText(t.applied)).toBeTruthy();
    expect(screen.queryByRole('button', { name: t.use })).toBeNull();
    expect(screen.getByRole('button', { name: t.dismiss })).toBeTruthy();
  });

  it('sin sugerencia no dibuja la tarjeta', async () => {
    await setup({ status: 'success', suggestion: null });
    expect(screen.queryByText(t.title)).toBeNull();
  });
});

describe('SuggestionBanner — error y límite', () => {
  it('el error es recuperable: aviso en español y «Reintentar» (CA-03)', async () => {
    const { onSuggest } = await setup({ status: 'error' });
    expect(screen.getByText(t.error)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: es.common.retry }));
    expect(onSuggest).toHaveBeenCalledTimes(1);
  });

  it('el límite diario muestra su mensaje y no ofrece reintentar (CA-04)', async () => {
    await setup({ status: 'limit' });
    expect(screen.getByText(t.limit)).toBeTruthy();
    expect(screen.queryByRole('button', { name: es.common.retry })).toBeNull();
  });
});
