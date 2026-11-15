import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { colors } from "../constants/colors";

/**
 * Gráfico de barras horizontales: cuánto se gastó en cada categoría.
 *
 * @param {Array}  gastos  - Gastos ya filtrados por la vista (Hoy/Semana/Mes)
 * @param {Object} config  - { categoria: { icon, color } }
 */
export function GastosPorCategoria({ gastos, config }) {
  const totales = {};
  for (const g of gastos) {
    const cat = config[g.categoria] ? g.categoria : "Otro";
    totales[cat] = (totales[cat] || 0) + (Number(g.monto) || 0);
  }

  const filas = Object.entries(totales)
    .filter(([, monto]) => monto > 0)
    .sort((a, b) => b[1] - a[1]);

  if (filas.length === 0) return null;

  const total = filas.reduce((s, [, m]) => s + m, 0);
  const maximo = filas[0][1];

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>Por categoría</Text>

      {/* Barra apilada con la proporción de cada categoría */}
      <View style={styles.barraApilada}>
        {filas.map(([cat, monto]) => (
          <View
            key={cat}
            style={{ flex: monto, backgroundColor: config[cat].color }}
          />
        ))}
      </View>

      {filas.map(([cat, monto]) => {
        const cfg = config[cat];
        const pct = Math.round((monto / total) * 100);
        return (
          <View key={cat} style={styles.fila}>
            <View style={styles.filaHeader}>
              <Ionicons name={cfg.icon} size={14} color={cfg.color} />
              <Text style={styles.nombre}>{cat}</Text>
              <Text style={styles.monto}>
                ${monto.toLocaleString("es-CO")}
              </Text>
              <Text style={styles.pct}>{pct}%</Text>
            </View>
            <View style={styles.track}>
              <View
                style={[
                  styles.fill,
                  {
                    width: `${(monto / maximo) * 100}%`,
                    backgroundColor: cfg.color,
                  },
                ]}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  barraApilada: {
    flexDirection: "row",
    height: 10,
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 14,
    gap: 2,
  },
  fila: { marginBottom: 10 },
  filaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 5,
  },
  nombre: { flex: 1, color: colors.text, fontSize: 13 },
  monto: { color: colors.text, fontSize: 13, fontWeight: "600" },
  pct: {
    color: colors.textMuted,
    fontSize: 12,
    width: 36,
    textAlign: "right",
  },
  track: {
    height: 6,
    backgroundColor: colors.input,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: { height: "100%", borderRadius: 3 },
});
