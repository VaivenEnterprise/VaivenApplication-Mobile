import type { ReactNode } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { AppText } from './AppText';
import { borders, colors, radius, spacing, touch, typography } from '@/theme';

type Props = TextInputProps & {
  label: string;
  error?: string;
  rightAccessory?: ReactNode;
};

export function TextField({ label, error, rightAccessory, style, ...rest }: Props) {
  const { accessibilityHint, accessibilityLabel = label, ...inputProps } = rest;

  return (
    <View style={styles.container}>
      <AppText variant="label">{label}</AppText>
      <View style={[styles.inputWrap, error ? styles.inputError : undefined]}>
        <TextInput
          {...inputProps}
          accessibilityHint={error ?? accessibilityHint}
          accessibilityLabel={accessibilityLabel}
          placeholderTextColor={colors.muted}
          style={[styles.input, style]}
        />
        {rightAccessory}
      </View>
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="caption" color="danger">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  input: {
    color: colors.ink,
    flex: 1,
    fontSize: typography.body.fontSize,
    lineHeight: typography.body.lineHeight,
    minHeight: touch.minSize,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.danger,
  },
  inputWrap: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: borders.width,
    flexDirection: 'row',
  },
});
