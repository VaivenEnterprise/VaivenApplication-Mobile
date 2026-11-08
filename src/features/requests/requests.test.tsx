import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text, View } from 'react-native';
import { esMX as t } from '@/i18n/es-MX';
import type { ToolRequest } from '@/lib/domain/models';
import { useRequests } from './hooks';

function RequestProbe() {
  const { acceptRequest, rejectRequest, requests } = useRequests();

  return (
    <>
      {requests.map((request: ToolRequest) => (
        <View key={request.id}>
          <Text testID={`status-${request.id}`}>{request.status}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => acceptRequest(request.id)}
            testID={`accept-${request.id}`}
          >
            <Text>{t.requests.accept}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => rejectRequest(request.id)}
            testID={`reject-${request.id}`}
          >
            <Text>{t.requests.reject}</Text>
          </Pressable>
        </View>
      ))}
    </>
  );
}

describe('useRequests', () => {
  it('acepta una solicitud pendiente', async () => {
    await render(<RequestProbe />);

    expect(screen.getByTestId('status-request-m').props.children).toBe('pending');
    await fireEvent.press(screen.getByTestId('accept-request-m'));
    expect(screen.getByTestId('status-request-m').props.children).toBe('accepted');
  });

  it('rechaza una solicitud pendiente', async () => {
    await render(<RequestProbe />);

    await fireEvent.press(screen.getByTestId('reject-request-m'));
    expect(screen.getByTestId('status-request-m').props.children).toBe('rejected');
  });
});
