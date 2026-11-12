import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, Rect } from 'react-native-svg';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import {
  displayRadiusM,
  placePins,
  type LatLng,
  type PinInput,
} from '@/features/project-guide/geometry';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.guide;
const map = sizes.neighborhoodMap;

// Esquema fijo en un lienzo de 100 × 60: manzanas, dos calles y un parque. No es un mapa real.
const VIEW = { width: 100, height: 60 } as const;
const BLOCKS = [
  { x: 4, y: 4, w: 28, h: 16 },
  { x: 40, y: 4, w: 22, h: 16 },
  { x: 70, y: 4, w: 26, h: 16 },
  { x: 4, y: 34, w: 22, h: 22 },
  { x: 70, y: 34, w: 26, h: 22 },
] as const;
const PARK = { x: 34, y: 38, w: 28, h: 18 } as const;

export type MapPin = PinInput & {
  /** Número que se dibuja en el pin (1, 2, 3…). */
  number: number;
  /** Texto accesible: «Herramienta 1: Taladro, ~300 m». */
  label: string;
  /** Zona aproximada que se muestra bajo el pin. */
  zone?: string | undefined;
};

type NeighborhoodMapProps = {
  /** Posición del usuario, solo para calcular desplazamientos; nunca se dibuja una coordenada. */
  origin: LatLng;
  pins: readonly MapPin[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

/**
 * Mapa esquemático del vecindario (spec 007 §7.2): «Tú» al centro y un pin numerado por objeto,
 * escalado para que el más lejano quede al 80 % del radio. Sin teselas, claves ni coordenadas
 * exactas. Un pin sin ubicación aproximada no se dibuja. Es una ayuda visual: la información
 * completa está en las filas y cada pin tiene su etiqueta accesible.
 */
export function NeighborhoodMap({ origin, pins, selectedId, onSelect }: NeighborhoodMapProps) {
  const placed = placePins(origin, pins);
  const byId = new Map(pins.map((pin) => [pin.id, pin]));
  const radiusM = displayRadiusM(placed);

  return (
    <View style={styles.root} testID="neighborhood-map">
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
        preserveAspectRatio="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={StyleSheet.absoluteFill}
      >
        <Rect x={0} y={0} width={VIEW.width} height={VIEW.height} fill={colors.mapLand} />
        {BLOCKS.map((block) => (
          <Rect
            key={`${block.x}-${block.y}`}
            x={block.x}
            y={block.y}
            width={block.w}
            height={block.h}
            rx={2}
            fill={colors.mapBlock}
          />
        ))}
        <Rect x={0} y={25} width={VIEW.width} height={6} fill={colors.mapRoad} />
        <Rect x={64} y={0} width={5} height={VIEW.height} fill={colors.mapRoad} />
        <Rect x={PARK.x} y={PARK.y} width={PARK.w} height={PARK.h} rx={3} fill={colors.mapPark} />
        <Circle cx={VIEW.width / 2} cy={VIEW.height / 2} r={1.6} fill={colors.userDot} />
      </Svg>

      <View style={styles.you} pointerEvents="none">
        <AppText variant="caption" color="ink">
          {t.you}
        </AppText>
      </View>

      {placed.map((pin) => {
        const info = byId.get(pin.id);
        if (info === undefined) return null;
        const selected = pin.id === selectedId;
        return (
          <Pressable
            key={pin.id}
            accessibilityRole="button"
            accessibilityLabel={info.label}
            accessibilityState={{ selected }}
            onPress={() => onSelect(pin.id)}
            style={[styles.touch, { left: `${50 + pin.x * 50}%`, top: `${50 + pin.y * 50}%` }]}
          >
            <View style={[styles.pin, selected ? styles.pinSelected : styles.pinIdle]}>
              <AppText variant="label" color="onPrimary">
                {String(info.number)}
              </AppText>
            </View>
            {info.zone === undefined ? null : (
              <AppText variant="caption" color="ink" numberOfLines={1} style={styles.zone}>
                {info.zone}
              </AppText>
            )}
          </Pressable>
        );
      })}

      <View style={styles.radius}>
        <Chip label={`${t.radius} < ${radiusM} ${t.radiusUnit}`} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    height: map.height,
    borderRadius: radius.xl,
    overflow: 'hidden',
    backgroundColor: colors.mapLand,
  },
  you: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginTop: map.userDot,
    marginLeft: -map.userDot,
  },
  touch: {
    position: 'absolute',
    width: map.pinTouch,
    minHeight: map.pinTouch,
    marginLeft: -map.pinTouch / 2,
    marginTop: -map.pinTouch / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pin: {
    width: map.pin,
    height: map.pin,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinIdle: { backgroundColor: colors.primary },
  pinSelected: { backgroundColor: colors.secondary },
  zone: { marginTop: spacing.xs },
  radius: { position: 'absolute', right: spacing.sm, bottom: spacing.sm },
});
