import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { TextField } from '@/components/TextField';
import type { Modality } from '@/features/items';
import { CategoryChips } from '@/features/search/components/CategoryChips';
import { DistanceField } from '@/features/search/components/DistanceField';
import { DateRangeField } from '@/features/search/components/DateRangeField';
import { clearFilters, rangeProblem } from '@/features/search/filters';
import type { SearchFilters } from '@/features/search/types';
import type { LocationApi } from '@/features/search/useLocation';
import { es } from '@/i18n/es-MX';
import { todayYmd } from '@/lib/format/date';
import { POLICY } from '@/lib/policy';
import { spacing } from '@/theme';

const t = es.search.filters;

type ModalityChoice = 'all' | Modality;

const MODALITY_OPTIONS = [
  { value: 'all', label: t.modalityAll },
  { value: 'loan', label: es.items.modality.loan },
  { value: 'rent', label: es.items.modality.rent },
] as const;

type FilterSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Filtros vigentes; la hoja edita una copia y solo la aplica con «Ver resultados». */
  filters: SearchFilters;
  onApply: (filters: SearchFilters) => void;
  /** Ubicación del dispositivo para el filtro de distancia (se oculta si se niega el permiso). */
  location: LocationApi;
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <AppText variant="subheading" accessibilityRole="header">
        {title}
      </AppText>
      {children}
    </View>
  );
}

/**
 * Hoja de filtros (spec 006 §7.2, RF-03): categoría, modalidad, fechas y municipio. Pie fijo con
 * «Limpiar» y «Ver resultados». Cada vez que se abre parte de los filtros vigentes.
 */
export function FilterSheet({ visible, onClose, filters, onApply, location }: FilterSheetProps) {
  const [draft, setDraft] = useState(filters);
  const [wasVisible, setWasVisible] = useState(visible);
  if (visible !== wasVisible) {
    setWasVisible(visible);
    if (visible) setDraft(filters);
  }

  const change = (patch: Partial<SearchFilters>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const problem = rangeProblem(draft.from, draft.to);

  const apply = () => {
    onApply({ ...draft, municipality: draft.municipality.trim() });
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={t.title}
      footer={
        <View style={styles.footer}>
          <Button label={t.clear} variant="link" onPress={() => setDraft(clearFilters(draft))} />
          <View style={styles.apply}>
            <Button label={t.apply} onPress={apply} disabled={problem !== null} />
          </View>
        </View>
      }
    >
      <Section title={t.category}>
        <CategoryChips wrap value={draft.category} onChange={(category) => change({ category })} />
      </Section>

      <Section title={t.modality}>
        <SegmentedControl<ModalityChoice>
          options={MODALITY_OPTIONS}
          value={draft.modality ?? 'all'}
          onChange={(choice) => change({ modality: choice === 'all' ? null : choice })}
        />
      </Section>

      <DistanceField
        value={draft.radiusKm}
        onChange={(radiusKm) => change({ radiusKm })}
        location={location}
      />

      <Section title={t.dates}>
        <DateRangeField
          from={draft.from}
          to={draft.to}
          today={todayYmd()}
          onChange={(range) => change(range)}
        />
      </Section>

      <TextField
        label={t.municipality}
        value={draft.municipality}
        onChangeText={(municipality) => change({ municipality })}
        placeholder={t.municipalityPlaceholder}
        maxLength={POLICY.zone.max}
        autoCapitalize="words"
        returnKeyType="done"
      />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.smd },
  footer: { flexDirection: 'row', alignItems: 'center', gap: spacing.smd },
  apply: { flex: 1 },
});
