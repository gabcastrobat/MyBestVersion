import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
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
import { useTareas } from "../src/hooks/useTareas";

const prioridadConfig = {
  Alta: { color: "#ff4444", icon: "arrow-up-circle-outline" },
  Media: { color: "#ffaa00", icon: "remove-circle-outline" },
  Baja: { color: "#44ff88", icon: "arrow-down-circle-outline" },
};

export default function TareasScreen() {
  const { tareas, agregar, toggle, eliminar } = useTareas();
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [prioridad, setPrioridad] = useState("Media");

  async function handleAgregar() {
    if (!nombre.trim()) return;
    await agregar({ nombre, prioridad });
    setNombre("");
    setPrioridad("Media");
    setModalVisible(false);
  }

  const completadas = tareas.filter((t) => t.completada).length;
  const pendientes = tareas.filter((t) => !t.completada);
  const hechas = tareas.filter((t) => t.completada);

  return (
    <View style={styles.container}>
      {/* Progreso */}
      {tareas.length > 0 && (
        <View style={styles.progresoBox}>
          <View style={styles.progresoTextRow}>
            <Text style={styles.progresoLabel}>Completadas hoy</Text>
            <Text style={styles.progresoNum}>
              {completadas}/{tareas.length}
            </Text>
          </View>
          <View style={styles.progresoBar}>
            <View
              style={[
                styles.progresoFill,
                { width: `${(completadas / tareas.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={[...pendientes, ...hechas]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="checkmark-done-outline"
              size={52}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitulo}>Sin tareas</Text>
            <Text style={styles.emptySubtitulo}>
              Agrega tu primera tarea del día
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const cfg = prioridadConfig[item.prioridad];
          return (
            <TouchableOpacity
              style={[styles.card, item.completada && styles.cardDone]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.prioridadBar, { backgroundColor: cfg.color }]}
              />
              <View
                style={[
                  styles.checkBox,
                  item.completada && {
                    backgroundColor: colors.success,
                    borderColor: colors.success,
                  },
                ]}
              >
                {item.completada && (
                  <Ionicons name="checkmark" size={14} color="#000" />
                )}
              </View>
              <View style={styles.cardInfo}>
                <Text
                  style={[styles.nombre, item.completada && styles.completada]}
                >
                  {item.nombre}
                </Text>
                <View style={styles.tagRow}>
                  <Ionicons
                    name={cfg.icon}
                    size={12}
                    color={item.completada ? colors.textMuted : cfg.color}
                  />
                  <Text
                    style={[
                      styles.prioridadText,
                      { color: item.completada ? colors.textMuted : cfg.color },
                    ]}
                  >
                    {item.prioridad}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => eliminar(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={17}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={22} color={colors.background} />
        <Text style={styles.fabText}>Nueva tarea</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva Tarea</Text>
            <TextInput
              style={styles.input}
              placeholder="¿Qué tienes que hacer?"
              placeholderTextColor={colors.textMuted}
              value={nombre}
              onChangeText={setNombre}
              multiline
            />
            <Text style={styles.label}>Prioridad</Text>
            <View style={styles.prioridadRow}>
              {Object.entries(prioridadConfig).map(([p, cfg]) => (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.prioridadBtn,
                    prioridad === p && {
                      backgroundColor: cfg.color + "33",
                      borderColor: cfg.color,
                    },
                  ]}
                  onPress={() => setPrioridad(p)}
                >
                  <Ionicons
                    name={cfg.icon}
                    size={18}
                    color={prioridad === p ? cfg.color : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.prioridadBtnText,
                      prioridad === p && { color: cfg.color },
                    ]}
                  >
                    {p}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={styles.boton} onPress={handleAgregar}>
              <Text style={styles.botonText}>Guardar tarea</Text>
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

  progresoBox: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
  },
  progresoTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  progresoLabel: { fontSize: 13, color: colors.textSecondary },
  progresoNum: { fontSize: 13, fontWeight: "600", color: colors.success },
  progresoBar: {
    height: 5,
    backgroundColor: colors.input,
    borderRadius: 3,
    overflow: "hidden",
  },
  progresoFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 3,
  },

  emptyBox: { alignItems: "center", marginTop: 80, gap: 10 },
  emptyTitulo: { fontSize: 18, fontWeight: "600", color: colors.textSecondary },
  emptySubtitulo: { fontSize: 14, color: colors.textMuted },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    marginBottom: 10,
    overflow: "hidden",
  },
  cardDone: { opacity: 0.5 },
  prioridadBar: { width: 3, alignSelf: "stretch" },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  cardInfo: { flex: 1, paddingVertical: 14 },
  nombre: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  prioridadText: { fontSize: 12, fontWeight: "500" },
  deleteBtn: { padding: 14 },

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
    minHeight: 50,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  prioridadRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  prioridadBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: "transparent",
    gap: 4,
  },
  prioridadBtnText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: "500",
  },
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
