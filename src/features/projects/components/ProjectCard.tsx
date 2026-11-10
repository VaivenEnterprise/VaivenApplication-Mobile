import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Chip } from '@/components/ui/Chip';
import { projectTitle, toolsLabel, type Project } from '@/features/projects/catalog';
import { es } from '@/i18n/es-MX';
import { gradients, motion, radius, shadows, sizes, spacing } from '@/theme';

export type ProjectCardVariant = 'hero' | 'compact' | 'wide';

type ProjectCardProps = {
  project: Project;
  variant?: ProjectCardVariant;
  onPress: (project: Project) => void;
};

const HEIGHT = { hero: sizes.projectCard.hero, compact: sizes.projectCard.compact } as const;

/**
 * Tarjeta de proyecto (spec 006 §7.3): `hero` (alto 160), `compact` (112) y `wide` (fila con la
 * etiqueta «Proyecto»). Degradado `slotWarm`/`slotGreen` con el ícono del proyecto, sin fotos.
 */
export function ProjectCard({ project, variant = 'compact', onPress }: ProjectCardProps) {
  const title = projectTitle(project);
  const tools = toolsLabel(project);
  const gradient = project.tone === 'warm' ? gradients.slotWarm : gradients.slotGreen;
  const ink = project.tone === 'warm' ? 'primaryInk' : 'secondaryPressed';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${title}. ${tools}`}
      onPress={() => onPress(project)}
      style={({ pressed }) => [
        styles.card,
        variant === 'wide' ? styles.wide : { height: HEIGHT[variant] },
        pressed && { transform: [{ scale: motion.pressScale }] },
      ]}
    >
      <LinearGradient
        colors={gradient.colors}
        start={gradient.start}
        end={gradient.end}
        style={StyleSheet.absoluteFill}
      />
      {variant === 'wide' ? (
        <>
          <AppIcon name={project.icon} size="lg" color={ink} />
          <View style={styles.wideText}>
            <AppText variant="eyebrow" color={ink}>
              {es.projects.label}
            </AppText>
            <AppText variant="bodyStrong" numberOfLines={1}>
              {title}
            </AppText>
          </View>
          <AppText variant="caption" color={ink}>
            {`${tools} ›`}
          </AppText>
        </>
      ) : (
        <>
          <AppIcon name={project.icon} size={variant === 'hero' ? 'xl' : 'lg'} color={ink} />
          <View style={styles.bottom}>
            <AppText variant={variant === 'hero' ? 'heading' : 'bodyStrong'} numberOfLines={2}>
              {title}
            </AppText>
            {variant === 'hero' ? (
              <Chip label={tools} variant={project.tone === 'warm' ? 'neutral' : 'success'} />
            ) : null}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.xl,
    ...shadows.soft,
  },
  wide: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.smd,
    minHeight: sizes.projectCard.wide,
  },
  wideText: { flex: 1, gap: 2 },
  bottom: { gap: spacing.xs, alignItems: 'flex-start' },
});
