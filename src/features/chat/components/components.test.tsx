import { fireEvent, render, screen } from '@testing-library/react-native';
import { ChatHeader } from '@/features/chat/components/ChatHeader';
import { Composer, withQuickReply } from '@/features/chat/components/Composer';
import { ConversationRow } from '@/features/chat/components/ConversationRow';
import { DaySeparator } from '@/features/chat/components/DaySeparator';
import { MessageBubble } from '@/features/chat/components/MessageBubble';
import { QuickReplies } from '@/features/chat/components/QuickReplies';
import { RejectionNotice } from '@/features/chat/components/RejectionNotice';
import type { ChatMessage } from '@/features/chat/merge';
import { es } from '@/i18n/es-MX';
import { ME, OTHER, fakeConversation } from '@/test/fakeChat';

const t = es.chat;

const NOW = new Date(2026, 10, 12, 15, 0, 0);
const at = (day: number, hour = 18, minute = 5) =>
  new Date(2026, 10, day, hour, minute, 0).toISOString();

const message = (over: Partial<ChatMessage> = {}): ChatMessage => ({
  key: 'c:1',
  id: '1',
  clientId: 'cid-1',
  senderId: OTHER,
  body: 'Nos vemos a las 5',
  createdAt: at(12),
  mine: false,
  status: 'sent',
  ...over,
});

describe('MessageBubble', () => {
  it('muestra el texto y la hora de un mensaje ajeno', async () => {
    await render(<MessageBubble message={message()} onRetry={jest.fn()} />);
    expect(screen.getByText('Nos vemos a las 5')).toBeTruthy();
    expect(screen.getByLabelText(/^Nos vemos a las 5, 6:05/)).toBeTruthy();
    expect(screen.queryByText(t.message.notSent)).toBeNull();
  });

  it('un mensaje propio lo dice a los lectores de pantalla', async () => {
    await render(<MessageBubble message={message({ mine: true })} onRetry={jest.fn()} />);
    expect(screen.getByLabelText(/^Tú, Nos vemos a las 5/)).toBeTruthy();
  });

  it('un mensaje que se está enviando lo indica', async () => {
    await render(
      <MessageBubble
        message={message({ mine: true, id: null, status: 'sending' })}
        onRetry={jest.fn()}
      />,
    );
    expect(screen.getByLabelText(/Enviando$/)).toBeTruthy();
    expect(screen.queryByText(t.message.retry)).toBeNull();
  });

  it('uno no enviado ofrece reintentar con su clientId', async () => {
    const onRetry = jest.fn();
    await render(
      <MessageBubble
        message={message({ mine: true, id: null, status: 'failed', clientId: 'cid-9' })}
        onRetry={onRetry}
      />,
    );
    expect(screen.getByText(t.message.notSent)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.message.retryA11y }));
    expect(onRetry).toHaveBeenCalledWith('cid-9');
  });

  it('un mensaje con texto de aspecto HTML se muestra tal cual, como texto', async () => {
    await render(<MessageBubble message={message({ body: '<b>hola</b>' })} onRetry={jest.fn()} />);
    expect(screen.getByText('<b>hola</b>')).toBeTruthy();
  });
});

describe('DaySeparator', () => {
  it('rotula Hoy, Ayer y la fecha corta', async () => {
    const { rerender } = await render(<DaySeparator iso={at(12, 9)} now={NOW} />);
    expect(screen.getByText('Hoy')).toBeTruthy();
    await rerender(<DaySeparator iso={at(11, 9)} now={NOW} />);
    expect(screen.getByText('Ayer')).toBeTruthy();
    await rerender(<DaySeparator iso={at(3, 9)} now={NOW} />);
    expect(screen.getByText('3 nov')).toBeTruthy();
  });
});

