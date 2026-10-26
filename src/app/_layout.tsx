import { useEffect } from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { useFonts, Fraunces_500Medium, Fraunces_600SemiBold } from '@expo-google-fonts/fraunces';
import { Inter_300Light, Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorSesion, useSesion } from '@/session/Sesion';
import { colores, fuentes } from '@/theme';
import { ACCION_POSPONER, ACCION_TOMADA, configurarNotificaciones, posponer } from '@/notifications/recordatorios';
import { dosisEnRango, registrarToma } from '@/data/repositorio';
import { fechaISO, sumarDias } from '@/lib/fechas';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Contenido() {
  const { db, error, contexto, refrescar } = useSesion();

  // Respuesta a las notificaciones: "Tomada" registra sin abrir la app; tocarla abre "Hoy".
  useEffect(() => {
    if (Platform.OS === 'web') return;
    configurarNotificaciones().catch(() => {});
    const sub = Notifications.addNotificationResponseReceivedListener(async (r) => {
      const { pacienteId, hora } = (r.notification.request.content.data ?? {}) as { pacienteId?: string; hora?: string };
      if (r.actionIdentifier === ACCION_POSPONER) return posponer(r.notification.request.content);
      if (r.actionIdentifier === ACCION_TOMADA && db && contexto && pacienteId && hora) {
        const hoy = new Date();
        const dosis = await dosisEnRango(db, contexto.usuarioId, pacienteId, fechaISO(hoy), fechaISO(sumarDias(hoy, 1)));
        for (const d of dosis.filter((x) => x.programada.endsWith(hora) && !x.estado)) {
          await registrarToma(db, contexto.usuarioId, d.id, 'tomada');
        }
        refrescar();
        return;
      }
      router.push('/hoy');
    });
    return () => sub.remove();
  }, [db, contexto, refrescar]);

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: colores.fondo }}>
        <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto, textAlign: 'center' }}>
          No se pudo abrir la base de datos local.{'\n'}
          {error}
        </Text>
      </View>
    );
  }
  if (!db) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <ActivityIndicator color={colores.coralBoton} size="large" />
      </View>
    );
  }
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colores.fondo } }}>
      <Stack.Screen name="dosis/[id]" options={{ presentation: 'modal' }} />
    </Stack>
  );
}

export default function Raiz() {
  const [fuentesListas] = useFonts({
    Fraunces_500Medium,
    Fraunces_600SemiBold,
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fuentesListas) SplashScreen.hideAsync().catch(() => {});
  }, [fuentesListas]);

  if (!fuentesListas) return null;

  return (
    <SafeAreaProvider>
      <ProveedorSesion>
        <StatusBar style="dark" />
        <Contenido />
      </ProveedorSesion>
    </SafeAreaProvider>
  );
}
