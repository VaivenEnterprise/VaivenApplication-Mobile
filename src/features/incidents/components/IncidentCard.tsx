import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { Card } from '@/components/ui/Card';
import { Chip } from '@/components/ui/Chip';
import { IconBadge } from '@/components/ui/IconBadge';
import { REASON_ICON } from '@/features/incidents/components/ReasonPicker';
import type { Incident } from '@/features/incidents/types';
import { es } from '@/i18n/es-MX';
import { formatDate } from '@/lib/format/date';
import { spacing } from '@/theme';

type IncidentCardProps = {
  incident: Incident;
  /** Nombre de la otra persona (el contrato de incidencias no trae el objeto). */
  counterpart: string;
  onPress: () => void;
};

/** Píldora de estado: «Abierto» (aviso) o «Cerrado» (neutro). */
export function IncidentStatusChip({ status }: { status: Incident['status'] }) {
  return (
    <Chip label={es.incidents.status[status]} variant={status === 'open' ? 'warning' : 'neutral'} />
  );
}

/** Fila de «Mis incidencias» (spec 010 §7.4): ícono y nombre del motivo, persona, fecha y estado. */
export function IncidentCard({ incident, counterpart, onPress }: IncidentCardProps) {
  const reason = es.incidents.reasons[incident.reason].name;
  const when = formatDate(incident.createdAt);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${reason}, ${counterpart}, ${when}, ${es.incidents.status[incident.status]}`}
      onPress={onPress}
    >
      <Card style={styles.card}>
        <IconBadge icon={REASON_ICON[incident.reason]} tone="warning" />
        <View style={styles.texts}>
          <AppText variant="bodyStrong" numberOfLines={1}>
            {reason}
          </AppText>
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {`${counterpart} · ${when}`}
          </AppText>
        </View>
        <IncidentStatusChip status={incident.status} />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd, padding: spacing.md },
  texts: { flex: 1 },
});
