import { Tabs } from 'expo-router';
import { TabBar } from '@/components/navigation/TabBar';

/**
 * Estructura de pestañas definitiva (spec 003 RF-05). Ninguna otra spec edita este archivo:
 * cada una llena la carpeta de su pestaña.
 *
 * `mensajes` es una pestaña que NO aparece en la barra: `TabBar` solo dibuja las cinco
 * pestañas de `TAB_ITEMS`. No se usa `options={{ href: null }}` porque en Expo Router 58 una
 * pestaña con `href: null` queda `hidden` y navegar hacia ella redirige a otra pestaña, así que
 * el botón de mensajes de Inicio no podría abrirla (decisión D-136 en memoria.md).
 */
export default function TabsLayout() {
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="inicio" />
      <Tabs.Screen name="explorar" />
      <Tabs.Screen name="mis-objetos" />
      <Tabs.Screen name="actividad" />
      <Tabs.Screen name="perfil" />
      <Tabs.Screen name="mensajes" />
    </Tabs>
  );
}