describe('QuickReplies y withQuickReply', () => {
  it('ofrece las cuatro respuestas y entrega el texto elegido, sin enviar', async () => {
    const onPick = jest.fn();
    await render(<QuickReplies onPick={onPick} />);
    t.quickReplies.items.forEach((text) => expect(screen.getByText(text)).toBeTruthy());
    await fireEvent.press(screen.getByRole('button', { name: 'Ya llegué' }));
    expect(onPick).toHaveBeenCalledWith('Ya llegué');
  });

  it('rellena un campo vacío y agrega al final si ya hay texto', async () => {
    expect(withQuickReply('', 'Gracias')).toBe('Gracias');
    expect(withQuickReply('   ', 'Gracias')).toBe('Gracias');
    expect(withQuickReply('Hola ', 'Gracias')).toBe('Hola Gracias');
  });

  it('nunca pasa de 1,000 caracteres', async () => {
    expect(withQuickReply('a'.repeat(998), 'Gracias')).toHaveLength(1000);
  });
});

describe('Composer', () => {
  const setup = async (over: Partial<Parameters<typeof Composer>[0]> = {}) => {
    const props = {
      value: '',
      onChangeText: jest.fn(),
      onSend: jest.fn(),
      sending: false,
      ...over,
    };
    await render(<Composer {...props} />);
    return props;
  };

  it('con el campo vacío o solo espacios el botón está deshabilitado', async () => {
    const { rerender } = await render(
      <Composer value="" onChangeText={jest.fn()} onSend={jest.fn()} sending={false} />,
    );
    expect(screen.getByRole('button', { name: t.composer.send })).toBeDisabled();
    await rerender(
      <Composer value="   " onChangeText={jest.fn()} onSend={jest.fn()} sending={false} />,
    );
    expect(screen.getByRole('button', { name: t.composer.send })).toBeDisabled();
  });

  it('con texto envía al pulsar', async () => {
    const props = await setup({ value: 'Hola' });
    const send = screen.getByRole('button', { name: t.composer.send });
    expect(send).toBeEnabled();
    await fireEvent.press(send);
    expect(props.onSend).toHaveBeenCalledTimes(1);
  });

  it('se bloquea mientras se envía', async () => {
    const props = await setup({ value: 'Hola', sending: true });
    const send = screen.getByRole('button', { name: t.composer.send });
    expect(send).toBeDisabled();
    await fireEvent.press(send);
    expect(props.onSend).not.toHaveBeenCalled();
  });

  it('escribir avisa del cambio y el campo limita a 1,000 caracteres', async () => {
    const props = await setup();
    const field = screen.getByLabelText(t.composer.fieldLabel);
    await fireEvent.changeText(field, 'Hola');
    expect(props.onChangeText).toHaveBeenCalledWith('Hola');
    expect(field.props.maxLength).toBe(1000);
  });

  it('el contador aparece a partir de 900 caracteres', async () => {
    const { rerender } = await render(
      <Composer
        value={'a'.repeat(899)}
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        sending={false}
      />,
    );
    expect(screen.queryByText(/ \/ 1000/)).toBeNull();
    await rerender(
      <Composer
        value={'a'.repeat(900)}
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        sending={false}
      />,
    );
    expect(screen.getByText(`900 / 1000 ${t.composer.counter}`)).toBeTruthy();
    await rerender(
      <Composer
        value={'a'.repeat(1000)}
        onChangeText={jest.fn()}
        onSend={jest.fn()}
        sending={false}
      />,
    );
    expect(screen.getByText(`1000 / 1000 ${t.composer.counter}`)).toBeTruthy();
  });

  it('una respuesta rápida rellena el campo pero no envía (RF-11)', async () => {
    const props = await setup({ value: '' });
    await fireEvent.press(screen.getByRole('button', { name: '¿A qué hora?' }));
    expect(props.onChangeText).toHaveBeenCalledWith('¿A qué hora?');
    expect(props.onSend).not.toHaveBeenCalled();
  });
});

describe('RejectionNotice', () => {
  it('moderación: muestra el motivo del servidor y se puede cerrar', async () => {
    const onDismiss = jest.fn();
    await render(
      <RejectionNotice
        rejection={{ kind: 'moderation', reason: 'contiene datos de contacto' }}
        onDismiss={onDismiss}
      />,
    );
    expect(screen.getByText(t.notice.moderationTitle)).toBeTruthy();
    expect(screen.getByText('contiene datos de contacto')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: t.notice.dismiss }));
    expect(onDismiss).toHaveBeenCalled();
  });

  it('moderación sin motivo usa un texto genérico', async () => {
    await render(
      <RejectionNotice rejection={{ kind: 'moderation', reason: null }} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText(t.notice.moderationFallback)).toBeTruthy();
  });

  it('ritmo y conversación cerrada usan un aviso corto', async () => {
    const { rerender } = await render(
      <RejectionNotice rejection={{ kind: 'rate_limited' }} onDismiss={jest.fn()} />,
    );
    expect(screen.getByText(t.notice.slowDown)).toBeTruthy();
    await rerender(<RejectionNotice rejection={{ kind: 'closed' }} onDismiss={jest.fn()} />);
    expect(screen.getByText(t.notice.closed)).toBeTruthy();
  });
});

