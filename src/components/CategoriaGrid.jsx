import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Selector de categorías en forma de chips horizontales.
 *
 * @param {Object} opciones     - { nombre: { icon: string, color: string } }
 * @param {string} seleccionada - Clave actualmente seleccionada
 * @param {Function} onSeleccionar - Callback que recibe el nombre de la categoría
 */
export function CategoriaGrid({ opciones, seleccionada, onSeleccionar }) {
  return (
    <View style={styles.grid}>
      {Object.entries(opciones).map(([nombre, cfg]) => {
        const activa = seleccionada === nombre;
        return (
          <TouchableOpacity
            key={nombre}
            style={[
              styles.chip,
              activa && {
                backgroundColor: cfg.color + "33",
                borderColor: cfg.color,
              },
            ]}
            onPress={() => onSeleccionar(nombre)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={cfg.icon}
              size={16}
              color={activa ? cfg.color : colors.textMuted}
            />
            <Text style={[styles.chipText, activa && { color: cfg.color }]}>
              {nombre}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
