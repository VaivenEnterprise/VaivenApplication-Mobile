import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText, Badge, Card } from '@/components/ui';
import { esMX as t } from '@/i18n/es-MX';
import type { Project } from '@/lib/domain/models';
import { colors, radius, sizes, spacing } from '@/theme';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

type Props = {
  project: Project;
  selected?: boolean;
  onPress?: () => void;
};

const projectIcons: Record<string, IoniconName> = {
  'project-assemble-furniture': 'bed-outline',
  'project-hang-picture': 'image-outline',
  'project-prune-garden': 'leaf-outline',
};

export function ProjectCard({ project, selected = false, onPress }: Props) {
  const icon = projectIcons[project.id] ?? 'construct-outline';

  return (
    <Card onPress={onPress} style={[styles.card, selected && styles.selected]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Ionicons color={colors.primary} name={icon} size={sizes.icon} />
          </View>
          <View style={styles.titleWrap}>
            <AppText variant="subtitle" style={styles.title}>
              {project.title}
            </AppText>
            <AppText variant="caption" color="muted">
              {t.projects.toolCount(project.requiredTools.length)}
            </AppText>
          </View>
          {selected ? (
            <Badge label={t.home.selected} tone="primary" />
          ) : (
            <Ionicons color={colors.muted} name="chevron-forward" size={sizes.iconSmall} />
          )}
        </View>
        <View style={styles.tools}>
          {project.requiredTools.map((tool) => (
            <Badge key={tool.id} label={tool.name} tone={tool.toolId ? 'primary' : 'neutral'} />
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    paddingVertical: spacing.md,
  },
  content: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
  },
  icon: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    height: sizes.iconXLarge,
    justifyContent: 'center',
    width: sizes.iconXLarge,
  },
  selected: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  title: {
    flex: 1,
  },
  titleWrap: {
    flex: 1,
    gap: spacing.xs,
  },
  tools: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
});