describe('ChatHeader', () => {
  it('muestra a la otra persona, el objeto y el estado; tocarlo abre la reserva', async () => {
    const onOpenBooking = jest.fn();
    const onBack = jest.fn();
    await render(
      <ChatHeader
        conversation={fakeConversation()}
        onBack={onBack}
        onOpenBooking={onOpenBooking}
      />,
    );
    expect(screen.getByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Aceptada')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: /Ver reserva$/ }));
    expect(onOpenBooking).toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: es.common.back }));
    expect(onBack).toHaveBeenCalled();
  });

  it('con la foto del objeto no muestra el ícono de caja', async () => {
    const conversation = fakeConversation({
      item: { id: 'i', title: 'Escalera', thumbUrl: 'https://img.test/e.jpg' },
    });
    await render(
      <ChatHeader conversation={conversation} onBack={jest.fn()} onOpenBooking={jest.fn()} />,
    );
    expect(screen.getByText('Escalera')).toBeTruthy();
  });
});

describe('ConversationRow', () => {
  const open = jest.fn();
  beforeEach(() => open.mockReset());

  it('muestra nombre, objeto, último mensaje y hora', async () => {
    const conversation = fakeConversation({
      lastMessage: { preview: 'Nos vemos a las 5', at: at(12, 9), senderId: OTHER },
    });
    await render(
      <ConversationRow conversation={conversation} currentUserId={ME} onPress={open} now={NOW} />,
    );
    expect(screen.getByText('Luis Pérez')).toBeTruthy();
    expect(screen.getByText('Taladro percutor')).toBeTruthy();
    expect(screen.getByText('Nos vemos a las 5')).toBeTruthy();
    expect(screen.getByText(/^9:05/)).toBeTruthy();
    await fireEvent.press(screen.getByRole('button'));
    expect(open).toHaveBeenCalledWith(conversation);
  });

  it('antepone «Tú:» a mis mensajes y dice «Ayer» a los de ayer', async () => {
    const conversation = fakeConversation({
      lastMessage: { preview: 'Gracias', at: at(11, 9), senderId: ME },
    });
    await render(
      <ConversationRow conversation={conversation} currentUserId={ME} onPress={open} now={NOW} />,
    );
    expect(screen.getByText('Tú: Gracias')).toBeTruthy();
    expect(screen.getByText('Ayer')).toBeTruthy();
  });

  it('con no leídos muestra el contador y lo dice al lector de pantalla', async () => {
    await render(
      <ConversationRow
        conversation={fakeConversation({ unreadCount: 3 })}
        currentUserId={ME}
        onPress={open}
        now={NOW}
      />,
    );
    expect(screen.getByText('3')).toBeTruthy();
    expect(screen.getByRole('button', { name: /3 sin leer/ })).toBeTruthy();
  });

  it('más de 99 no leídos se abrevia', async () => {
    await render(
      <ConversationRow
        conversation={fakeConversation({ unreadCount: 120 })}
        currentUserId={null}
        onPress={open}
        now={NOW}
      />,
    );
    expect(screen.getByText('99+')).toBeTruthy();
  });

  it('una conversación cerrada lo indica y sin mensajes dice «Sin mensajes todavía»', async () => {
    await render(
      <ConversationRow
        conversation={fakeConversation({ canWrite: false, lastMessage: null })}
        currentUserId={ME}
        onPress={open}
        now={NOW}
      />,
    );
    expect(screen.getByText(t.list.noMessages)).toBeTruthy();
    expect(screen.getByRole('button', { name: new RegExp(t.list.closed) })).toBeTruthy();
  });
});
