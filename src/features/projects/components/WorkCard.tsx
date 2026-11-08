import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { AppText, Card } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import type { CompletedWork } from '@/lib/domain/models';
import { colors, radius, sizes, spacing } from '@/theme';

type Props = {
  work: CompletedWork;
};

export function WorkCard({ work }: Props) {
  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.icon}>
          <Ionicons color={colors.success} name="checkmark" size={sizes.iconSmall} />
        </View>
        <View style={styles.info}>
          <AppText variant="bodyBold">{work.title}</AppText>
          <AppText variant="caption" color="muted">
            {t.home.completedAgo(work.completedDaysAgo)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  icon: {
    alignItems: 'center',
    backgroundColor: colors.successSoft,
    borderRadius: radius.pill,
    height: sizes.iconLarge,
    justifyContent: 'center',
    width: sizes.iconLarge,
  },
  info: {
    flex: 1,
    gap: spacing.xs,
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
});
