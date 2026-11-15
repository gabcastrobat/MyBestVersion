import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { colors } from "../constants/colors";

/**
 * Botón base. Alto mínimo de 48 para cumplir el objetivo táctil de Android.
 *
 * @param {string}   titulo
 * @param {Function} onPress
 * @param {"primario"|"texto"} variante - "primario" = relleno blanco;
 *                                        "texto" = enlace (ej: Cancelar)
 * @param {Object}   style - estilo extra para el contenedor
 */
export function Boton({ titulo, onPress, variante = "primario", style }) {
  const esPrimario = variante === "primario";
  return (
    <TouchableOpacity
      style={[esPrimario ? styles.primario : styles.texto, style]}
      onPress={onPress}
      activeOpacity={0.8}
      accessibilityRole="button"
    >
      <Text style={esPrimario ? styles.primarioText : styles.textoText}>
        {titulo}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  primario: {
    backgroundColor: colors.primary,
    minHeight: 48,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  primarioText: { color: colors.onPrimary, fontWeight: "600", fontSize: 15 },
  texto: {
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  textoText: { color: colors.textSecondary, fontSize: 14 },
});
