import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
import { CategoriaGrid } from "../src/components/CategoriaGrid";
import { colors } from "../src/constants/colors.js";
import { useRutinas } from "../src/hooks/useRutinas";

function formatHora(date) {
  let horas = date.getHours();
  const minutos = date.getMinutes();
  const periodo = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;
  return `${horas}:${minutos.toString().padStart(2, "0")} ${periodo}`;
}

const categoriaConfig = {
  General: { icon: "star-outline", color: "#888888" },
  Ejercicio: { icon: "barbell-outline", color: "#ff6b6b" },
  Estudio: { icon: "book-outline", color: "#4488ff" },
  Agua: { icon: "water-outline", color: "#44ccff" },
  Entretenimiento: { icon: "game-controller-outline", color: "#aa44ff" },
};

export default function RutinasScreen() {
  const { rutinas, agregar, toggle, eliminar } = useRutinas();
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [hora, setHora] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  async function handleAgregar() {
    if (!nombre.trim()) return;
    await agregar({ nombre, hora: formatHora(hora), categoria });
    setNombre("");
    setCategoria("General");
    setHora(new Date());
    setModalVisible(false);
  }

  const completadas = rutinas.filter((r) => r.completada).length;

  return (
    <View style={styles.container}>
      {/* Header con progreso */}
      {rutinas.length > 0 && (
        <View style={styles.progresoBox}>
          <View style={styles.progresoTextRow}>
            <Text style={styles.progresoLabel}>Completadas hoy</Text>
            <Text style={styles.progresoNum}>
              {completadas}/{rutinas.length}
            </Text>
          </View>
          <View style={styles.progresoBar}>
            <View
              style={[
                styles.progresoFill,
                { width: `${(completadas / rutinas.length) * 100}%` },
              ]}
            />
          </View>
        </View>
      )}

      <FlatList
        data={rutinas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Ionicons
              name="repeat-outline"
              size={52}
              color={colors.textMuted}
            />
            <Text style={styles.emptyTitulo}>Sin rutinas aún</Text>
            <Text style={styles.emptySubtitulo}>
              Agrega tu primera rutina diaria
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const config =
            categoriaConfig[item.categoria] || categoriaConfig.General;
          return (
            <TouchableOpacity
              style={[styles.card, item.completada && styles.cardDone]}
              onPress={() => toggle(item.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconBox,
                  { backgroundColor: config.color + "22" },
                ]}
              >
                <Ionicons
                  name={config.icon}
                  size={22}
                  color={item.completada ? colors.textMuted : config.color}
                />
              </View>
              <View style={styles.cardInfo}>
                <Text
                  style={[styles.nombre, item.completada && styles.completada]}
                >
                  {item.nombre}
                </Text>
                <Text style={styles.hora}>
                  {item.hora} · {item.categoria}
                </Text>
              </View>
              {item.completada && (
                <Ionicons
                  name="checkmark-circle"
                  size={22}
                  color={colors.success}
                />
              )}
              <TouchableOpacity
                onPress={() => eliminar(item.id)}
                style={styles.deleteBtn}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
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
        <Text style={styles.fabText}>Nueva rutina</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva Rutina</Text>

            <TextInput
              style={styles.input}
              placeholder="Nombre (ej: Ejercicio)"
              placeholderTextColor={colors.textMuted}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={styles.label}>Hora</Text>
            <TouchableOpacity
              style={styles.horaBtn}
              onPress={() => setShowPicker(true)}
            >
              <Ionicons
                name="time-outline"
                size={18}
                color={colors.textSecondary}
              />
              <Text style={styles.horaBtnText}>{formatHora(hora)}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={hora}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  if (selectedDate) setHora(selectedDate);
                }}
              />
            )}

            <Text style={styles.label}>Categoría</Text>
            <CategoriaGrid
              opciones={categoriaConfig}
              seleccionada={categoria}
              onSeleccionar={setCategoria}
            />

            <TouchableOpacity style={styles.boton} onPress={handleAgregar}>
              <Text style={styles.botonText}>Guardar rutina</Text>
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
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardDone: { opacity: 0.6 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  nombre: { fontSize: 15, fontWeight: "500", color: colors.text },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
  hora: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
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
  horaBtn: {
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  horaBtnText: { color: colors.text, fontSize: 16, fontWeight: "500" },
  // categoriasGrid, categoriaBtn y categoriaBtnText
  // fueron movidos a src/components/CategoriaGrid.jsx
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
