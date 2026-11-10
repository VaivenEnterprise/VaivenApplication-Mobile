import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ProjectCard } from '@/features/projects/components/ProjectCard';
import { PROJECTS, type Project } from '@/features/projects/catalog';
import { routes } from '@/lib/routes';
import { spacing } from '@/theme';

type PopularProjectsProps = {
  /** Por defecto abre `proyecto/[id]`. */
  onSelect?: (project: Project) => void;
};

/** Proyectos populares del catálogo local: una tarjeta grande y dos pequeñas (spec 003 §7.3). */
export function PopularProjects({ onSelect }: PopularProjectsProps) {
  const router = useRouter();
  const open = onSelect ?? ((project: Project) => router.push(routes.project(project.id)));
  const [hero, ...rest] = PROJECTS;
  if (hero === undefined) return null;

  return (
    <View style={styles.root}>
      <ProjectCard project={hero} variant="hero" onPress={open} />
      <View style={styles.row}>
        {rest.slice(0, 2).map((project) => (
          <View key={project.id} style={styles.cell}>
            <ProjectCard project={project} variant="compact" onPress={open} />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.smd },
  row: { flexDirection: 'row', gap: spacing.smd },
  cell: { flex: 1 },
});
