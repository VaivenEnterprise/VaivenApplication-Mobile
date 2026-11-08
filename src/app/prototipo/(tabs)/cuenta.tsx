import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Card, EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { useRequests } from '@/features/requests/hooks';
import { esMX as t } from '@/i18n/es-MX';
import { sizes, spacing } from '@/theme';

export default function AccountScreen() {
  const router = useRouter();
  const { signInAsMariana, signOut, user } = useAuth();
  const { acceptRequest, rejectRequest, requests } = useRequests();

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppText variant="title">{t.account.title}</AppText>

      {user ? (
        <Card>
          <View style={styles.profile}>
            <View style={styles.profileHeader}>
              <Avatar name={user.name} size={sizes.avatar} />
              <View style={styles.profileInfo}>
                <AppText variant="subtitle">{user.name}</AppText>
                <AppText variant="caption" color="muted">
                  {t.account.signedInAs}
                </AppText>
                <AppText variant="caption" color="muted">
                  {user.email}
                </AppText>
              </View>
            </View>
            <Button label={t.auth.signOut} variant="secondary" onPress={signOut} />
          </View>
        </Card>
      ) : (
        <Card>
          <View style={styles.guest}>
            <AppText variant="subtitle">{t.account.guestTitle}</AppText>
            <AppText color="muted">{t.account.guestSubtitle}</AppText>
            <Button label={t.auth.signIn} onPress={signInAsMariana} />
            <Button
              label={t.auth.createAccount}
              variant="secondary"
              onPress={() => router.push('/prototipo/register')}
            />
            <Button
              label={t.auth.signInLink}
              variant="ghost"
              onPress={() => router.push('/prototipo/login')}
            />
            <AppText variant="caption" color="muted">
              {t.account.guestHint}
            </AppText>
          </View>
        </Card>
      )}

      <View style={styles.section}>
        <AppText variant="subtitle">{t.account.requestsTitle}</AppText>
        {requests.length === 0 ? (
          <EmptyState title={t.account.requestsTitle} message={t.account.requestsEmpty} />
        ) : (
          <View style={styles.list}>
            {requests.map((request) => (
              <RequestCard
                key={request.id}
                request={request}
                onAccept={() => acceptRequest(request.id)}
                onReject={() => rejectRequest(request.id)}
              />
            ))}
          </View>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  guest: {
    gap: spacing.md,
  },
  list: {
    gap: spacing.sm,
  },
  profile: {
    gap: spacing.md,
  },
  profileHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  profileInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
});
