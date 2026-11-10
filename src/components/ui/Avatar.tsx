import { StyleSheet, View } from 'react-native';
import { colors, radius, sizes, spacing } from '@/theme';
import { AppText, type ColorToken, type TextVariant } from './AppText';

export type AvatarSize = 'sm' | 'md' | 'lg';

// Paleta cerrada: el color depende solo del nombre, así que no cambia entre renders.
const PALETTE: readonly { background: ColorToken; ink: ColorToken }[] = [
  { background: 'primarySoft', ink: 'primaryInk' },
  { background: 'secondarySoft', ink: 'secondaryPressed' },
  { background: 'warningSoft', ink: 'warning' },
  { background: 'surfaceMuted', ink: 'ink' },
];

const DIAMETER: Record<AvatarSize, number> = {
  sm: spacing.xl,
  md: sizes.brandTile,
  lg: sizes.thumbLg,
};
const LETTER: Record<AvatarSize, TextVariant> = { sm: 'label', md: 'bodyStrong', lg: 'title' };

function paletteFor(name: string) {
  let sum = 0;
  for (const char of name) sum += char.codePointAt(0) ?? 0;
  return PALETTE[sum % PALETTE.length] ?? PALETTE[0]!;
}

type AvatarProps = {
  name: string;
  size?: AvatarSize;
};

/** Círculo con la inicial de la persona y un color estable por nombre. */
export function Avatar({ name, size = 'md' }: AvatarProps) {
  const palette = paletteFor(name);
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={name}
      style={[
        styles.circle,
        {
          width: DIAMETER[size],
          height: DIAMETER[size],
          backgroundColor: colors[palette.background],
        },
      ]}
    >
      <AppText variant={LETTER[size]} color={palette.ink}>
        {initial}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: { borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
});
