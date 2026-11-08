import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Avatar, Button, Card, EmptyState, Screen } from '@/components/ui';
import { useAuth } from '@/features/auth/useAuth';
import { AssistantFab } from '@/features/chat/components/AssistantFab';
import { KitItem } from '@/features/projects/components/KitItem';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { WorkCard } from '@/features/projects/components/WorkCard';
import { useProjects, useWorks } from '@/features/projects/hooks';
import { esMX as t } from '@/i18n/es-MX';
import { colors, sizes, spacing } from '@/theme';

export default function HomeScreen() {
  const router = useRouter();
  const { signInAsMariana, user } = useAuth();
  const projects = useProjects();
  const works = useWorks();
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    projects[0]?.id ?? null,
  );

  const selectedProject =
    projects.find((project) => project.id === selectedProjectId) ?? projects[0];

  if (!user) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.guestHeaderText}>
            <AppText variant="display">{t.common.appName}</AppText>
            <AppText variant="title">{t.home.guestGreeting}</AppText>
            <AppText color="muted">{t.home.subtitle}</AppText>
          </View>
          <Button label={t.home.enter} onPress={signInAsMariana} />
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">{t.home.popularProjects}</AppText>
          {projects.length === 0 ? (
            <EmptyState title={t.home.popularProjects} message={t.home.projectsEmpty} />
          ) : (
            <View style={styles.list}>
              {projects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onPress={() => router.push(`/prototipo/herramienta/${project.id}`)}
                />
              ))}
            </View>
          )}
        </View>
      </Screen>
    );
  }

  return (
    <View style={styles.root}>
      <Screen scroll contentContainerStyle={styles.content}>
        <View style={styles.authHeader}>
          <View style={styles.location}>
            <Ionicons color={colors.primary} name="location-outline" size={sizes.iconSmall} />
            <AppText variant="label" color="primary">
              {t.home.location}
            </AppText>
          </View>
          <Avatar name={user.name} size={sizes.avatar} />
        </View>

        <View style={styles.headerText}>
          <AppText variant="display">{t.common.appName}</AppText>
          <AppText variant="title">{t.home.userGreeting(user.name)}</AppText>
          <AppText color="muted">{t.home.subtitle}</AppText>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">{t.home.popularProjects}</AppText>
          <View style={styles.list}>
            {projects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                selected={project.id === selectedProject?.id}
                onPress={() => setSelectedProjectId(project.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">{t.home.kitTitle}</AppText>
          <AppText color="muted">{t.home.kitSubtitle}</AppText>
          {selectedProject ? (
            <Card>
              <View style={styles.kit}>
                <AppText variant="bodyBold">{selectedProject.title}</AppText>
                <View style={styles.kitItems}>
                  {selectedProject.requiredTools.map((tool) => (
                    <KitItem key={tool.id} name={tool.name} />
                  ))}
                </View>
                <Button
                  label={t.home.kitCta}
                  onPress={() => router.push(`/prototipo/herramienta/${selectedProject.id}`)}
                />
              </View>
            </Card>
          ) : (
            <EmptyState title={t.home.kitTitle} message={t.home.kitEmpty} />
          )}
        </View>

        <View style={styles.section}>
          <AppText variant="subtitle">{t.home.recentWork}</AppText>
          {works.length === 0 ? (
            <EmptyState title={t.home.recentWork} message={t.home.recentWorkEmpty} />
          ) : (
            <View style={styles.list}>
              {works.map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </View>
          )}
        </View>
      </Screen>
      <AssistantFab onPress={() => router.push('/prototipo/asistente')} />
    </View>
  );
}

const styles = StyleSheet.create({
  authHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    justifyContent: 'space-between',
  },
  guestHeaderText: {
    flex: 1,
    gap: spacing.xs,
  },
  headerText: {
    gap: spacing.xs,
  },
  kit: {
    gap: spacing.md,
  },
  kitItems: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  list: {
    gap: spacing.sm,
  },
  location: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  root: {
    flex: 1,
  },
  section: {
    gap: spacing.md,
  },
});
