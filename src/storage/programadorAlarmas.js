import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  AndroidNotificationSetting,
  RepeatFrequency,
  TriggerType,
} from "react-native-notify-kit";
import { Platform } from "react-native";
import {
  DESAFIOS,
  getAlarmas,
  proximaEnDia,
  proximaUnaVez,
  textoHora,
} from "./alarmas";

// Conecta las alarmas guardadas con el AlarmManager de Android.
//
// Idea clave: en vez de ir sumando y restando alarmas sueltas (fácil que
// queden "fantasmas"), cada vez que algo cambia BORRAMOS todas las que
// programamos y las volvemos a crear desde el storage. El storage es la
// única fuente de verdad; Android solo tiene una copia.

// Si cambias algo del canal (sonido, vibración) hay que cambiar el id:
// Android no deja modificar un canal ya creado.
const CANAL = "alarmas-v1";
const PREFIJO = "alarma:";

const esAndroid = Platform.OS === "android";

async function crearCanal() {
  await notifee.createChannel({
    id: CANAL,
    name: "Alarmas",
    description: "Alarmas que se apagan con un desafío físico",
    importance: AndroidImportance.HIGH,
    sound: "default",
    vibration: true,
    vibrationPattern: [500, 500, 500, 500],
    bypassDnd: true, // sonar aunque esté en "No molestar" (si el usuario lo permite)
  });
}

function construirNotificacion(alarma, idNotificacion) {
  const d = DESAFIOS[alarma.desafio];
  const que = d.unidad === "seg" ? `${alarma.cantidad} s de ${d.label.toLowerCase()}` : `${alarma.cantidad} ${d.label.toLowerCase()}`;
  return {
    id: idNotificacion,
    title: `⏰ ${textoHora(alarma.hora, alarma.minuto)}${alarma.etiqueta ? ` · ${alarma.etiqueta}` : ""}`,
    body: `${d.icono} Haz ${que} para apagarla`,
    // Lo que leerá la pantalla del desafío para saber qué alarma sonó
    data: { tipo: "alarma", alarmaId: alarma.id },
    android: {
      channelId: CANAL,
      category: AndroidCategory.ALARM,
      importance: AndroidImportance.HIGH,
      // Abre la app a pantalla completa aunque el celular esté bloqueado
      fullScreenAction: { id: "default" },
      pressAction: { id: "default" },
      // PASO ACTUAL: todavía no existe la pantalla del desafío, así que la
      // notificación se puede deslizar y el sonido suena una vez.
      // En el paso siguiente pasan a ongoing: true (no se puede quitar) y
      // el sonido en bucle lo pone expo-audio hasta completar el ejercicio.
      ongoing: false,
      autoCancel: true,
      lightUpScreen: true,
    },
  };
}

function construirTrigger(timestamp, repetirSemanal) {
  return {
    type: TriggerType.TIMESTAMP,
    timestamp,
    repeatFrequency: repetirSemanal ? RepeatFrequency.WEEKLY : RepeatFrequency.NONE,
    // SET_ALARM_CLOCK es el modo que usan las apps de reloj: Android lo trata
    // como alarma "de verdad" (sale el icono ⏰ arriba y no lo retrasa
    // el ahorro de batería). Es el más fiable en Xiaomi/HyperOS.
    alarmManager: { type: AlarmType.SET_ALARM_CLOCK },
  };
}

// Borra todas nuestras alarmas programadas y las vuelve a crear.
export async function reprogramarAlarmas() {
  if (!esAndroid) return;
  await crearCanal();

  const ids = await notifee.getTriggerNotificationIds();
  // (la de prueba no se toca: es temporal y se borra sola al sonar)
  const nuestras = ids.filter((id) => id.startsWith(PREFIJO) && id !== `${PREFIJO}prueba`);
  if (nuestras.length) await notifee.cancelTriggerNotifications(nuestras);

  const ahora = new Date();
  const alarmas = (await getAlarmas()).filter((a) => a.activa);

  for (const alarma of alarmas) {
    if (alarma.dias.length === 0) {
      // Una sola vez: un único disparo, sin repetición
      const fecha = proximaUnaVez(alarma, ahora);
      await notifee.createTriggerNotification(
        construirNotificacion(alarma, `${PREFIJO}${alarma.id}:una`),
        construirTrigger(fecha.getTime(), false),
      );
    } else {
      // Un disparo por cada día elegido, que se repite cada semana
      for (const dia of alarma.dias) {
        const fecha = proximaEnDia(alarma, dia, ahora);
        await notifee.createTriggerNotification(
          construirNotificacion(alarma, `${PREFIJO}${alarma.id}:${dia}`),
          construirTrigger(fecha.getTime(), true),
        );
      }
    }
  }
}

// Programa un disparo de prueba dentro de `segundos` (para comprobar que
// suena con la pantalla bloqueada sin esperar a la hora real).
export async function probarAlarma(alarma, segundos = 10) {
  if (!esAndroid) return;
  await crearCanal();
  await notifee.createTriggerNotification(
    construirNotificacion(alarma, `${PREFIJO}prueba`),
    construirTrigger(Date.now() + segundos * 1000, false),
  );
}

// ───────────────────────── Permisos ─────────────────────────
// En Android moderno una alarma puede fallar en silencio por 3 motivos.
// Los revisamos para avisar en la pantalla en vez de descubrirlo a las 6 AM.

export async function estadoPermisosAlarma() {
  if (!esAndroid) return { exactas: true, pantallaCompleta: true, bateria: true };
  const ajustes = await notifee.getNotificationSettings();
  const pantalla = ajustes.android.fullScreenIntent;
  const ahorroActivo = await notifee.isBatteryOptimizationEnabled();
  return {
    // Permiso de "alarmas y recordatorios" (Android 12+)
    exactas: ajustes.android.alarm !== AndroidNotificationSetting.DISABLED,
    // Permiso de notificaciones a pantalla completa (Android 14+)
    pantallaCompleta: pantalla !== AndroidNotificationSetting.DISABLED,
    // Que el ahorro de batería no "duerma" la app
    bateria: !ahorroActivo,
  };
}

export async function abrirAjuste(tipo) {
  if (tipo === "exactas") return notifee.openAlarmPermissionSettings();
  // El interruptor de pantalla completa vive en los ajustes de
  // notificaciones de la app
  if (tipo === "pantallaCompleta") return notifee.openNotificationSettings();
  if (tipo === "bateria") return notifee.openBatteryOptimizationSettings();
}
