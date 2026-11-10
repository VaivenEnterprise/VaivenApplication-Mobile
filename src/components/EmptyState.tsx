import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import type { IconName } from '@/components/ui/AppIcon';
import { IconBadge } from '@/components/ui/IconBadge';
import { spacing } from '@/theme';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** Versión pequeña para secciones dentro de una pantalla. */
  compact?: boolean;
};

/** Estado vacío: ícono, título, texto opcional y una acción opcional. */
export function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <View style={[styles.root, compact && styles.compact]}>
      <IconBadge icon={icon} size={compact ? 'md' : 'lg'} />
      <AppText variant={compact ? 'subheading' : 'heading'} style={styles.centered}>
        {title}
      </AppText>
      {description === undefined ? null : (
        <AppText color="muted" style={styles.centered}>
          {description}
        </AppText>
      )}
      {actionLabel !== undefined && onAction !== undefined ? (
        <Button label={actionLabel} onPress={onAction} variant="outline" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center', gap: spacing.smd, padding: spacing.lg },
  compact: { padding: spacing.md },
  centered: { textAlign: 'center' },
});
