import { StyleSheet, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Tarjeta que se marca/desmarca con un toque (tareas, rutinas).
 * Se lee como checkbox en TalkBack. Los botones de `acciones` van dentro de la
 * tarjeta pero son controles aparte (editar, borrar...).
 *
 * @param {boolean}   completada
 * @param {Function}  onPress
 * @param {string}    etiqueta   - texto para lector de pantalla
 * @param {ReactNode} izquierda  - barra de color, check, icono de categoría...
 * @param {ReactNode} acciones   - botones al final de la tarjeta
 * @param {Object}    style      - estilo extra (padding, gap...)
 */
export function FilaMarcable({
  completada,
  onPress,
  etiqueta,
  izquierda,
  acciones,
  style,
  children,
}) {
  return (
    <TouchableOpacity
      style={[styles.card, completada && styles.done, style]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: !!completada }}
      accessibilityLabel={etiqueta}
    >
      {izquierda}
      <View style={styles.info}>{children}</View>
      {acciones}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  done: { opacity: 0.55 },
  info: { flex: 1 },
});
