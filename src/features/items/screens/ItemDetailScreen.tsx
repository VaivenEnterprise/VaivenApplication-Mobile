import { useRouter } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { EmptyState } from '@/components/EmptyState';
import { FormNotice } from '@/components/FormNotice';
import { AppIcon } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { Banner } from '@/components/ui/Banner';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { Chip } from '@/components/ui/Chip';
import { ErrorState } from '@/components/ui/ErrorState';
import { ListRow } from '@/components/ui/ListRow';
import { Screen } from '@/components/ui/Screen';
import { Skeleton } from '@/components/ui/Skeleton';
import { useSession } from '@/features/auth/useSession';
import { DeleteItemSheet, OwnerActionBar } from '@/features/items/components/OwnerActions';
import { OwnerCard } from '@/features/items/components/OwnerCard';
import { PhotoGallery } from '@/features/items/components/PhotoGallery';
import { priceText } from '@/features/items/format';
import { useCategories, useItem } from '@/features/items/hooks';
import type { Item } from '@/features/items/types';
import { es } from '@/i18n/es-MX';
import { formatMXN } from '@/lib/format/money';
import { ApiError } from '@/lib/api/errors';
import { routes } from '@/lib/routes';
import { colors, radius, sizes, spacing } from '@/theme';

const t = es.items.detail;

/** A partir de este largo, las reglas se pliegan a 3 líneas con «Ver más». */
const RULES_FOLD_CHARS = 140;
const RULES_FOLD_LINES = 3;

type ItemDetailScreenProps = {
  id: string;
  /**
   * Barra inferior para quien NO es el dueño: aquí se monta «Solicitar» (spec 007). Si se omite,
   * no se dibuja ninguna acción.
   */
  renderActions?: (item: Item) => ReactNode;
  /** Filas extra del menú «⋯» (p. ej. «Reportar», spec 011). Sin ellas, solo el dueño ve «⋯». */
  renderOwnerExtras?: (item: Item) => ReactNode;
  /** Contenido al final de la pantalla para efectos de otras specs (p. ej. aviso de moderación). */
  renderEffects?: (item: Item) => ReactNode;
};

function DetailSkeleton() {
  return (
    <View style={styles.block} testID="item-detail-skeleton">
      <Skeleton shape="card" />
      <Skeleton shape="line" width="70%" />
      <Skeleton shape="line" width="40%" />
      <Skeleton shape="line" />
      <Skeleton shape="line" width="85%" />
    </View>
  );
}

/**
 * Detalle de un objeto (spec 005 §7.3, RF-06 a RF-08). El dueño ve el valor declarado y las acciones
 * de administración; los demás no (CA-05). Los *slots* permiten que 007, 010 y 011 se conecten sin
 * editar este archivo.
 */
