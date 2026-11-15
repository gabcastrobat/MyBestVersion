import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Estado vacío de una lista: icono grande + título + frase de ayuda.
 *
 * @param {string} icono     - nombre de Ionicons
 * @param {string} titulo
 * @param {string} subtitulo
 */
export function EstadoVacio({ icono, titulo, subtitulo }) {
  return (
    <View style={styles.box}>
      <Ionicons name={icono} size={52} color={colors.textMuted} />
      <Text style={styles.titulo}>{titulo}</Text>
      {subtitulo ? <Text style={styles.subtitulo}>{subtitulo}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { alignItems: "center", marginTop: 80, gap: 10 },
  titulo: { fontSize: 18, fontWeight: "600", color: colors.textSecondary },
  subtitulo: { fontSize: 14, color: colors.textMuted },
});
