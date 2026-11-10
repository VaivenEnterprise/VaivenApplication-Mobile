import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, sizes } from '@/theme';

const { size: SIZE, stroke: STROKE } = sizes.progressRing;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type UploadProgressProps = {
  /** Avance de 0 a 1; fuera de ese rango se recorta. */
  progress: number;
  testID?: string;
};

/** Anillo de avance que se dibuja sobre la miniatura mientras la foto sube. */
export function UploadProgress({ progress, testID }: UploadProgressProps) {
  const fraction = Math.min(1, Math.max(0, progress));
  return (
    <View
      style={styles.root}
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.surface}
          strokeOpacity={0.4}
          strokeWidth={STROKE}
          fill="none"
        />
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.surface}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
          strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
          rotation={-90}
          origin={`${SIZE / 2}, ${SIZE / 2}`}
          fill="none"
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', justifyContent: 'center' },
});
