import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ErrorState } from '@/components/ui/ErrorState';
import { IconBadge } from '@/components/ui/IconBadge';
import { LoadingState } from '@/components/ui/LoadingState';
import { Screen } from '@/components/ui/Screen';
import { NotificationRow } from '@/features/notifications/components/NotificationRow';
import { PushToggle } from '@/features/notifications/components/PushToggle';
import { groupByDay } from '@/features/notifications/format';
import {
  useMarkNotificationsRead,
  useNotifications,
  useUnreadCount,
} from '@/features/notifications/hooks';
import { hrefForData } from '@/features/notifications/routing';
import { kindOf, type AppNotification } from '@/features/notifications/types';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.notifications;

/**
 * Centro de avisos (spec 011 §7.1, RF-01, RF-05, RF-08, CA-01): lista paginada y agrupada por día;
 * tocar un aviso lo marca leído y abre su destino. Los avisos de contenido retirado o sanción abren
 * una tarjeta con su texto y, si procede, el enlace a la incidencia. Incluye el interruptor de
 * avisos del teléfono (RF-09) y «Marcar todas como leídas».
 */
export function NotificationsScreen() {
  const router = useRouter();
  const query = useNotifications();
  const unread = useUnreadCount();
  const markRead = useMarkNotificationsRead();
  const [detail, setDetail] = useState<AppNotification | null>(null);

  const items = useMemo(() => query.data?.pages.flatMap((page) => page.items) ?? [], [query.data]);
  const sections = useMemo(() => groupByDay(items), [items]);
  const hasUnread = (unread.data ?? 0) > 0 || items.some((item) => item.readAt === null);

  const open = (notification: AppNotification) => {
    if (notification.readAt === null) markRead.mutate({ ids: [notification.id] });
    if (kindOf(notification.type) === 'moderation') {
      setDetail(notification);
      return;
    }
    const href = hrefForData(notification.data);
    if (href !== null) router.push(href);
  };

  const closeDetail = () => setDetail(null);
  const incidentId = detail?.data.incidentId;

  return (
    <Screen>
      <View style={styles.topBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.center.back}
          onPress={() => router.back()}
          style={styles.round}
        >
          <AppIcon name="arrowBack" />
        </Pressable>
        <AppText variant="title" accessibilityRole="header" style={styles.title}>
          {t.center.title}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.center.markAll}
          accessibilityState={{ disabled: !hasUnread || markRead.isPending }}
          disabled={!hasUnread || markRead.isPending}
          onPress={() => markRead.mutate({ all: true })}
          style={styles.round}
        >
          <AppIcon name="doneAll" color={hasUnread ? 'primaryInk' : 'muted'} />
        </Pressable>
      </View>

      <Card>
        <PushToggle />
      </Card>

      {markRead.isError ? <Banner variant="warning" message={t.center.markFailed} /> : null}

      {query.isPending ? (
        <LoadingState variant="card" label={es.common.loading} />
      ) : query.isError && items.length === 0 ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : items.length === 0 ? (
        <EmptyState
          icon="bell"
          title={t.center.emptyTitle}
          description={t.center.emptyDescription}
        />
      ) : (
        <View style={styles.list}>
          {sections.map((section) => (
            <View key={`${section.key}-${section.data[0]?.id ?? ''}`} style={styles.section}>
              <AppText variant="eyebrow" color="muted" accessibilityRole="header">
                {section.title}
              </AppText>
              {section.data.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} onPress={open} />
              ))}
            </View>
          ))}
          {query.hasNextPage ? (
            <Button
              label={t.center.loadMore}
              variant="outline"
              loading={query.isFetchingNextPage}
              onPress={() => void query.fetchNextPage()}
            />
          ) : null}
        </View>
      )}

      <BottomSheet
        visible={detail !== null}
        onClose={closeDetail}
        title={t.detail.title}
        footer={<Button label={t.detail.done} onPress={closeDetail} />}
      >
        {detail === null ? null : (
          <View style={styles.detail}>
            <IconBadge icon="shield" tone="danger" size="lg" />
            <View style={styles.detailCard}>
              <AppText variant="bodyStrong">{detail.title}</AppText>
              <AppText color="muted">{detail.body}</AppText>
            </View>
            {incidentId === undefined ? null : (
              <Button
                label={t.detail.viewIncident}
                variant="link"
                onPress={() => {
                  closeDetail();
                  router.push(routes.incident(incidentId));
                }}
              />
            )}
          </View>
        )}
      </BottomSheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  title: { flex: 1 },
  round: {
    width: sizes.touch.minSize,
    height: sizes.touch.minSize,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { gap: spacing.md },
  section: { gap: spacing.xs },
  detail: { alignItems: 'center', gap: spacing.md, paddingBottom: spacing.md },
  detailCard: {
    alignSelf: 'stretch',
    gap: spacing.xs,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.md,
    padding: spacing.md,
  },
});
