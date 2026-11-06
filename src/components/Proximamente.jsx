import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

// Aviso honesto para secciones cuya fase todavía no se implementa.
// Un solo componente para no repetir el mismo diseño en cada pantalla.
export function Proximamente({ icono, titulo, descripcion, fase }) {
  return (
    <View style={styles.container}>
      <Ionicons name={icono} size={56} color={colors.textMuted} />
      <Text style={styles.titulo}>{titulo}</Text>
      <Text style={styles.descripcion}>{descripcion}</Text>
      <Text style={styles.fase}>{fase}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  titulo: { fontSize: 22, fontWeight: "700", color: colors.text },
  descripcion: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },
  fase: { fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
