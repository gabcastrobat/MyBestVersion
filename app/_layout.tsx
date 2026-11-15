import { Ionicons } from "@expo/vector-icons";
import { type Href, Tabs, useRouter } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { TouchableOpacity } from "react-native";
import { colors } from "../src/constants/colors";
import { useNotificationObserver } from "../src/hooks/useNotificationObserver";
import { pedirPermisos } from "../src/storage/notificaciones";
import { reprogramarAlarmas } from "../src/storage/programadorAlarmas";

// Las 5 pestañas visibles, en el orden en que aparecen en la barra.
// Lo demás (Plan, Gym, Alarmas, Gastos, Perfil) se llega desde "Más".
const PESTANAS = [
  { name: "index", title: "Hoy", icon: "today-outline" },
  { name: "rutinas", title: "Rutinas", icon: "repeat-outline" },
  { name: "tareas", title: "Tareas", icon: "checkmark-circle-outline" },
  { name: "calendario", title: "Calendario", icon: "calendar-outline" },
  { name: "mas", title: "Más", icon: "ellipsis-horizontal-circle-outline" },
] as const;

// Pantallas que existen pero NO salen en la barra (href: null).
// `atras: true` les agrega una flecha de volver en el encabezado.
// "entreno" (entreno en curso) no la lleva: no se debe abandonar por error.
const OCULTAS = [
  { name: "plan", title: "Mi plan", atras: true },
  { name: "gimnasio", title: "Gym", atras: true },
  { name: "alarmas", title: "Alarmas", atras: true },
  { name: "gastos", title: "Gastos", atras: true },
  { name: "perfil", title: "Perfil", atras: true },
  { name: "entreno", title: "Entreno en curso", atras: false },
];

export default function RootLayout() {
  useNotificationObserver();
  const router = useRouter();

  useEffect(() => {
    // Primero el permiso de notificaciones; después se vuelven a programar
    // las alarmas por si Android las perdió (ej: al actualizar la app).
    pedirPermisos().then(() =>
      reprogramarAlarmas().catch((e) => console.log("Error programando alarmas:", e)),
    );
  }, []);

  // Si no hay historial (ej: se abrió desde una notificación) vuelve a "Más"
  function volver() {
    if (router.canGoBack()) router.back();
    // El cast evita el error de tipos mientras Expo no regenere las rutas tipadas
    else router.replace("/mas" as Href);
  }

  return (
    <>
      <StatusBar style="light" />
      <Tabs
        screenOptions={{
          sceneStyle: { backgroundColor: colors.background },
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
          },
          tabBarLabelStyle: { fontSize: 12 },
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textMuted,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
        }}
      >
        {PESTANAS.map((p) => (
          <Tabs.Screen
            key={p.name}
            name={p.name}
            options={{
              title: p.title,
              tabBarIcon: ({ color, size }) => (
                <Ionicons name={p.icon} size={size} color={color} />
              ),
            }}
          />
        ))}
        {OCULTAS.map((p) => (
          <Tabs.Screen
            key={p.name}
            name={p.name}
            options={{
              title: p.title,
              href: null,
              headerLeft: p.atras
                ? () => (
                    <TouchableOpacity
                      onPress={volver}
                      style={{ paddingHorizontal: 16, paddingVertical: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel="Volver"
                    >
                      <Ionicons
                        name="arrow-back"
                        size={22}
                        color={colors.text}
                      />
                    </TouchableOpacity>
                  )
                : undefined,
            }}
          />
        ))}
      </Tabs>
    </>
  );
}
