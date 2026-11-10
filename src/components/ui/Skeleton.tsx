import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, type DimensionValue } from 'react-native';
import { colors, motion, radius, sizes, spacing } from '@/theme';

export type SkeletonShape = 'line' | 'card' | 'circle';

type SkeletonProps = {
  shape?: SkeletonShape;
  /** Ancho de `line` y `card`; en `circle` es el diámetro. */
  width?: DimensionValue;
};

const LINE_HEIGHT = spacing.md;
const CARD_HEIGHT = sizes.thumbLg * 2;
const PULSE_FROM = 0.5;

/** `true` si el sistema pide reducir el movimiento; `null` mientras aún no se sabe. */
function useReduceMotion(): boolean | null {
  const [reduce, setReduce] = useState<boolean | null>(null);
  useEffect(() => {
    let active = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (active) setReduce(value);
    });
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);
  return reduce;
}

/** Bloque de carga con la forma del contenido; late suavemente salvo que se pida reducir movimiento. */
export function Skeleton({ shape = 'line', width }: SkeletonProps) {
  const reduceMotion = useReduceMotion();
  const [opacity] = useState(() => new Animated.Value(1));

  useEffect(() => {
    // Sin la preferencia conocida, o si pide menos movimiento, el bloque queda quieto.
    if (reduceMotion !== false) {
      opacity.setValue(1);
      return undefined;
    }
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: PULSE_FROM,
          duration: motion.duration.skeleton,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: motion.duration.skeleton,
          useNativeDriver: true,
        }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [reduceMotion, opacity]);

  const box =
    shape === 'circle'
      ? { width: width ?? sizes.thumb, height: width ?? sizes.thumb, borderRadius: radius.pill }
      : shape === 'card'
        ? { width: width ?? '100%', height: CARD_HEIGHT, borderRadius: radius.xl }
        : { width: width ?? '100%', height: LINE_HEIGHT, borderRadius: radius.sm };

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.block, box, { opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.surfaceMuted },
});
