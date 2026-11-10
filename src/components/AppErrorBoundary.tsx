import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet } from 'react-native';
import { ErrorState } from '@/components/ui/ErrorState';
import { Screen } from '@/components/ui/Screen';
import { spacing } from '@/theme';

type AppErrorBoundaryProps = { children: ReactNode };
type AppErrorBoundaryState = { hasError: boolean };

/** Captura errores de renderizado y ofrece reintentar (RF-10). */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, _info: ErrorInfo): void {
    // Solo el tipo de error: el mensaje o la pila podrían contener datos personales (Art. VIII).
    console.error(`[AppErrorBoundary] ${error.name}`);
  }

  private readonly retry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (!this.state.hasError) return this.props.children;
    return (
      <Screen scroll={false} contentStyle={styles.center}>
        <ErrorState error={null} onRetry={this.retry} />
      </Screen>
    );
  }
}

const styles = StyleSheet.create({
  center: { justifyContent: 'center', paddingVertical: spacing.xl },
});
