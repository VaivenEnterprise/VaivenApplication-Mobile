import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { presetRanges } from '@/features/bookings/dates';
import { maxEnd, rangeProblem } from '@/features/bookings/rules';
import { ChoiceChip } from '@/features/items';
import { es } from '@/i18n/es-MX';
import { dateToYmd, formatYmd, isYmd, ymdToDate } from '@/lib/format/date';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.bookings.request;

export type BookingDates = { start: string; end: string };
type Which = 'start' | 'end';

type DateRangePickerProps = {
  start: string;
  end: string;
  /** Hoy (`YYYY-MM-DD`, Ciudad de México): no se pueden elegir fechas pasadas (CA-02). */
  today: string;
  onChange: (dates: BookingDates) => void;
};

/** Cómo queda el periodo al elegir una fecha: si el fin deja de ser válido, se quita. */
export function applyDate(
  dates: BookingDates,
  which: Which,
  ymd: string,
  today: string,
): BookingDates {
  const clamped = ymd < today ? today : ymd;
  if (which === 'end') return { start: dates.start, end: clamped };
  const keepEnd = isYmd(dates.end) && rangeProblem(clamped, dates.end, today) === null;
  return { start: clamped, end: keepEnd ? dates.end : '' };
}

function DateButton(props: { label: string; value: string; onPress: () => void }) {
  const filled = props.value !== '';
  const text = filled ? formatYmd(props.value) : t.pickDates;
  return (
    <View style={styles.cell}>
      <AppText variant="label" color="muted">
        {props.label}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${props.label}: ${text}`}
        onPress={props.onPress}
        style={styles.field}
      >
        <AppIcon name="calendar" size="sm" color={filled ? 'primaryInk' : 'muted'} />
        <AppText variant="body" color={filled ? 'ink' : 'muted'} numberOfLines={1}>
          {text}
        </AppText>
      </Pressable>
    </View>
  );
}

/**
 * «¿Cuándo?» (spec 007 §7.3): atajos Hoy / Mañana / Fin de semana y dos fechas. Bloquea fechas
 * pasadas y periodos de más de 7 días contando ambos extremos (CA-02). Android abre el diálogo del
 * sistema; iOS despliega el calendario bajo los campos.
 */
export function DateRangePicker({ start, end, today, onChange }: DateRangePickerProps) {
  const [editing, setEditing] = useState<Which | null>(null);
  const presets = presetRanges(today);
  const options = [
    { key: 'today', label: t.today },
    { key: 'tomorrow', label: t.tomorrow },
    { key: 'weekend', label: t.weekend },
  ] as const;
  const problem = isYmd(start) && isYmd(end) ? rangeProblem(start, end, today) : null;

  const bounds = (which: Which): { min: string; max: string | null } =>
    which === 'start'
      ? { min: today, max: null }
      : { min: isYmd(start) ? start : today, max: isYmd(start) ? maxEnd(start) : null };

  const commit = (which: Which, ymd: string) =>
    onChange(applyDate({ start, end }, which, ymd, today));

  const open = (which: Which) => {
    const { min, max } = bounds(which);
    const current = which === 'start' ? start : end;
    const value = isYmd(current) ? current : min;
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: ymdToDate(value),
        mode: 'date',
        minimumDate: ymdToDate(min),
        ...(max === null ? {} : { maximumDate: ymdToDate(max) }),
        onChange: (event, date) => {
          if (event.type === 'set' && date !== undefined) commit(which, dateToYmd(date));
        },
      });
      return;
    }
    setEditing(editing === which ? null : which);
  };

  const picker = (() => {
    if (editing === null) return null;
    const { min, max } = bounds(editing);
    const current = editing === 'start' ? start : end;
    return (
      <DateTimePicker
        testID="date-picker"
        value={ymdToDate(isYmd(current) ? current : min)}
        mode="date"
        display="inline"
        minimumDate={ymdToDate(min)}
        {...(max === null ? {} : { maximumDate: ymdToDate(max) })}
        accentColor={colors.primary}
        onChange={(_event, date) => {
          if (date !== undefined) {
            commit(editing, dateToYmd(date));
            setEditing(null);
          }
        }}
      />
    );
  })();

  return (
    <View style={styles.root}>
      <View style={styles.presets} accessibilityRole="radiogroup">
        {options.map(({ key, label }) => (
          <ChoiceChip
            key={key}
            label={label}
            selected={start === presets[key].start && end === presets[key].end}
            onPress={() => {
              setEditing(null);
              onChange(presets[key]);
            }}
          />
        ))}
      </View>
      <View style={styles.row}>
        <DateButton label={es.search.filters.from} value={start} onPress={() => open('start')} />
        <DateButton label={es.search.filters.to} value={end} onPress={() => open('end')} />
      </View>
      {picker}
      {problem === null ? (
        <AppText variant="caption" color="muted">
          {t.maxDays}
        </AppText>
      ) : (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {problem === 'tooLong' ? es.search.filters.rangeTooLong : es.search.filters.rangeInverted}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.smd },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.smd },
  cell: { flex: 1, gap: spacing.xs },
  field: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.smd,
    borderRadius: radius.md,
    borderWidth: sizes.field.border,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
  },
});