export function ItemDetailScreen({
  id,
  renderActions,
  renderOwnerExtras,
  renderEffects,
}: ItemDetailScreenProps) {
  const router = useRouter();
  const { user } = useSession();
  const query = useItem(id);
  const categories = useCategories();
  const [menuOpen, setMenuOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [rulesOpen, setRulesOpen] = useState(false);

  const item = query.data;
  const isOwner = item !== undefined && user !== null && user.id === item.owner.id;
  const hasMenu = item !== undefined && (isOwner || renderOwnerExtras !== undefined);

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.back}
      onPress={() => router.back()}
      style={styles.round}
    >
      <AppIcon name="arrowBack" />
    </Pressable>
  );

  if (item === undefined) {
    const notFound =
      query.isError && query.error instanceof ApiError && query.error.code === 'not_found';
    return (
      <Screen>
        <View style={styles.topBar}>{back}</View>
        {query.isPending ? (
          <DetailSkeleton />
        ) : notFound ? (
          <EmptyState
            icon="cube"
            title={t.notFoundTitle}
            description={t.notFoundDescription}
            actionLabel={t.notFoundAction}
            onAction={() => router.back()}
          />
        ) : (
          <ErrorState error={query.error} onRetry={() => void query.refetch()} />
        )}
      </Screen>
    );
  }

  const free = priceText(item) === null;
  const categoryLabel =
    categories.data?.find((c) => c.key === item.category)?.label ?? item.category;
  const zone =
    item.zone.neighborhood === null || item.zone.neighborhood === undefined
      ? item.zone.municipality
      : item.zone.neighborhood;
  const rules = item.usageRules ?? '';
  const foldRules = rules.length > RULES_FOLD_CHARS;

  return (
    <Screen
      footer={
        isOwner ? <OwnerActionBar item={item} onProblem={setProblem} /> : renderActions?.(item)
      }
    >
      <View style={styles.topBar}>
        {back}
        {hasMenu ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.more}
            onPress={() => setMenuOpen(true)}
            style={styles.round}
          >
            <AppIcon name="ellipsis" />
          </Pressable>
        ) : null}
      </View>

      {isOwner && item.status === 'paused' ? (
        <Banner variant="warning" message={t.pausedBanner} />
      ) : null}
      {item.status === 'blocked' ? <Banner variant="danger" message={t.blockedBanner} /> : null}
      {problem === null ? null : <FormNotice message={problem} />}

      <PhotoGallery photos={item.photos} />

      <View style={styles.block}>
        <AppText variant="title" accessibilityRole="header">
          {item.title}
        </AppText>
        <View style={styles.chips}>
          <Chip label={categoryLabel} />
          <Chip label={es.items.condition[item.condition]} />
          <Chip label={es.items.modality[item.modality]} />
        </View>
      </View>

      <View style={styles.price}>
        {free ? (
          <Chip label={es.items.money.free} variant="success" />
        ) : (
          <>
            <AppText variant="title">{priceText(item)}</AppText>
            <AppText variant="caption" color="muted">
              {es.items.money.perDay}
            </AppText>
          </>
        )}
      </View>

      {isOwner && item.declaredValueCents !== null ? (
        <View
          style={styles.valueRow}
          accessible
          accessibilityLabel={`${t.declaredValue}, ${es.items.form.private}`}
        >
          <AppIcon name="lock" size="sm" color="muted" />
          <AppText variant="label" color="muted">
            {t.declaredValue}
          </AppText>
          <AppText variant="bodyStrong">{formatMXN(item.declaredValueCents)}</AppText>
          <AppText variant="caption" color="muted">
            {es.items.form.private}
          </AppText>
        </View>
      ) : null}

      <OwnerCard owner={item.owner} onPress={() => router.push(routes.user(item.owner.id))} />

      <View style={styles.chips}>
        <Chip label={`${zone} · ${t.zoneApprox}`} icon="pin" />
      </View>

      {item.description === '' ? null : (
        <View style={styles.block}>
          <AppText variant="subheading" accessibilityRole="header">
            {t.description}
          </AppText>
          <AppText>{item.description}</AppText>
        </View>
      )}

      {rules === '' ? null : (
        <View style={styles.block}>
          <AppText variant="subheading" accessibilityRole="header">
            {t.rules}
          </AppText>
          <AppText numberOfLines={foldRules && !rulesOpen ? RULES_FOLD_LINES : undefined}>
            {rules}
          </AppText>
          {foldRules ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={rulesOpen ? t.seeLess : t.seeMore}
              onPress={() => setRulesOpen((open) => !open)}
              style={styles.more}
            >
              <AppText variant="label" color="primaryInk">
                {rulesOpen ? t.seeLess : t.seeMore}
              </AppText>
            </Pressable>
          ) : null}
        </View>
      )}

      {renderEffects?.(item)}

      <BottomSheet visible={menuOpen && !confirmDelete} onClose={() => setMenuOpen(false)}>
        {isOwner ? (
          <ListRow
            title={es.items.owner.delete}
            leading={<AppIcon name="trash" color="danger" />}
            onPress={() => {
              setConfirmDelete(true);
            }}
          />
        ) : null}
        {renderOwnerExtras?.(item)}
      </BottomSheet>
      {isOwner ? (
        <DeleteItemSheet
          item={item}
          visible={confirmDelete}
          onClose={() => {
            setConfirmDelete(false);
            setMenuOpen(false);
          }}
          onProblem={setProblem}
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  round: {
    width: sizes.roundButton,
    height: sizes.roundButton,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  block: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  price: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  more: { alignSelf: 'flex-start', minHeight: sizes.touch.minSize, justifyContent: 'center' },
});
