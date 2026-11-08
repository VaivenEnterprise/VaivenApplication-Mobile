import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { AppText, EmptyState, Screen } from '@/components/ui';
import { ToolCard } from '@/features/tools/components/ToolCard';
import { useTools, type ToolFilter } from '@/features/tools/hooks';
import { esMX as t } from '@/i18n/es-MX';
import { borders, colors, radius, spacing, touch } from '@/theme';

const filters: { key: ToolFilter; label: string }[] = [
  { key: 'all', label: t.explore.filters.all },
  { key: 'tools', label: t.explore.filters.tools },
  { key: 'garden', label: t.explore.filters.garden },
  { key: 'kitchen', label: t.explore.filters.kitchen },
];

type FilterChipProps = {
  label: string;
  active: boolean;
  onPress: () => void;
};

function FilterChip({ label, active, onPress }: FilterChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, active && styles.chipActive, pressed && styles.pressed]}
    >
      <AppText variant="label" color={active ? 'onPrimary' : 'ink'}>
        {label}
      </AppText>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<ToolFilter>('all');
  const tools = useTools(filter);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <AppText variant="title">{t.explore.title}</AppText>
        <AppText color="muted">{t.explore.subtitle}</AppText>
      </View>

      <View accessible accessibilityLabel={t.explore.mapPlaceholder} style={styles.map}>
        <Ionicons color={colors.primary} name="map-outline" size={32} />
        <AppText variant="label" color="primary">
          {t.explore.mapPlaceholder}
        </AppText>
      </View>

      <ScrollView
        contentContainerStyle={styles.chips}
        horizontal
        showsHorizontalScrollIndicator={false}
      >
        {filters.map((item) => (
          <FilterChip
            key={item.key}
            active={filter === item.key}
            label={item.label}
            onPress={() => setFilter(item.key)}
          />
        ))}
      </ScrollView>

      <View style={styles.list}>
        {tools.length === 0 ? (
          <EmptyState title={t.explore.title} message={t.explore.empty} />
        ) : (
          tools.map((tool) => (
            <ToolCard
              key={tool.id}
              tool={tool}
              onPress={() => router.push(`/prototipo/herramienta/${tool.id}`)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  chip: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: borders.width,
    justifyContent: 'center',
    minHeight: touch.minSize,
    paddingHorizontal: spacing.md,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chips: {
    gap: spacing.sm,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingTop: spacing.md,
  },
  header: {
    gap: spacing.xs,
  },
  list: {
    gap: spacing.sm,
  },
  map: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: borders.width,
    gap: spacing.sm,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  pressed: {
    opacity: 0.85,
  },
});
