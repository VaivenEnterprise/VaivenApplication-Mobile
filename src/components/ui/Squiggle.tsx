import Svg, { Path } from 'react-native-svg';
import { colors } from '@/theme';

// Geometría del subrayado ondulado del título de bienvenida (diseño de la spec §9).
const WIDTH = 132;
const HEIGHT = 14;
const STROKE_WIDTH = 4;
const PATH = 'M3 8 C 14 1, 22 1, 33 8 S 52 15, 63 8 S 82 1, 93 8 S 112 15, 129 6';

/** Subrayado ondulado decorativo. */
export function Squiggle() {
  return (
    <Svg
      width={WIDTH}
      height={HEIGHT}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      fill="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Path d={PATH} stroke={colors.primary} strokeWidth={STROKE_WIDTH} strokeLinecap="round" />
    </Svg>
  );
}
