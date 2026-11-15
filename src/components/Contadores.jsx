import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

// Tarjeta de progreso compartida por Tareas y Rutinas:
// contador de pendientes, contador de completadas y barra de avance.
// Un solo componente = las dos pantallas se ven y se comportan igual.
export function Contadores({ pendientes, completadas, titulo = "Hoy" }) {
  const total = pendientes + completadas;
  const progreso = total > 0 ? completadas / total : 0;

  return (
    <View style={styles.box}>
      <View style={styles.fila}>
        <Text style={styles.titulo}>{titulo}</Text>
        <Text style={styles.pct}>{Math.round(progreso * 100)}%</Text>
      </View>

      <View style={styles.barra}>
        <View style={[styles.relleno, { width: `${progreso * 100}%` }]} />
      </View>

      <View style={styles.contadores}>
        <View style={styles.contador}>
          <Text style={[styles.numero, { color: colors.warning }]}>
            {pendientes}
          </Text>
          <Text style={styles.label}>Pendientes</Text>
        </View>
        <View style={styles.separador} />
        <View style={styles.contador}>
          <Text style={[styles.numero, { color: colors.success }]}>
            {completadas}
          </Text>
          <Text style={styles.label}>Completadas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  titulo: { fontSize: 13, color: colors.textSecondary },
  pct: { fontSize: 13, fontWeight: "600", color: colors.success },
  barra: {
    height: 5,
    backgroundColor: colors.input,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 12,
  },
  relleno: { height: "100%", backgroundColor: colors.success, borderRadius: 3 },
  contadores: { flexDirection: "row", alignItems: "center" },
  contador: { flex: 1, alignItems: "center" },
  numero: { fontSize: 22, fontWeight: "700" },
  label: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  separador: { width: 1, height: 32, backgroundColor: colors.border },
});
