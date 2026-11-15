import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const CHANNEL_ID = "recordatorios";

// Cómo se muestran las notificaciones cuando la app está abierta (SDK 53+)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// En Android 8+ toda notificación necesita un canal, y debe existir
// ANTES de pedir permisos (Android 13+).
async function crearCanalAndroid() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Recordatorios de rutinas",
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#44ff88",
  });
}

export async function pedirPermisos() {
  try {
    await crearCanalAndroid();
    const actual = await Notifications.getPermissionsAsync();
    if (actual.status === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch (e) {
    console.log("Error pidiendo permisos de notificación:", e);
    return false;
  }
}

// Convierte "7:30 PM" → { hora24: 19, minutos: 30 }
export function parseHora(hora) {
  const [tiempo, periodo] = hora.split(" ");
  const [horas, minutos] = tiempo.split(":").map(Number);
  let hora24 = horas;
  if (periodo === "PM" && horas !== 12) hora24 = horas + 12;
  if (periodo === "AM" && horas === 12) hora24 = 0;
  return { hora24, minutos: minutos || 0 };
}

export async function programarRecordatorio(id, nombre, hora) {
  try {
    const { hora24, minutos } = parseHora(hora);
    await Notifications.scheduleNotificationAsync({
      identifier: id,
      content: {
        title: "⏰ My Best Version",
        body: `Es hora de: ${nombre}`,
        data: { url: "/rutinas", rutinaId: id },
      },
      // Trigger diario: funciona en Android y en iOS
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hora24,
        minute: minutos,
        channelId: CHANNEL_ID,
      },
    });
  } catch (e) {
    console.log("Error programando notificación:", e);
  }
}

export async function cancelarRecordatorio(id) {
  try {
    await Notifications.cancelScheduledNotificationAsync(id);
  } catch (e) {
    console.log("Error cancelando notificación:", e);
  }
}

export async function cancelarTodos() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
