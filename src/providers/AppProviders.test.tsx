import { useQueryClient } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AppProviders } from '@/providers/AppProviders';

function Probe() {
  const client = useQueryClient();
  return <Text>{`stale:${client.getDefaultOptions().queries?.staleTime}`}</Text>;
}

describe('AppProviders', () => {
  it('provee un QueryClient con la configuración de la app a sus hijos', async () => {
    await render(
      <AppProviders>
        <Probe />
      </AppProviders>,
    );
    expect(screen.getByText('stale:30000')).toBeTruthy();
  });
});
