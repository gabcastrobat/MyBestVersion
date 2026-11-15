import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { colors } from "../constants/colors";
import { CATEGORIAS } from "../constants/planMejora";
import { diasEstaSemana, racha } from "../storage/plan";
import { hoy } from "../utils/fechas";
import { FilaMarcable } from "./FilaMarcable";

/**
 * Tarjeta de un hábito (Hoy y Hábitos). Dos formas:
 * - Sin versión mínima: fila compacta, un toque la marca como hecha.
 * - Con versión mínima: tarjeta con botones "Hecho" y "Versión mínima".
 *
 * @param {Object}    habito
 * @param {Function}  onMarcar - recibe "completo" | "minimo"
 * @param {ReactNode} acciones - botones extra a la derecha (menú ⋯, etc.)
 */
export function TarjetaHabito({ habito, onMarcar, acciones }) {
  const fecha = hoy();
  const marca = habito.dias[fecha]; // "completo" | "minimo" | undefined
  const hecho = !!marca;
  const cfg = CATEGORIAS[habito.categoria] ?? CATEGORIAS.General;
  const dias = racha(habito);
  const enSemana = diasEstaSemana(habito);

  const meta = [
    habito.hora,
    habito.categoria,
    habito.ancla ? "Ancla" : null,
    habito.metaSemanal < 7 ? `${enSemana}/${habito.metaSemanal} esta semana` : null,
    dias > 0 ? `🔥 ${dias} día${dias === 1 ? "" : "s"}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  function marcar(tipo) {
    if (marca !== tipo)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onMarcar(tipo);
  }

  if (!habito.minimo) {
    return (
      <FilaMarcable
        completada={hecho}
        onPress={() => marcar("completo")}
        etiqueta={`Hábito ${habito.nombre}${habito.hora ? `, ${habito.hora}` : ""}`}
        style={styles.fila}
        izquierda={
          <View style={[styles.check, hecho && styles.checkDone]}>
            {hecho && (
              <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
            )}
          </View>
        }
        acciones={acciones}
      >
        <Text style={[styles.nombre, hecho && styles.tachado]}>
          {habito.nombre}
        </Text>
        <Text style={styles.meta}>{meta}</Text>
      </FilaMarcable>
    );
  }

  return (
    <View style={[styles.card, hecho && styles.cardHecha]}>
      <View style={styles.top}>
        <View style={[styles.icono, { backgroundColor: cfg.color + "22" }]}>
          <Ionicons name={cfg.icon} size={18} color={cfg.color} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.nombre, hecho && styles.tachado]}>
            {habito.nombre}
          </Text>
          <Text style={styles.meta}>
            {meta ? `${meta} · ` : ""}Mínimo: {habito.minimo}
          </Text>
        </View>
        {acciones}
      </View>
      <View style={styles.botones}>
        <TouchableOpacity
          style={[styles.marcaBtn, marca === "completo" && styles.marcaCompleto]}
          onPress={() => marcar("completo")}
          accessibilityRole="button"
          accessibilityState={{ selected: marca === "completo" }}
          accessibilityLabel={`Marcar hecho: ${habito.nombre}`}
        >
          <Text
            style={[
              styles.marcaText,
              marca === "completo" && styles.marcaTextActivo,
            ]}
          >
            ✓ Hecho
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.marcaBtn, marca === "minimo" && styles.marcaMinimo]}
          onPress={() => marcar("minimo")}
          accessibilityRole="button"
          accessibilityState={{ selected: marca === "minimo" }}
          accessibilityLabel={`Marcar versión mínima: ${habito.nombre}`}
        >
          <Text
            style={[
              styles.marcaText,
              marca === "minimo" && styles.marcaTextActivo,
            ]}
          >
            Versión mínima
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { padding: 14, gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  cardHecha: { opacity: 0.7 },
  top: { flexDirection: "row", alignItems: "center", gap: 12 },
  icono: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1 },

  nombre: { color: colors.text, fontSize: 15, fontWeight: "500" },
  tachado: { textDecorationLine: "line-through", color: colors.textMuted },
  meta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },

  botones: { flexDirection: "row", gap: 8 },
  marcaBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.input,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  marcaCompleto: { backgroundColor: colors.success },
  marcaMinimo: { backgroundColor: colors.warning },
  marcaText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
  marcaTextActivo: { color: colors.onPrimary },
});
