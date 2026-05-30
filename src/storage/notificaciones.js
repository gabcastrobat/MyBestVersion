import * as Notifications from "expo-notifications";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function pedirPermisos() {
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function programarRecordatorio(id, nombre, hora) {
  try {
    const [tiempo, periodo] = hora.split(" ");
    const [horas, minutos] = tiempo.split(":").map(Number);
    let hora24 = horas;
    if (periodo === "PM" && horas !== 12) hora24 = horas + 12;
    if (periodo === "AM" && horas === 12) hora24 = 0;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "⏰ My Best Version",
        body: `Es hora de: ${nombre}`,
      },
      trigger: {
        hour: hora24,
        minute: minutos || 0,
        repeats: true,
      },
      identifier: id,
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
