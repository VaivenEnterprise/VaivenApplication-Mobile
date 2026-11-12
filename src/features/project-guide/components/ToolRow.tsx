import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Button } from '@/components/ui/Button';
import { Chip } from '@/components/ui/Chip';
import { Skeleton } from '@/components/ui/Skeleton';
import { distanceLabel } from '@/features/project-guide/geometry';
import type { ToolQuery } from '@/features/project-guide/hooks';
import { DEFAULT_RADIUS_KM } from '@/features/project-guide/types';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.guide;

/** Zona aproximada del objeto: colonia o, si no hay, la alcaldía. Nunca una dirección. */
export function zoneText(zone: {
  municipality: string;
  neighborhood?: string | null | undefined;
}): string {
  return zone.neighborhood ? zone.neighborhood : zone.municipality;
}

type ToolRowProps = {
  number: number;
  name: string;
  query: ToolQuery;
  /** Hay posición: se muestran distancias. Sin ella, solo la zona. */
  located: boolean;
  selected: boolean;
  requested: boolean;
  onGet: () => void;
  onWiden: () => void;
};

/**
 * Fila de una herramienta (spec 007 §7.1): número, miniatura, nombre y quién la tiene más cerca.
 * Estados: buscando · error con «Reintentar» · «Nadie cerca» con «Ampliar» · solicitada ·
 * seleccionada (borde `secondary`, sincronizada con su pin).
 */
export function ToolRow({
  number,
  name,
  query,
  located,
  selected,
  requested,
  onGet,
  onWiden,
}: ToolRowProps) {
  const { hit } = query;

  const detail = (() => {
    if (query.isPending) {
      return (
        <View accessibilityLabel={`${t.searching} ${name}`} accessible>
          <Skeleton width="70%" />
        </View>
      );
    }
    if (query.isError) {
      return <Button label={t.retry} variant="link" onPress={query.retry} />;
    }
    if (hit === null || hit === undefined) {
      return (
        <View style={styles.nobody}>
          <AppText variant="caption" color="muted">
            {t.nobody}
          </AppText>
          {located && query.radiusKm === DEFAULT_RADIUS_KM ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${t.widenA11y}: ${name}`}
              onPress={onWiden}
              style={styles.link}
            >
              <AppText variant="label" color="primaryInk">
                {t.widen}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      );
    }
    const place = located
      ? (distanceLabel(hit.distanceKm) ?? zoneText(hit.zone))
      : zoneText(hit.zone);
    return (
      <AppText variant="caption" color="muted" numberOfLines={1}>
        {`${hit.owner.displayName} · ${place}`}
      </AppText>
    );
  })();

  const found = hit !== null && hit !== undefined && !query.isPending && !query.isError;
  return (
    <View
      style={[styles.row, selected ? styles.selected : styles.idle]}
      testID={`tool-row-${number}`}
    >
      <View style={styles.number}>
        <AppText variant="label" color="onPrimary">
          {String(number)}
        </AppText>
      </View>
      <View style={styles.thumb}>
        {found && hit.thumbUrl ? (
          <Image
            source={{ uri: hit.thumbUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            accessibilityIgnoresInvertColors
          />
        ) : (
          <AppIcon name="construct" color="muted" />
        )}
      </View>
      <View style={styles.texts}>
        <AppText variant="bodyStrong" numberOfLines={1}>
          {name}
        </AppText>
        {detail}
      </View>
      {found ? (
        requested ? (
          <Chip label={t.requested} variant="success" icon="check" />
        ) : (
          <Button label={t.getIt} accessibilityLabel={`${t.getItA11y} ${name}`} onPress={onGet} />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    padding: spacing.smd,
    borderRadius: radius.xl,
    backgroundColor: colors.surface,
    borderWidth: sizes.field.borderFocus,
  },
  idle: { borderColor: colors.surface },
  selected: { borderColor: colors.secondary },
  number: {
    width: spacing.lg,
    height: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumb: {
    width: sizes.thumb,
    height: sizes.thumb,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  texts: { flex: 1, gap: spacing.xs },
  nobody: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  link: { minHeight: sizes.touch.minSize, justifyContent: 'center' },
});
