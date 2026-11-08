import { StyleSheet, View } from 'react-native';
import { AppText, ToolIcon } from '@/components/ui';
import { spacing } from '@/theme';

type Props = {
  name: string;
};

export function KitItem({ name }: Props) {
  return (
    <View style={styles.item}>
      <ToolIcon name={name} />
      <AppText variant="caption" align="center">
        {name}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  item: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
});
