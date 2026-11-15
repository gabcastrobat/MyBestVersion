import { StyleSheet, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Tarjeta que se marca/desmarca con un toque (tareas, hábitos).
 * La zona marcable se lee como checkbox en TalkBack. Los botones de `acciones`
 * (editar, borrar, menú) van AL LADO, no dentro: un botón dentro de otro
 * elemento accesible no se puede enfocar con el lector de pantalla.
 *
 * @param {boolean}   completada
 * @param {Function}  onPress
 * @param {string}    etiqueta   - texto para lector de pantalla
 * @param {ReactNode} izquierda  - barra de color, check, icono de categoría...
 * @param {ReactNode} acciones   - botones al final de la tarjeta
 * @param {Object}    style      - estilo extra de la zona marcable (padding, gap...)
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
    <View style={[styles.card, completada && styles.done]}>
      <TouchableOpacity
        style={[styles.zona, style]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: !!completada }}
        accessibilityLabel={etiqueta}
      >
        {izquierda}
        <View style={styles.info}>{children}</View>
      </TouchableOpacity>
      {acciones}
    </View>
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
  zona: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "stretch",
  },
  done: { opacity: 0.55 },
  info: { flex: 1 },
});
