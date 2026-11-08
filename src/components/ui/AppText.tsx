import { Text, type TextProps } from 'react-native';
import { colors, typography } from '@/theme';

type Variant = keyof typeof typography;
type TextColor =
  | 'ink'
  | 'muted'
  | 'primary'
  | 'onPrimary'
  | 'danger'
  | 'success'
  | 'warning'
  | 'background'
  | 'surface';

type Props = TextProps & {
  variant?: Variant;
  color?: TextColor;
  align?: 'left' | 'center' | 'right';
};

export function AppText({ variant = 'body', color = 'ink', align, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[typography[variant], { color: colors[color], textAlign: align }, style]}
    />
  );
}
