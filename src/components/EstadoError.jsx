import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";
import { Boton } from "./Boton";

/**
 * Estado de error al cargar datos: explica qué pasó y deja reintentar.
 * Se usa en vez de dejar la pantalla en blanco.
 *
 * @param {string}   mensaje      - qué no se pudo cargar
 * @param {Function} onReintentar
 */
export function EstadoError({ mensaje, onReintentar }) {
  return (
    <View style={styles.box} accessibilityRole="alert">
      <Ionicons name="alert-circle-outline" size={48} color={colors.danger} />
      <Text style={styles.titulo}>Algo salió mal</Text>
      <Text style={styles.mensaje}>{mensaje}</Text>
      <Boton titulo="Reintentar" onPress={onReintentar} style={styles.boton} />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", padding: 24, gap: 10 },
  titulo: { fontSize: 18, fontWeight: "600", color: colors.text },
  mensaje: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  boton: { alignSelf: "stretch", marginTop: 8 },
});
