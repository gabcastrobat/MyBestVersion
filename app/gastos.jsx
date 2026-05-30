import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors.js";
import { deleteGasto, getGastos, saveGasto } from "../src/storage/gastos";

const categoriaConfig = {
  Comida: { icon: "fast-food-outline", color: "#ff6b6b" },
  Transporte: { icon: "car-outline", color: "#4488ff" },
  Estudio: { icon: "book-outline", color: "#aa44ff" },
  Ocio: { icon: "game-controller-outline", color: "#ffaa00" },
  Salud: { icon: "medkit-outline", color: "#44ff88" },
  Otro: { icon: "ellipsis-horizontal-outline", color: "#888888" },
};

const vistas = ["Hoy", "Semana", "Mes"];
function formatFecha(isoString, vista) {
  const d = new Date(isoString);
  const dias = [
    "Domingo",
    "Lunes",
    "Martes",
    "Miércoles",
    "Jueves",
    "Viernes",
    "Sábado",
  ];
  const meses = [
    "Ene",
    "Feb",
    "Mar",
    "Abr",
    "May",
    "Jun",
    "Jul",
    "Ago",
    "Sep",
    "Oct",
    "Nov",
    "Dic",
  ];
  const periodo = d.getHours() >= 12 ? "PM" : "AM";
  const horaFormato = `${d.getHours() % 12 || 12}:${d.getMinutes().toString().padStart(2, "0")} ${periodo}`;

  if (vista === "Hoy") {
    return `Hoy · ${horaFormato}`;
  } else if (vista === "Semana") {
    return `${dias[d.getDay()]} · ${horaFormato}`;
  } else {
    return `${d.getDate()} ${meses[d.getMonth()]} · ${horaFormato}`;
  }
}

function esMismodia(fecha1, fecha2) {
  return fecha1.toDateString() === fecha2.toDateString();
}

function esMismaSemana(fecha) {
  const hoy = new Date();
  const inicio = new Date(hoy);
  inicio.setDate(hoy.getDate() - hoy.getDay());
  inicio.setHours(0, 0, 0, 0);
  return fecha >= inicio;
}

function esMismoMes(fecha) {
  const hoy = new Date();
  return (
    fecha.getMonth() === hoy.getMonth() &&
    fecha.getFullYear() === hoy.getFullYear()
  );
}

