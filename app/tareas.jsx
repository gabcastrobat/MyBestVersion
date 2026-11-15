import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useState } from "react";
import {
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheet } from "../src/components/BottomSheet";
import { Boton } from "../src/components/Boton";
import { Campo } from "../src/components/Campo";
import { Contadores } from "../src/components/Contadores";
import { EstadoVacio } from "../src/components/EstadoVacio";
import { FilaMarcable } from "../src/components/FilaMarcable";
import { colors } from "../src/constants/colors.js";
import { useTareas } from "../src/hooks/useTareas";

const prioridadConfig = {
  Alta: { color: colors.danger, icon: "arrow-up-circle-outline" },
  Media: { color: colors.warning, icon: "remove-circle-outline" },
  Baja: { color: colors.success, icon: "arrow-down-circle-outline" },
};

export default function TareasScreen() {
  const { tareas, agregar, toggle, editar, eliminar } = useTareas();
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  // null = creando una tarea nueva; un id = editando esa tarea.
  // Así el MISMO modal sirve para crear y para editar.
  const [editandoId, setEditandoId] = useState(null);
  const [error, setError] = useState("");

  function abrirNueva() {
    setEditandoId(null);
    setNombre("");
    setPrioridad("Media");
    setError("");
    setModalVisible(true);
  }

  function abrirEdicion(tarea) {
    setEditandoId(tarea.id);
    setNombre(tarea.nombre);
    setPrioridad(tarea.prioridad);
    setError("");
    setModalVisible(true);
  }

  async function handleGuardar() {
    if (!nombre.trim()) {
      setError("Escribe qué tienes que hacer");
      return;
    }
    try {
      if (editandoId) await editar(editandoId, { nombre, prioridad });
      else await agregar({ nombre, prioridad });
      setModalVisible(false);
    } catch (e) {
      setError(e.message || "No se pudo guardar la tarea");
    }
  }

  function handleToggle(tarea) {
    // Vibración suave solo al completar (no al desmarcar)
    if (!tarea.completada)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggle(tarea.id);
  }

  function confirmarEliminar(tarea) {
    Alert.alert("Eliminar tarea", `¿Borrar "${tarea.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => eliminar(tarea.id),
      },
    ]);
  }

  const pendientes = tareas.filter((t) => !t.completada);
  const hechas = tareas.filter((t) => t.completada);

  return (
    <View style={styles.container}>
      {/* Contadores */}
      {tareas.length > 0 && (
        <Contadores
          pendientes={pendientes.length}
          completadas={hechas.length}
        />
      )}

      <FlatList
        data={[...pendientes, ...hechas]}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <EstadoVacio
            icono="checkmark-done-outline"
            titulo="Sin tareas"
            subtitulo="Agrega tu primera tarea del día"
          />
        }
        renderItem={({ item }) => {
          const cfg = prioridadConfig[item.prioridad];
          return (
            <FilaMarcable
              completada={item.completada}
              onPress={() => handleToggle(item)}
              etiqueta={`${item.nombre}, prioridad ${item.prioridad}`}
              izquierda={
                <>
                  <View
                    style={[
                      styles.prioridadBar,
                      { backgroundColor: cfg.color },
                    ]}
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
                      <Ionicons
                        name="checkmark"
                        size={14}
                        color={colors.onPrimary}
                      />
                    )}
                  </View>
                </>
              }
              acciones={
                <>
                  <TouchableOpacity
                    onPress={() => abrirEdicion(item)}
                    style={styles.accionBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar tarea ${item.nombre}`}
                  >
                    <Ionicons
                      name="create-outline"
                      size={17}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmarEliminar(item)}
                    style={styles.deleteBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar tarea ${item.nombre}`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={17}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </>
              }
            >
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
            </FilaMarcable>
          );
        }}
      />

      <TouchableOpacity
        style={styles.fab}
        onPress={abrirNueva}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={22} color={colors.background} />
        <Text style={styles.fabText}>Nueva tarea</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)} // botón atrás de Android
        titulo={editandoId ? "Editar tarea" : "Nueva tarea"}
      >
        <Campo
          placeholder="¿Qué tienes que hacer?"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            if (error) setError("");
          }}
          error={error}
          multiline
          style={styles.inputTarea}
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
              accessibilityRole="radio"
              accessibilityState={{ selected: prioridad === p }}
              accessibilityLabel={`Prioridad ${p}`}
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
        <Boton
          titulo={editandoId ? "Guardar cambios" : "Guardar tarea"}
          onPress={handleGuardar}
        />
        <Boton
          titulo="Cancelar"
          variante="texto"
          onPress={() => setModalVisible(false)}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  lista: { padding: 16, paddingBottom: 100 },

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
  cardInfo: { paddingVertical: 14 },
  nombre: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    marginBottom: 4,
  },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
  tagRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  prioridadText: { fontSize: 12, fontWeight: "500" },
  accionBtn: { paddingVertical: 14, paddingHorizontal: 10 },
  deleteBtn: { padding: 14, paddingLeft: 10 },

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

  inputTarea: { minHeight: 50 },
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
});
