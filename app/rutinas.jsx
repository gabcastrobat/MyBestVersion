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
import { Contadores } from "../src/components/Contadores";
import { colors } from "../src/constants/colors.js";
import { useHistorialRutinas } from "../src/hooks/useHistorialRutinas";
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

// "2026-11-06" → "vie, 6 nov"
function fechaCorta(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function RutinasScreen() {
  const { rutinas, agregar, toggle, eliminar } = useRutinas();
  const { estadisticas, recientes, recargar } = useHistorialRutinas();
  const [historialVisible, setHistorialVisible] = useState(false);

  // Marcar/desmarcar y luego refrescar rachas: el toggle escribe en el
  // historial, así que hay que volver a leerlo para ver la racha nueva.
  async function handleToggle(id) {
    await toggle(id);
    await recargar();
  }
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

  // Agrupamos el historial por día para mostrarlo en secciones
  const historialPorDia = [];
  for (const a of recientes) {
    const ultimo = historialPorDia[historialPorDia.length - 1];
    if (ultimo && ultimo.fecha === a.fecha) ultimo.items.push(a);
    else historialPorDia.push({ fecha: a.fecha, items: [a] });
  }

  return (
    <View style={styles.container}>
      {/* Contadores + acceso al historial */}
      {rutinas.length > 0 && (
        <Contadores
          pendientes={rutinas.length - completadas}
          completadas={completadas}
        />
      )}
      <TouchableOpacity
        style={styles.historialBtn}
        onPress={() => setHistorialVisible(true)}
      >
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.historialBtnText}>Ver historial</Text>
      </TouchableOpacity>

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
          const stats = estadisticas[item.id];
          return (
            <TouchableOpacity
              style={[styles.card, item.completada && styles.cardDone]}
              onPress={() => handleToggle(item.id)}
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
                {stats && (
                  <Text style={styles.stats}>
                    {stats.racha > 0 ? `🔥 ${stats.racha} día${stats.racha === 1 ? "" : "s"} · ` : ""}
                    {stats.total} {stats.total === 1 ? "vez" : "veces"} en total
                  </Text>
                )}
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

      {/* Historial de rutinas realizadas */}
      <Modal
        visible={historialVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setHistorialVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, styles.historialModal]}>
            <Text style={styles.modalTitulo}>Historial de rutinas</Text>
            <FlatList
              data={historialPorDia}
              keyExtractor={(d) => d.fecha}
              ListEmptyComponent={
                <Text style={styles.emptySubtitulo}>
                  Todavía no hay rutinas completadas.
                </Text>
              }
              renderItem={({ item: dia }) => (
                <View style={styles.historialDia}>
                  <Text style={styles.historialFecha}>
                    {fechaCorta(dia.fecha)}
                  </Text>
                  {dia.items.map((a) => (
                    <Text key={a.id} style={styles.historialItem}>
                      ✓ {a.nombre}
                      <Text style={styles.historialHora}>
                        {"  "}
                        {new Date(a.completadaEn).toLocaleTimeString("es-CO", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </Text>
                  ))}
                </View>
              )}
            />
            <TouchableOpacity onPress={() => setHistorialVisible(false)}>
              <Text style={styles.cancelar}>Cerrar</Text>
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

  historialBtn: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    marginTop: 10,
    marginRight: 16,
  },
  historialBtnText: { color: colors.textSecondary, fontSize: 13 },
  stats: { fontSize: 11, color: colors.warning, marginTop: 3 },
  historialModal: { maxHeight: "75%" },
  historialDia: { marginBottom: 14 },
  historialFecha: {
    color: colors.text,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 4,
    textTransform: "capitalize",
  },
  historialItem: { color: colors.textSecondary, fontSize: 14, paddingVertical: 2 },
  historialHora: { color: colors.textMuted, fontSize: 12 },

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
