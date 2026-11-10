import { StyleSheet } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import type { IconName } from '@/components/ui/AppIcon';
import { Screen } from '@/components/ui/Screen';
import { es } from '@/i18n/es-MX';

type PlaceholderScreenProps = {
  icon: IconName;
  title: string;
};

/** Pantalla marcador de una pestaña o ruta que aún no tiene su spec: ícono, nombre y «Próximamente». */
export function PlaceholderScreen({ icon, title }: PlaceholderScreenProps) {
  return (
    <Screen scroll={false} contentStyle={styles.center}>
      <EmptyState icon={icon} title={title} description={es.tabs.soon} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center' },
});
