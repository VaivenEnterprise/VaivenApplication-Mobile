import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Button, EmptyState, Screen } from '@/components/ui';
import { useProjectDetail } from '@/features/projects/hooks';
import { RequestCard } from '@/features/requests/components/RequestCard';
import { useRequests } from '@/features/requests/hooks';
import { NeighborMap, type Neighbor } from '@/features/tools/components/NeighborMap';
import { ProjectToolRow } from '@/features/tools/components/ProjectToolRow';
import { esMX as t } from '@/i18n/es-MX';
import { spacing } from '@/theme';

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { project, tools } = useProjectDetail(id ?? '');
  const { acceptRequest, rejectRequest, requests } = useRequests();
  const [requestedIds, setRequestedIds] = useState<readonly string[]>([]);

  const neighbors: Neighbor[] = tools.flatMap((item, index) =>
    item.tool
      ? [
          {
            distanceBlocks: item.tool.distanceBlocks,
            id: item.tool.id,
            name: item.tool.ownerName,
            number: index + 1,
          },
        ]
      : [],
  );

  function goBack() {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace('/prototipo/explorar');
  }

  function requestTool(requiredId: string) {
    setRequestedIds((current) =>
      current.includes(requiredId) ? current : [...current, requiredId],
    );
  }

  if (!project) {
    return (
      <Screen style={styles.centered}>
        <EmptyState title={t.tools.notFound} actionLabel={t.common.back} onAction={goBack} />
      </Screen>
    );
  }

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <Button label={t.common.back} variant="ghost" onPress={goBack} />

      <View style={styles.header}>
        <AppText variant="title">{project.title}</AppText>
        <AppText color="muted">{t.tools.detailTitle}</AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">{t.tools.projectTools}</AppText>
        <View style={styles.list}>
          {tools.map((item) => (
            <ProjectToolRow
              key={item.required.id}
              name={item.required.name}
              onRequest={() => requestTool(item.required.id)}
              requested={requestedIds.includes(item.required.id)}
              tool={item.tool}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">{t.tools.mapTitle}</AppText>
        <NeighborMap neighbors={neighbors} />
      </View>

      <View style={styles.section}>
        <AppText variant="subtitle">{t.requests.title}</AppText>
        {requests.length === 0 ? (
          <EmptyState title={t.requests.title} message={t.requests.empty} />
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
  centered: {
    justifyContent: 'center',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  section: {
    gap: spacing.md,
  },
});
