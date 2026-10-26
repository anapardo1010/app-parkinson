import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Recordatorios locales de medicamento. Se programan en el propio celular, así que
 * funcionan sin internet. Por privacidad, la notificación NO muestra el nombre del medicamento.
 */

export const CATEGORIA_DOSIS = 'dosis';
export const ACCION_TOMADA = 'tomada';
export const ACCION_POSPONER = 'posponer';

const disponible = Platform.OS !== 'web';

export async function configurarNotificaciones() {
  if (!disponible) return;
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
  await Notifications.setNotificationCategoryAsync(CATEGORIA_DOSIS, [
    { identifier: ACCION_TOMADA, buttonTitle: 'Tomada', options: { opensAppToForeground: false } },
    { identifier: ACCION_POSPONER, buttonTitle: 'Recordarme en 15 minutos', options: { opensAppToForeground: false } },
  ]);
}

/** Programa un recordatorio diario por cada hora distinta del tratamiento. Devuelve si quedó activo. */
export async function programarRecordatorios(pacienteId: string, horas: string[]): Promise<boolean> {
  if (!disponible) return false;
  const permiso = await Notifications.requestPermissionsAsync();
  if (!permiso.granted) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const hora of Array.from(new Set(horas)).sort()) {
    const [h, m] = hora.split(':').map(Number);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de su medicamento',
        body: `Dosis de las ${hora} · Toque para registrarla`,
        categoryIdentifier: CATEGORIA_DOSIS,
        data: { pacienteId, hora },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: h, minute: m },
    });
  }
  return true;
}

export async function posponer(contenido: Notifications.NotificationContent) {
  if (!disponible) return;
  await Notifications.scheduleNotificationAsync({
    content: { title: contenido.title ?? '', body: contenido.body ?? '', categoryIdentifier: CATEGORIA_DOSIS, data: contenido.data },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 15 * 60 },
  });
}

export const notificacionesDisponibles = disponible;
