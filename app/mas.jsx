import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../src/constants/colors.js";

// Destinos que ya no tienen pestaña propia en la barra.
// Para agregar uno: la pantalla debe existir en app/ y estar en OCULTAS de _layout.
const DESTINOS = [
  {
    ruta: "/plan",
    icono: "trophy-outline",
    titulo: "Mi plan",
    sub: "Hábitos ancla, victorias rápidas y revisión semanal",
  },
  {
    ruta: "/gimnasio",
    icono: "barbell-outline",
    titulo: "Gym",
    sub: "Rutinas de gimnasio y entrenos",
  },
  {
    ruta: "/alarmas",
    icono: "alarm-outline",
    titulo: "Alarmas",
    sub: "Despertadores con desafío",
  },
  {
    ruta: "/gastos",
    icono: "wallet-outline",
    titulo: "Gastos",
    sub: "Por día, semana y mes",
  },
  {
    ruta: "/perfil",
    icono: "person-outline",
    titulo: "Perfil",
    sub: "Tus datos y foto",
  },
];

export default function MasScreen() {
  const router = useRouter();
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      {DESTINOS.map((d) => (
        <TouchableOpacity
          key={d.ruta}
          style={styles.fila}
          onPress={() => router.push(d.ruta)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`${d.titulo}. ${d.sub}`}
        >
          <View style={styles.iconBox}>
            <Ionicons name={d.icono} size={22} color={colors.text} />
          </View>
          <View style={styles.info}>
            <Text style={styles.titulo}>{d.titulo}</Text>
            <Text style={styles.sub}>{d.sub}</Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    minHeight: 64,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },
  titulo: { fontSize: 15, fontWeight: "600", color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
