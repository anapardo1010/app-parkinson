import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icono, NombreIcono } from '@/components/Icono';
import { useSesion } from '@/session/Sesion';
import { colores, fuentes } from '@/theme';

const PESTANAS: { nombre: string; titulo: string; icono: NombreIcono }[] = [
  { nombre: 'hoy', titulo: 'Hoy', icono: 'hoy' },
  { nombre: 'tratamiento', titulo: 'Tratamiento', icono: 'tratamiento' },
  { nombre: 'evolucion', titulo: 'Mi evolución', icono: 'evolucion' },
  { nombre: 'aprende', titulo: 'Aprende', icono: 'aprende' },
  { nombre: 'perfil', titulo: 'Perfil', icono: 'perfil' },
];

export default function LayoutPestanas() {
  const { contexto } = useSesion();
  const insets = useSafeAreaInsets();
  if (!contexto) return <Redirect href="/bienvenida" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colores.coralTexto,
        tabBarInactiveTintColor: colores.textoSecundario,
        tabBarStyle: {
          backgroundColor: colores.blanco,
          borderTopColor: colores.borde,
          height: 72 + insets.bottom,
          paddingTop: 8,
          paddingBottom: insets.bottom + 10,
        },
        tabBarLabelPosition: 'below-icon',
        tabBarItemStyle: { paddingHorizontal: 0 },
        tabBarLabelStyle: { fontFamily: fuentes.textoMedio, fontSize: 11.5, letterSpacing: -0.2, marginTop: 2 },
        tabBarIconStyle: { marginBottom: 0 },
        sceneStyle: { backgroundColor: colores.fondo },
      }}
    >
      {PESTANAS.map((p) => (
        <Tabs.Screen
          key={p.nombre}
          name={p.nombre}
          options={{
            title: p.titulo,
            tabBarIcon: ({ color }) => <Icono nombre={p.icono} color={String(color)} grosor={1.5} />,
          }}
        />
      ))}
    </Tabs>
  );
}
