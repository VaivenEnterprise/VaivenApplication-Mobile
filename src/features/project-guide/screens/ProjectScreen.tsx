import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { NeighborhoodMap, type MapPin } from '@/components/map/NeighborhoodMap';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/features/auth/useSession';
import { useMyBookings } from '@/features/bookings';
import { PinCard } from '@/features/project-guide/components/PinCard';
import { ProjectDoneSheet } from '@/features/project-guide/components/ProjectDoneSheet';
import { StepCard, type Step } from '@/features/project-guide/components/StepCard';
import { ToolRow, zoneText } from '@/features/project-guide/components/ToolRow';
import { distanceLabel } from '@/features/project-guide/geometry';
import { useProjectProgress, useProjectTools } from '@/features/project-guide/hooks';
import { WIDE_RADIUS_KM, type ToolRadiusKm } from '@/features/project-guide/types';
import { getProject, projectTitle, toolsLabel, type Project } from '@/features/projects';
import { useLocation } from '@/features/search';
import { es } from '@/i18n/es-MX';
import { routes } from '@/lib/routes';
import { colors, gradients, radius, sizes, spacing } from '@/theme';

const t = es.bookings.guide;
/** Estados de una solicitud propia que cuentan como «Solicitada» en la herramienta (CA-13). */
const ACTIVE_STATUSES = new Set(['pending', 'accepted', 'in_progress']);

type ProjectScreenProps = { id: string };

function BackButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.back}
      onPress={onPress}
      style={styles.round}
    >
      <AppIcon name="arrowBack" />
    </Pressable>
  );
}

/**
 * Proyecto (spec 007 §7.1, RF-12 a RF-15, CA-08 a CA-13): herramientas necesarias con la persona
 * más cercana que las tiene, mapa esquemático del vecindario y paso a paso. Los datos del proyecto
 * vienen del catálogo de 006; no muestra nada de lo descartado en §7.6.
 */
export function ProjectScreen({ id }: ProjectScreenProps) {
  const router = useRouter();
  const project = getProject(id);
  if (project === undefined) {
    return (
      <Screen>
        <BackButton onPress={() => router.back()} />
        <EmptyState
          icon="hammer"
          title={t.notFoundTitle}
          description={t.notFoundDescription}
          actionLabel={t.notFoundAction}
          onAction={() => router.back()}
        />
      </Screen>
    );
  }
  return <ProjectContent project={project} />;
}

