import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { FormNotice } from '@/components/FormNotice';
import { TextField } from '@/components/TextField';
import { AppText } from '@/components/ui/AppText';
import { Avatar } from '@/components/ui/Avatar';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { IconBadge } from '@/components/ui/IconBadge';
import { RatingStars } from '@/components/ui/RatingStars';
import { ratingErrorMessage } from '@/features/ratings/errors';
import { useCreateRating } from '@/features/ratings/hooks';
import { COMMENT_MAX, buildComment, ratingFormSchema } from '@/features/ratings/schemas';
import { es } from '@/i18n/es-MX';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.ratings.sheet;

type Word = keyof typeof es.ratings.words;

type RatingFormProps = {
  bookingId: string;
  /** Nombre de la persona a la que se califica. */
  counterpartName: string;
  /** Estrellas con las que se abre la hoja (las que se tocaron en la tarjeta). */
  initialScore: number;
  onClose: () => void;
};

type QuickChipProps = { label: string; selected: boolean; onPress: () => void };

/** Chip de selección múltiple (casilla), de al menos 44 pt de alto. */
function QuickChip({ label, selected, onPress }: QuickChipProps) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      <AppText variant="label" color={selected ? 'onPrimary' : 'ink'}>
        {label}
      </AppText>
    </Pressable>
  );
}

/**
 * Hoja de calificación (spec 010 §7.1, RF-02, RF-10): la persona, estrellas grandes, una palabra,
 * chips rápidos según la puntuación y un comentario opcional con contador de 300. Los chips se
 * añaden al texto del comentario, sin cambiar el contrato. Se monta solo mientras está abierta, así
 * siempre arranca limpia.
 */
export function RatingForm({ bookingId, counterpartName, initialScore, onClose }: RatingFormProps) {
  const mutation = useCreateRating(bookingId);
  const [score, setScore] = useState(initialScore);
  const [chips, setChips] = useState<readonly string[]>([]);
  const [typed, setTyped] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const word = es.ratings.words[score as Word];
  const options = score >= 4 ? es.ratings.chips.positive : es.ratings.chips.negative;
  const comment = buildComment(chips, typed);
  const tooLong = comment.length > COMMENT_MAX;

  // Al pasar de positivo a negativo (o al revés) los chips elegidos dejan de aplicar.
  const changeScore = (next: number) => {
    if (next >= 4 !== score >= 4) setChips([]);
    setScore(next);
  };

  const toggle = (label: string) =>
    setChips((current) =>
      current.includes(label) ? current.filter((chip) => chip !== label) : [...current, label],
    );

  const submit = async () => {
    const parsed = ratingFormSchema.safeParse({ score, comment });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? es.ratings.errors.generic);
      return;
    }
    setError(null);
    try {
      await mutation.mutateAsync(
        parsed.data.comment === ''
          ? { score: parsed.data.score }
          : { score: parsed.data.score, comment: parsed.data.comment },
      );
      setSent(true);
    } catch (failure) {
      setError(ratingErrorMessage(failure));
    }
  };

  if (sent) {
    return (
      <BottomSheet visible onClose={onClose} footer={<Button label={t.done} onPress={onClose} />}>
        <View style={styles.center}>
          <IconBadge icon="success" tone="secondary" size="lg" />
          <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
            {t.thanks}
          </AppText>
          <AppText color="muted" style={styles.centered}>
            {t.thanksHint}
          </AppText>
        </View>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet
      visible
      onClose={onClose}
      footer={
        <View style={styles.footer}>
          <Button
            label={t.send}
            disabled={tooLong}
            loading={mutation.isPending}
            onPress={() => void submit()}
          />
          <Button label={t.notNow} variant="link" onPress={onClose} />
        </View>
      }
    >
      <View style={styles.body}>
        <View style={styles.center}>
          <Avatar name={counterpartName} size="lg" />
          <AppText variant="heading" accessibilityRole="header" style={styles.centered}>
            {`${t.question} ${counterpartName}?`}
          </AppText>
          <RatingStars value={score} onChange={changeScore} />
          <AppText variant="bodyStrong" color="primaryInk" accessibilityLiveRegion="polite">
            {word}
          </AppText>
        </View>

        <View style={styles.chips}>
          {options.map((label) => (
            <QuickChip
              key={label}
              label={label}
              selected={chips.includes(label)}
              onPress={() => toggle(label)}
            />
          ))}
        </View>

        <View>
          <TextField
            label={t.comment}
            value={typed}
            onChangeText={setTyped}
            multiline
            hint={t.commentHint}
            error={tooLong ? es.ratings.validation.commentTooLong : undefined}
          />
          <AppText variant="caption" color={tooLong ? 'danger' : 'muted'} style={styles.counter}>
            {`${comment.length}/${COMMENT_MAX} ${t.counter}`}
          </AppText>
        </View>

        {error === null ? null : <FormNotice message={error} />}
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md },
  center: { alignItems: 'center', gap: spacing.smd },
  centered: { textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
  chip: {
    minHeight: sizes.touch.minSize,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: sizes.field.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOff: { backgroundColor: colors.surface, borderColor: colors.fieldBorder },
  chipOn: { backgroundColor: colors.primary, borderColor: colors.primary },
  counter: { textAlign: 'right' },
  footer: { gap: spacing.sm },
});
