import { Pressable, StyleSheet } from 'react-native';
import { AppText } from './AppText';
import { touch } from '@/theme';

type Props = {
  label: string;
  onPress: () => void;
};

export function TextLink({ label, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      style={({ pressed }) => [styles.base, pressed && styles.pressed]}
    >
      <AppText variant="label" color="primary">
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    justifyContent: 'center',
    minHeight: touch.minSize,
  },
  pressed: {
    opacity: 0.75,
  },
});
