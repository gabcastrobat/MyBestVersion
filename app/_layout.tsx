import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useEffect } from "react";
import { StatusBar } from "expo-status-bar";
import { colors } from "../src/constants/colors";
import { useNotificationObserver } from "../src/hooks/useNotificationObserver";
import { pedirPermisos } from "../src/storage/notificaciones";

// Las 6 pestañas visibles, en el orden en que aparecen en la barra.
// Tenerlas en una lista evita repetir el mismo bloque <Tabs.Screen> 6 veces:
// para agregar o reordenar una pestaña solo se toca esta lista.
const PESTANAS = [
  { name: "index", title: "Inicio", icon: "home-outline" },
  { name: "tareas", title: "Tareas", icon: "checkmark-circle-outline" },
  { name: "rutinas", title: "Rutinas", icon: "repeat-outline" },
  { name: "calendario", title: "Calendario", icon: "calendar-outline" },
  { name: "alarmas", title: "Alarmas", icon: "alarm-outline" },
  { name: "gimnasio", title: "Gym", icon: "barbell-outline" },
] as const;

// Pantallas que existen pero NO salen en la barra (href: null).
// Se llega a ellas con accesos directos desde Inicio, con router.push().
const OCULTAS = [
  { name: "gastos", title: "Gastos" },
  { name: "perfil", title: "Perfil" },
];

export default function RootLayout() {
  useNotificationObserver();

  useEffect(() => {
    pedirPermisos();
  }, []);

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
          // Con 6 pestañas el texto por defecto se corta en pantallas angostas
          tabBarLabelStyle: { fontSize: 10 },
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
            options={{ title: p.title, href: null }}
          />
        ))}
      </Tabs>
    </>
  );
}
