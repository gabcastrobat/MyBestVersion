import { StyleSheet, Text, TextInput } from "react-native";
import { colors } from "../constants/colors";

/**
 * Campo de texto con etiqueta opcional y mensaje de error bajo el campo.
 * Acepta cualquier prop de TextInput (value, onChangeText, multiline, ...).
 *
 * @param {string} label - etiqueta sobre el campo (opcional)
 * @param {string} error - mensaje de error; si existe se muestra en rojo
 */
export function Campo({ label, error, style, ...inputProps }) {
  return (
    <>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TextInput
        placeholderTextColor={colors.textMuted}
        accessibilityLabel={label || inputProps.placeholder}
        {...inputProps}
        style={[styles.input, error ? styles.inputError : null, style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  inputError: { marginBottom: 4 },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
});
