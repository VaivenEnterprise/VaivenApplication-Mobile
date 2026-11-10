import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors, sizes } from '@/theme';

const VIEW_WIDTH = 320;
const VIEW_HEIGHT = 120;

/** Casitas, un árbol y una regadera: ilustración decorativa del pie de inicio de sesión. */
export function NeighborhoodIllustration() {
  return (
    <Svg
      testID="neighborhood-illustration"
      width="100%"
      height={sizes.illustrationHeight}
      viewBox={`0 0 ${VIEW_WIDTH} ${VIEW_HEIGHT}`}
      accessible={false}
      importantForAccessibility="no-hide-descendants"
    >
      {/* Suelo */}
      <Rect x="0" y="104" width={VIEW_WIDTH} height="16" rx="8" fill={colors.secondarySoft} />
      {/* Casa grande */}
      <Rect x="28" y="52" width="76" height="52" rx="8" fill={colors.surface} />
      <Path d="M20 56 L66 20 L112 56 Z" fill={colors.primary} />
      <Rect x="56" y="74" width="20" height="30" rx="4" fill={colors.primaryInk} />
      <Rect x="36" y="64" width="14" height="14" rx="3" fill={colors.primarySoft} />
      {/* Casa pequeña */}
      <Rect x="128" y="68" width="56" height="36" rx="6" fill={colors.surface} />
      <Path d="M122 72 L156 44 L190 72 Z" fill={colors.secondary} />
      <Rect x="148" y="84" width="16" height="20" rx="3" fill={colors.secondaryPressed} />
      {/* Árbol */}
      <Rect x="226" y="66" width="8" height="38" rx="3" fill={colors.primaryInk} />
      <Circle cx="230" cy="52" r="26" fill={colors.secondary} />
      <Circle cx="214" cy="64" r="14" fill={colors.secondaryPressed} />
      {/* Regadera */}
      <Rect x="262" y="82" width="26" height="20" rx="6" fill={colors.warning} />
      <Path d="M288 88 L304 78 L306 84 L290 96 Z" fill={colors.warning} />
      <Path
        d="M262 88 C250 88 250 100 262 100"
        stroke={colors.warning}
        strokeWidth="3"
        fill="none"
      />
    </Svg>
  );
}
