import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { RatingStars } from '@/components/ui/RatingStars';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { usePublicUser } from '@/features/profile/hooks';
import type { PublicUser } from '@/features/profile/schemas';
import { es } from '@/i18n/es-MX';
import { formatMonthYear } from '@/lib/format/date';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.profile.publicProfile;

type PublicProfileScreenProps = {
  id: string;
  /** Tarjeta de reputación y comentarios (spec 010). Sin ella se muestra el resumen básico. */
  renderReputation?: (user: PublicUser) => ReactNode;
  /** Acción del encabezado «⋯» (spec 011: «Reportar»). */
  renderHeaderAction?: (user: PublicUser) => ReactNode;
};

/** Perfil público de otra persona (spec 003 §7.11): nombre, antigüedad y reputación. */
export function PublicProfileScreen({
  id,
  renderReputation,
  renderHeaderAction,
}: PublicProfileScreenProps) {
  const router = useRouter();
  const { data: user, isPending, error, refetch } = usePublicUser(id);

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.common.back}
          onPress={() => router.back()}
          style={styles.round}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        {user === undefined ? null : renderHeaderAction?.(user)}
      </View>

      {isPending ? (
        <View accessible accessibilityLabel={es.common.loading} style={styles.loading}>
          <Skeleton shape="circle" width={sizes.thumbLg} />
          <Skeleton width="50%" />
          <Skeleton width="35%" />
        </View>
      ) : error !== null ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <>
          <View style={styles.header}>
            <Avatar name={user.displayName} size="lg" />
            <AppText variant="title" accessibilityRole="header" style={styles.centered}>
              {user.displayName}
            </AppText>
            <AppText variant="caption" color="muted">
              {`${es.profile.memberSince} ${formatMonthYear(user.memberSince)}`}
            </AppText>
          </View>
          {renderReputation === undefined ? (
            <ReputationSummary user={user} />
          ) : (
            renderReputation(user)
          )}
        </>
      )}
    </Screen>
  );
}

function ReputationSummary({ user }: { user: PublicUser }) {
  if (user.ratingAverage === null || user.ratingCount === 0) {
    return <EmptyState compact icon="starOutline" title={t.noRatings} />;
  }
  return (
    <Card style={styles.reputation}>
      <AppText variant="display">{user.ratingAverage.toFixed(1)}</AppText>
      <RatingStars value={user.ratingAverage} />
      <AppText variant="caption" color="muted">
        {`${user.ratingCount} ${t.ratings}`}
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loading: { alignItems: 'center', gap: spacing.smd },
  header: { alignItems: 'center', gap: spacing.xs },
  centered: { textAlign: 'center' },
  reputation: { alignItems: 'center', gap: spacing.sm },
});
