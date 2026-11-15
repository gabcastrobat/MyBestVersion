import { Modal, StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Hoja inferior modal (el "modal que sube desde abajo" de toda la app).
 *
 * @param {boolean}  visible
 * @param {Function} onClose  - botón atrás de Android
 * @param {string}   titulo
 * @param {Object}   style    - estilo extra para la hoja (ej: { maxHeight: "75%" })
 */
export function BottomSheet({ visible, onClose, titulo, children, style }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheet, style]}>
          {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  titulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
});
