import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { INCIDENT_REASONS, type IncidentReason } from '@/features/incidents/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.incidents.reasons;

/** Ícono de cada motivo (conjunto cerrado de `AppIcon`). */
export const REASON_ICON: Record<IncidentReason, IconName> = {
  no_show: 'person',
  late_return: 'clock',
  damaged: 'construct',
  not_returned: 'swap',
  payment_dispute: 'cash',
  other: 'ellipsis',
};

type ReasonPickerProps = {
  value: IncidentReason | null;
  onChange: (reason: IncidentReason) => void;
};

/** Mosaicos de motivo, 2 columnas × 3 filas, con ícono y nombre corto (spec 010 §7.3). */
export function ReasonPicker({ value, onChange }: ReasonPickerProps) {
  return (
    <View accessibilityRole="radiogroup" style={styles.grid}>
      {INCIDENT_REASONS.map((reason) => {
        const selected = value === reason;
        return (
          <Pressable
            key={reason}
            accessibilityRole="radio"
            accessibilityLabel={t[reason].name}
            accessibilityHint={t[reason].hint}
            accessibilityState={{ selected }}
            onPress={() => onChange(reason)}
            style={[styles.tile, selected ? styles.on : styles.off]}
          >
            <AppIcon
              name={REASON_ICON[reason]}
              size="lg"
              color={selected ? 'onPrimary' : 'primaryInk'}
            />
            <AppText variant="label" color={selected ? 'onPrimary' : 'ink'} style={styles.name}>
              {t[reason].name}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.smd },
  tile: {
    width: sizes.reasonTile.width,
    minHeight: sizes.reasonTile.minHeight,
    padding: spacing.md,
    gap: spacing.sm,
    justifyContent: 'center',
    borderRadius: radius.lg,
    borderWidth: sizes.field.border,
  },
  off: { backgroundColor: colors.surface, borderColor: colors.fieldBorder },
  on: { backgroundColor: colors.primary, borderColor: colors.primary },
  name: { flexShrink: 1 },
});
