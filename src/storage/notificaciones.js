import * as Notifications from "expo-notifications";
import * as Router from "expo-router";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function pedirPermisos() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function programarRecordatorio(id, nombre, hora) {
  try {
    console.log("🔔 Programando notificación:", { id, nombre, hora });
    
    const [tiempo, periodo] = hora.split(" ");
    const [horas, minutos] = tiempo.split(":").map(Number);
    let hora24 = horas;
    if (periodo === "PM" && horas !== 12) hora24 = horas + 12;
    if (periodo === "AM" && horas === 12) hora24 = 0;

    console.log("⏰ Hora convertida a 24h:", { hora24, minutos });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ My Best Version",
        body: `Es hora de: ${nombre}`,
        data: { rutinId: id },
      },
      trigger: {
        hour: hora24,
        minute: minutos || 0,
        repeats: true,
      },
      identifier: id,
    });

    console.log("✅ Notificación programada correctamente");
  } catch (e) {
    console.error("❌ Error programando notificación:", e);
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

// Escuchar clics en notificaciones
export function setupNotificationListeners() {
  // Listener para cuando el usuario toca la notificación (background/cerrada)
  const subscription1 = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      console.log("📱 Clic en notificación:", response);
      Router.push("/rutinas");
    }
  );

  // Listener para notificaciones que llegan mientras la app está abierta
  const subscription2 = Notifications.addNotificationReceivedListener(
    (notification) => {
      console.log("🔔 Notificación recibida en foreground:", notification);
    }
  );

  return () => {
    subscription1.remove();
    subscription2.remove();
  };
}
