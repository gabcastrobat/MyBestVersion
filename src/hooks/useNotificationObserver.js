import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

/**
 * Navega a la pantalla indicada en `data.url` cuando el usuario toca
 * una notificación, tanto con la app abierta como cuando la abre desde
 * cerrada (cold start).
 *
 * Reemplaza el viejo `import * as Router` + `Router.push`, que no
 * funciona con Expo Router v3+: hay que usar el objeto `router`.
 */
export function useNotificationObserver() {
  useEffect(() => {
    let activo = true;

    function redirigir(notification) {
      const url = notification?.request?.content?.data?.url;
      if (typeof url === "string") {
        router.push(url);
        Notifications.clearLastNotificationResponseAsync();
      }
    }

    // App abierta desde una notificación estando cerrada
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (activo && response?.notification) redirigir(response.notification);
    });

    // App en primer o segundo plano
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => redirigir(response.notification),
    );

    return () => {
      activo = false;
      sub.remove();
    };
  }, []);
}
