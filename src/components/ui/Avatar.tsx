import { Image, StyleSheet, View } from 'react-native';
import { AppText } from './AppText';
import { colors } from '@/theme';

type Props = {
  name: string;
  size?: number;
  uri?: string;
};

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  const first = parts[0]?.[0] ?? '';
  const second = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';

  return `${first}${second}`.toUpperCase();
}

export function Avatar({ name, size = 44, uri }: Props) {
  if (uri) {
    return (
      <Image
        accessibilityLabel={name}
        source={{ uri }}
        style={{ borderRadius: size / 2, height: size, width: size }}
      />
    );
  }

  return (
    <View
      accessibilityLabel={name}
      style={[styles.fallback, { borderRadius: size / 2, height: size, width: size }]}
    >
      <AppText variant="bodyBold" color="primary">
        {getInitials(name)}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    justifyContent: 'center',
  },
});
