import { Text, type TextProps } from 'react-native';
import { colors, typography } from '@/theme';

export type TextVariant = keyof typeof typography;
export type ColorToken = keyof typeof colors;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: ColorToken;
};

/** Texto de la app: la variante fija familia, tamaño e interlineado (nunca `fontWeight` suelto). */
export function AppText({ variant = 'body', color = 'ink', style, ...rest }: AppTextProps) {
  return <Text {...rest} style={[typography[variant], { color: colors[color] }, style]} />;
}
