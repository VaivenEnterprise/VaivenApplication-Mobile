import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { esMX as t } from '@/i18n/es-MX';
import { colors, typography } from '@/theme';

export default function PrototipoTabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize: typography.caption.fontSize,
          fontWeight: typography.caption.fontWeight,
          lineHeight: typography.caption.lineHeight,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabs.home,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              color={focused ? colors.primary : colors.muted}
              name={focused ? 'home' : 'home-outline'}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: t.tabs.explore,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              color={focused ? colors.primary : colors.muted}
              name={focused ? 'search' : 'search-outline'}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="cuenta"
        options={{
          title: t.tabs.profile,
          tabBarIcon: ({ focused, size }) => (
            <Ionicons
              color={focused ? colors.primary : colors.muted}
              name={focused ? 'person' : 'person-outline'}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
}
