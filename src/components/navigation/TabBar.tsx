import type { Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppIcon, type IconName } from '@/components/ui/AppIcon';
import { AppText } from '@/components/ui/AppText';
import { es } from '@/i18n/es-MX';
import { colors, radius, shadows, sizes, spacing } from '@/theme';

/** Propiedades que `Tabs` entrega a una barra propia. */
export type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

type TabItem = { name: string; label: string; icon: IconName };

/**
 * Las cinco pestañas visibles, en orden (spec 003 RF-05). `mensajes` existe como ruta de
 * pestaña pero no aparece aquí: se abre desde el botón de mensajes de Inicio.
 */
export const TAB_ITEMS: readonly TabItem[] = [
  { name: 'inicio', label: es.tabs.home, icon: 'home' },
  { name: 'explorar', label: es.tabs.explore, icon: 'compass' },
  { name: 'mis-objetos', label: es.tabs.myItems, icon: 'cube' },
  { name: 'actividad', label: es.tabs.activity, icon: 'swap' },
  { name: 'perfil', label: es.tabs.profile, icon: 'person' },
];

/** Barra de pestañas propia: la activa lleva una píldora `primarySoft` y todas muestran su etiqueta. */
export function TabBar({ state, navigateToTab, insets }: TabBarProps) {
  const activeKey = state.routes[state.index]?.key;

  return (
    <View accessibilityRole="tablist" style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {TAB_ITEMS.map((item) => {
        const route = state.routes.find((candidate) => candidate.name === item.name);
        if (route === undefined) return null;
        const selected = route.key === activeKey;
        const tone = selected ? 'primaryInk' : 'muted';
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={item.label}
            accessibilityState={{ selected }}
            onPress={() => navigateToTab(route.key)}
            style={styles.item}
          >
            <View style={[styles.pill, selected && styles.pillActive]}>
              <AppIcon name={item.icon} color={tone} />
              <AppText
                variant="tab"
                color={tone}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
              >
                {item.label}
              </AppText>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    minHeight: sizes.tabBar.height,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadows.soft,
  },
  item: {
    flex: 1,
    minHeight: sizes.touch.minSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pill: {
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: sizes.tabBar.pillPaddingX,
    paddingVertical: sizes.tabBar.pillPaddingY,
    borderRadius: radius.pill,
  },
  pillActive: { backgroundColor: colors.primarySoft },
});
