import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { maxTo, rangeProblem } from '@/features/search/filters';
import { dateToYmd, diffDaysYmd, formatYmd, isYmd, ymdToDate } from '@/lib/format/date';
import { es } from '@/i18n/es-MX';
import { POLICY } from '@/lib/policy';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.search.filters;

export type DateRange = { from: string; to: string };
type Which = 'from' | 'to';

type DateRangeFieldProps = {
  from: string;
  to: string;
  /** Hoy (`YYYY-MM-DD`, Ciudad de México): las fechas pasadas no se pueden elegir (P-04). */
  today: string;
  onChange: (range: DateRange) => void;
};

/** Cómo queda el rango al elegir una fecha: si «Hasta» deja de ser válida, se quita. */
export function applyDate(range: DateRange, which: Which, ymd: string, today: string): DateRange {
  const clamped = ymd < today ? today : ymd;
  if (which === 'to') return { from: range.from, to: clamped };
  const days = diffDaysYmd(clamped, range.to);
  const keepTo = isYmd(range.to) && days >= 0 && days <= POLICY.search.maxRangeDays;
  return { from: clamped, to: keepTo ? range.to : '' };
}

type DateButtonProps = {
  label: string;
  value: string;
  onPress: () => void;
  onClear: () => void;
};

function DateButton({ label, value, onPress, onClear }: DateButtonProps) {
  const filled = value !== '';
  const text = filled ? formatYmd(value) : t.pickDate;
  return (
    <View style={styles.cell}>
      <AppText variant="label" color="muted">
        {label}
      </AppText>
      <View style={styles.field}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}: ${text}`}
          onPress={onPress}
          style={styles.press}
        >
          <AppIcon name="calendar" size="sm" color={filled ? 'primaryInk' : 'muted'} />
          <AppText variant="body" color={filled ? 'ink' : 'muted'} numberOfLines={1}>
            {text}
          </AppText>
        </Pressable>
        {filled ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${t.clearDate} ${label}`}
            onPress={onClear}
            style={styles.clear}
          >
            <AppIcon name="clearCircle" size="sm" color="muted" />
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

/**
 * «Desde» y «Hasta» (spec 006 §7.2, plan P-04): fechas de calendario `YYYY-MM-DD`, sin pasadas,
 * con `from ≤ to` y un periodo máximo de 7 días. Android abre el diálogo del sistema; iOS
 * despliega el calendario bajo el campo.
 */
export function DateRangeField({ from, to, today, onChange }: DateRangeFieldProps) {
  const [editing, setEditing] = useState<Which | null>(null);
  const problem = rangeProblem(from, to);

  const bounds = (which: Which) => {
    if (which === 'from') return { min: today, max: null as string | null };
    return { min: isYmd(from) ? from : today, max: maxTo(from) };
  };

  const commit = (which: Which, ymd: string) =>
    onChange(applyDate({ from, to }, which, ymd, today));

  const open = (which: Which) => {
    const { min, max } = bounds(which);
    const current = which === 'from' ? from : to;
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
    const current = editing === 'from' ? from : to;
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
      <View style={styles.row}>
        <DateButton
          label={t.from}
          value={from}
          onPress={() => open('from')}
          onClear={() => onChange({ from: '', to })}
        />
        <DateButton
          label={t.to}
          value={to}
          onPress={() => open('to')}
          onClear={() => onChange({ from, to: '' })}
        />
      </View>
      {picker}
      {problem === null ? null : (
        <AppText variant="caption" color="danger" accessibilityRole="alert">
          {problem === 'inverted' ? t.rangeInverted : t.rangeTooLong}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.smd },
  cell: { flex: 1, gap: spacing.xs },
  field: {
    minHeight: sizes.control.height,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: sizes.field.border,
    borderColor: colors.fieldBorder,
    backgroundColor: colors.surface,
    paddingLeft: spacing.smd,
  },
  press: {
    flex: 1,
    minHeight: sizes.touch.minSize,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  clear: {
    minWidth: sizes.touch.minSize,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
