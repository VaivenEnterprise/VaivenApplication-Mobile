import { StyleSheet, View } from 'react-native';
import { colors, spacing } from '@/theme';
import { AppText } from './AppText';

type DividerProps = {
  /** Texto central opcional («o»). */
  label?: string;
};

const LINE_WIDTH = StyleSheet.hairlineWidth;

export function Divider({ label }: DividerProps) {
  if (label === undefined) {
    return <View style={styles.line} />;
  }
  return (
    <View style={styles.row}>
      <View style={[styles.line, styles.grow]} />
      <AppText variant="caption" color="muted">
        {label}
      </AppText>
      <View style={[styles.line, styles.grow]} />
    </View>
  );
}

const styles = StyleSheet.create({
  line: { height: LINE_WIDTH, backgroundColor: colors.border, alignSelf: 'stretch' },
  grow: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
});