export default function GastosScreen() {
  const [gastos, setGastos] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [categoria, setCategoria] = useState("Comida");
  const [vista, setVista] = useState("Hoy");

  useFocusEffect(
    useCallback(() => {
      async function cargar() {
        const data = await getGastos();
        setGastos(data);
      }
      cargar();
    }, []),
  );

  async function handleAgregar() {
    if (!descripcion.trim() || !monto.trim()) return;
    const nuevo = await saveGasto({ descripcion, monto, categoria });
    setGastos((prev) => [...prev, nuevo]);
    setDescripcion("");
    setMonto("");
    setCategoria("Comida");
    setModalVisible(false);
  }

  async function handleEliminar(id) {
    const filtrados = await deleteGasto(id);
    setGastos(filtrados);
  }

  const hoy = new Date();
  const gastosFiltrados = gastos.filter((g) => {
    const fecha = new Date(g.fecha);
    if (vista === "Hoy") return esMismodia(fecha, hoy);
    if (vista === "Semana") return esMismaSemana(fecha);
    if (vista === "Mes") return esMismoMes(fecha);
    return true;
  });

  const total = gastosFiltrados.reduce((sum, g) => sum + g.monto, 0);
  const categorias = Object.keys(categoriaConfig);

  return (
    <View style={styles.container}>
      {/* Selector de vista */}
      <View style={styles.vistasRow}>
        {vistas.map((v) => (
          <TouchableOpacity
            key={v}
            style={[styles.vistaBtn, vista === v && styles.vistaBtnActive]}
            onPress={() => setVista(v)}
          >
            <Text
              style={[
                styles.vistaBtnText,
                vista === v && styles.vistaBtnTextActive,
              ]}
            >
              {v}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total {vista.toLowerCase()}</Text>
        <Text style={styles.totalMonto}>${total.toLocaleString("es-CO")}</Text>
        <Text style={styles.totalSub}>
          {gastosFiltrados.length} gastos registrados
        </Text>
      </View>

      {/* Lista */}
      <FlatList
        data={[...gastosFiltrados].reverse()}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="wallet-outline"
              size={52}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitulo}>Sin gastos</Text>
            <Text style={styles.emptySubtitulo}>
              Registra tu primer gasto del {vista.toLowerCase()}
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = categoriaConfig[item.categoria] || categoriaConfig.Otro;
          return (
            <View style={styles.card}>
              <View
                style={[styles.iconBox, { backgroundColor: cfg.color + "22" }]}
              >
                <Ionicons name={cfg.icon} size={22} color={cfg.color} />
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardDesc}>{item.descripcion}</Text>
                <Text style={styles.cardMeta}>
                  {item.categoria} · {formatFecha(item.fecha, vista)}
                </Text>
              </View>
              <Text style={styles.cardMonto}>
                ${item.monto.toLocaleString("es-CO")}
              </Text>
              <TouchableOpacity
                onPress={() => handleEliminar(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={22} color={colors.background} />
        <Text style={styles.fabText}>Nuevo gasto</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nuevo Gasto</Text>

            <TextInput
              style={styles.input}
              placeholder="¿En qué gastaste?"
              placeholderTextColor={colors.textMuted}
              value={descripcion}
              onChangeText={setDescripcion}
            />

            <TextInput
              style={styles.input}
              placeholder="Monto ($)"
              placeholderTextColor={colors.textMuted}
              value={monto}
              onChangeText={setMonto}
              keyboardType="numeric"
            />

            <Text style={styles.label}>Categoría</Text>
            <View style={styles.categoriasGrid}>
              {categorias.map((c) => {
                const cfg = categoriaConfig[c];
                const activa = categoria === c;
                return (
                  <TouchableOpacity
                    key={c}
                    style={[
                      styles.categoriaBtn,
                      activa && {
                        backgroundColor: cfg.color + "33",
                        borderColor: cfg.color,
                      },
                    ]}
                    onPress={() => setCategoria(c)}
                  >
                    <Ionicons
                      name={cfg.icon}
                      size={16}
                      color={activa ? cfg.color : colors.textMuted}
                    />
                    <Text
                      style={[
                        styles.categoriaBtnText,
                        activa && { color: cfg.color },
                      ]}
                    >
                      {c}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity style={styles.boton} onPress={handleAgregar}>
              <Text style={styles.botonText}>Guardar gasto</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelar}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lista: { padding: 16, paddingBottom: 100 },

  vistasRow: {
    flexDirection: "row",
    margin: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
  },
  vistaBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  vistaBtnActive: { backgroundColor: colors.primary },
  vistaBtnText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: "500",
  },
  vistaBtnTextActive: { color: colors.background, fontWeight: "600" },

  totalCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 18,
  },
  totalLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  totalMonto: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  totalSub: { fontSize: 12, color: colors.textMuted },

  emptyBox: { alignItems: "center", marginTop: 60, gap: 10 },
  emptyTitulo: { fontSize: 18, fontWeight: "600", color: colors.textSecondary },
  emptySubtitulo: { fontSize: 14, color: colors.textMuted },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  cardDesc: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 3,
  },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardMonto: { fontSize: 16, fontWeight: "700", color: colors.text },
  deleteBtn: { padding: 4 },

  fab: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  fabText: { color: colors.background, fontWeight: "600", fontSize: 15 },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end",
  },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
  },
  modalTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 16,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  categoriasGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoriaBtn: {
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
  categoriaBtnText: { color: colors.textMuted, fontSize: 12 },
  boton: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  botonText: { color: colors.background, fontWeight: "600", fontSize: 15 },
  cancelar: { color: colors.textSecondary, textAlign: "center", fontSize: 14 },
});