function ProjectContent({ project }: { project: Project }) {
  const router = useRouter();
  const { user } = useSession();
  const location = useLocation();
  const copy = es.projects.items[project.id];
  const steps: readonly Step[] = copy.steps;
  const toolNames: Record<string, string> = copy.tools;

  const [radii, setRadii] = useState<Record<string, ToolRadiusKm>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [sheetFor, setSheetFor] = useState<string | null>(null);
  const [doneOpen, setDoneOpen] = useState(false);

  const tools = project.toolIds.map((toolId) => ({ toolId, name: toolNames[toolId] ?? toolId }));
  const queries = useProjectTools(tools, location.coords, radii);
  const progress = useProjectProgress(steps.length);
  const mine = useMyBookings('requester');

  // Con el permiso ya concedido, se obtiene la posición sin diálogo; si no, se invita a activarla.
  const requestedLocate = useRef(false);
  const { availability, coords, locating, locate } = location;
  useEffect(() => {
    if (availability === 'available' && coords === null && !locating && !requestedLocate.current) {
      requestedLocate.current = true;
      void locate();
    }
  }, [availability, coords, locating, locate]);

  const requestedItems = new Set(
    (mine.data?.pages ?? [])
      .flatMap((page) => page.items)
      .filter((booking) => ACTIVE_STATUSES.has(booking.status))
      .map((booking) => booking.item.id),
  );

  const located = coords !== null;
  const placeOf = (query: (typeof queries)[number]): string => {
    const hit = query.hit;
    if (hit == null) return '';
    return (located ? distanceLabel(hit.distanceKm) : null) ?? zoneText(hit.zone);
  };

  const pins: MapPin[] = queries.flatMap((query, index) =>
    query.hit == null
      ? []
      : [
          {
            id: query.toolId,
            number: index + 1,
            label: `${t.pinLabel} ${index + 1}: ${toolNames[query.toolId] ?? query.toolId}, ${placeOf(query)}`,
            zone: zoneText(query.hit.zone),
            location: query.hit.approxLocation,
          },
        ],
  );

  const choose = (toolId: string) => {
    setSelected(toolId);
    setSheetFor(toolId);
  };
  const widen = (toolId: string) =>
    setRadii((current) => ({ ...current, [toolId]: WIDE_RADIUS_KM }));

  const sheetIndex = queries.findIndex((query) => query.toolId === sheetFor);
  const sheetHit = sheetIndex >= 0 ? queries[sheetIndex]?.hit : null;

  const gradient = project.tone === 'warm' ? gradients.slotWarm : gradients.slotGreen;
  const ink = project.tone === 'warm' ? 'primaryInk' : 'secondaryPressed';

  const mapSection = (() => {
    if (!located) {
      if (locating || availability === 'available') {
        return <Skeleton shape="card" width="100%" />;
      }
      return (
        <Card variant="muted" style={styles.invite}>
          <IconBadge icon="pin" />
          <AppText variant="subheading">{t.locationTitle}</AppText>
          <AppText color="muted">{t.locationBody}</AppText>
          <Button label={t.locationAction} variant="outline" onPress={() => void locate()} />
        </Card>
      );
    }
    if (queries.every((query) => query.isPending)) return <Skeleton shape="card" width="100%" />;
    return (
      <View style={styles.mapBox}>
        <NeighborhoodMap origin={coords} pins={pins} selectedId={selected} onSelect={choose} />
      </View>
    );
  })();

  return (
    <Screen
      footer={
        <Button
          label={t.finish}
          variant="secondary"
          disabled={!progress.allDone}
          onPress={() => setDoneOpen(true)}
        />
      }
    >
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <AppText variant="subheading" numberOfLines={1} style={styles.headerTitle}>
          {projectTitle(project)}
        </AppText>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={es.tabs.profile}
          onPress={() => router.push(routes.profile)}
        >
          <Avatar name={user?.displayName ?? ''} size="md" />
        </Pressable>
      </View>

      <LinearGradient
        colors={[...gradient.colors]}
        start={gradient.start}
        end={gradient.end}
        style={styles.hero}
      >
        <IconBadge
          icon={project.icon}
          tone={project.tone === 'warm' ? 'primary' : 'secondary'}
          size="lg"
        />
        <AppText variant="title" color={ink} accessibilityRole="header">
          {projectTitle(project)}
        </AppText>
        <View style={styles.chips}>
          <Chip label={`${project.minutes} ${t.minutes}`} icon="calendar" />
          <Chip label={`${steps.length} ${t.stepsCount}`} />
          <Chip label={es.projects.difficulty[project.difficulty]} variant="success" />
        </View>
      </LinearGradient>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading" accessibilityRole="header">
            {t.needs}
          </AppText>
          <Chip label={toolsLabel(project)} />
        </View>
        {queries.map((query, index) => (
          <ToolRow
            key={query.toolId}
            number={index + 1}
            name={toolNames[query.toolId] ?? query.toolId}
            query={query}
            located={located}
            selected={selected === query.toolId}
            requested={query.hit != null && requestedItems.has(query.hit.id)}
            onGet={() => choose(query.toolId)}
            onWiden={() => widen(query.toolId)}
          />
        ))}
      </View>

      <View style={styles.section}>
        <AppText variant="heading" accessibilityRole="header">
          {t.where}
        </AppText>
        {located ? (
          <AppText variant="caption" color="muted">
            {t.tapPin}
          </AppText>
        ) : null}
        {mapSection}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <AppText variant="heading" accessibilityRole="header">
            {t.steps}
          </AppText>
          <AppText variant="label" color="muted">
            {`${progress.doneCount} ${t.stepOf} ${steps.length}`}
          </AppText>
        </View>
        <ProgressBar
          value={steps.length === 0 ? 0 : progress.doneCount / steps.length}
          accessibilityLabel={t.progressLabel}
        />
        {steps.map((step, index) => (
          <StepCard
            key={step.title}
            index={index}
            step={step}
            done={progress.done.has(index)}
            active={progress.activeIndex === index}
            onToggle={() => progress.toggle(index)}
          />
        ))}
      </View>

      {sheetHit == null ? null : (
        <PinCard
          visible
          number={sheetIndex + 1}
          hit={sheetHit}
          located={located}
          onClose={() => setSheetFor(null)}
          onRequest={() => {
            setSheetFor(null);
            router.push(routes.request(sheetHit.id));
          }}
          onView={() => {
            setSheetFor(null);
            router.push(routes.item(sheetHit.id));
          }}
        />
      )}

      <ProjectDoneSheet
        visible={doneOpen}
        onClose={() => setDoneOpen(false)}
        onReturnTools={() => {
          setDoneOpen(false);
          router.push(routes.activity);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  headerTitle: { flex: 1 },
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: { gap: spacing.smd, padding: spacing.lg, borderRadius: radius.xl },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  section: { gap: spacing.smd },
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  invite: { gap: spacing.smd },
  mapBox: { gap: spacing.sm },
});
