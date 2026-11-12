import * as Location from 'expo-location';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import type { ApproxLocation } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.items.form;

type LocationFieldProps = {
  value: ApproxLocation | null;
  onChange: (value: ApproxLocation | null) => void;
};

/**
 * «Usar mi ubicación» (plan P-06, RF-05): pide el permiso al usarse, con precisión baja. Es
 * opcional; la UI aclara que solo se muestra una zona aproximada (el servidor redondea).
 */
export function LocationField({ value, onChange }: LocationFieldProps) {
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const locate = async () => {
    setBusy(true);
    setProblem(null);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setProblem(t.locationDenied);
        return;
      }
      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Low,
      });
      onChange({ lat: position.coords.latitude, lng: position.coords.longitude });
    } catch {
      setProblem(t.locationFailed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.useLocation}
          accessibilityState={{ busy, disabled: busy }}
          disabled={busy}
          onPress={() => void locate()}
          style={styles.chip}
        >
          <AppIcon name="pin" size="sm" color="primaryInk" />
          <AppText variant="label" color="primaryInk">
            {busy ? t.locating : t.useLocation}
          </AppText>
        </Pressable>
        {value === null ? null : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.locationRemove}
            onPress={() => onChange(null)}
            style={styles.remove}
          >
            <AppIcon name="close" size="sm" color="muted" />
          </Pressable>
        )}
      </View>
      <AppText variant="caption" color="muted">
        {value === null ? t.locationApprox : `${t.locationSet}. ${t.locationApprox}`}
      </AppText>
      {problem === null ? null : (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {problem}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  chip: {
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
  },
  remove: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
