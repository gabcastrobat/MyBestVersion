import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
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
import { CategoriaGrid } from "../src/components/CategoriaGrid";
import { Contadores } from "../src/components/Contadores";
import { EstadoVacio } from "../src/components/EstadoVacio";
import { FilaMarcable } from "../src/components/FilaMarcable";
import { colors } from "../src/constants/colors.js";
import { useHistorialRutinas } from "../src/hooks/useHistorialRutinas";
import { useRutinas } from "../src/hooks/useRutinas";
import { parseHora } from "../src/storage/notificaciones";

function formatHora(date) {
  let horas = date.getHours();
  const minutos = date.getMinutes();
  const periodo = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;
  return `${horas}:${minutos.toString().padStart(2, "0")} ${periodo}`;
}

// "7:30 PM" → Date de hoy a esa hora (para precargar el selector al editar)
function horaADate(hora) {
  const { hora24, minutos } = parseHora(hora);
  const d = new Date();
  d.setHours(hora24, minutos, 0, 0);
  return d;
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
  const { rutinas, agregar, toggle, editar, eliminar } = useRutinas();
  const { estadisticas, recientes, recargar } = useHistorialRutinas();
  const [historialVisible, setHistorialVisible] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  // null = creando una rutina nueva; un id = editando esa rutina
  // (mismo patrón que en Tareas: un solo modal para crear y editar).
  const [editandoId, setEditandoId] = useState(null);
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [hora, setHora] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  // Marcar/desmarcar y luego refrescar rachas: el toggle escribe en el
  // historial, así que hay que volver a leerlo para ver la racha nueva.
  async function handleToggle(rutina) {
    if (!rutina.completada)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    await toggle(rutina.id);
    await recargar();
  }

  // Borrar una rutina también borra su recordatorio y su racha: confirmamos.
  function confirmarEliminar(rutina) {
    Alert.alert(
      "Eliminar rutina",
      `¿Borrar "${rutina.nombre}"? También se cancela su recordatorio.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminar(rutina.id),
        },
      ],
    );
  }

  function abrirNueva() {
    setEditandoId(null);
    setNombre("");
    setCategoria("General");
    setHora(new Date());
    setShowPicker(false);
    setError("");
    setModalVisible(true);
  }

  function abrirEdicion(rutina) {
    setEditandoId(rutina.id);
    setNombre(rutina.nombre);
    setCategoria(rutina.categoria);
    setHora(horaADate(rutina.hora));
    setShowPicker(false);
    setError("");
    setModalVisible(true);
  }

  async function handleGuardar() {
    if (!nombre.trim()) {
      setError("Escribe un nombre para la rutina");
      return;
    }
    try {
      if (editandoId)
        await editar(editandoId, {
          nombre,
          hora: formatHora(hora),
          categoria,
        });
      else await agregar({ nombre, hora: formatHora(hora), categoria });
      setModalVisible(false);
    } catch (e) {
      setError(e.message || "No se pudo guardar la rutina");
    }
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
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Ver historial de rutinas"
      >
        <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
        <Text style={styles.historialBtnText}>Ver historial</Text>
      </TouchableOpacity>

      <FlatList
        data={rutinas}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.lista}
        ListEmptyComponent={
          <EstadoVacio
            icono="repeat-outline"
            titulo="Sin rutinas aún"
            subtitulo="Agrega tu primera rutina diaria"
          />
        }
        renderItem={({ item }) => {
          const config =
            categoriaConfig[item.categoria] || categoriaConfig.General;
          const stats = estadisticas[item.id];
          return (
            <FilaMarcable
              completada={item.completada}
              onPress={() => handleToggle(item)}
              etiqueta={`${item.nombre}, ${item.hora}`}
              style={styles.fila}
              izquierda={
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
              }
              acciones={
                <>
                  {item.completada && (
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color={colors.success}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => abrirEdicion(item)}
                    style={styles.accionBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Editar rutina ${item.nombre}`}
                  >
                    <Ionicons
                      name="create-outline"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmarEliminar(item)}
                    style={styles.accionBtn}
                    hitSlop={{ top: 12, bottom: 12, left: 4, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar rutina ${item.nombre}`}
                  >
                    <Ionicons
                      name="trash-outline"
                      size={18}
                      color={colors.textMuted}
                    />
                  </TouchableOpacity>
                </>
              }
            >
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
                  {stats.racha > 0
                    ? `🔥 ${stats.racha} día${stats.racha === 1 ? "" : "s"} · `
                    : ""}
                  {stats.total} {stats.total === 1 ? "vez" : "veces"} en total
                </Text>
              )}
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
        <Text style={styles.fabText}>Nueva rutina</Text>
      </TouchableOpacity>

      <BottomSheet
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        titulo={editandoId ? "Editar rutina" : "Nueva rutina"}
      >
        <Campo
          placeholder="Nombre (ej: Ejercicio)"
          value={nombre}
          onChangeText={(t) => {
            setNombre(t);
            if (error) setError("");
          }}
          error={error}
        />

        <Text style={styles.label}>Hora</Text>
        <TouchableOpacity
          style={styles.horaBtn}
          onPress={() => setShowPicker(true)}
          accessibilityRole="button"
          accessibilityLabel={`Hora de la rutina: ${formatHora(hora)}`}
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

        <Boton
          titulo={editandoId ? "Guardar cambios" : "Guardar rutina"}
          onPress={handleGuardar}
        />
        <Boton
          titulo="Cancelar"
          variante="texto"
          onPress={() => setModalVisible(false)}
        />
      </BottomSheet>

      {/* Historial de rutinas realizadas */}
      <BottomSheet
        visible={historialVisible}
        onClose={() => setHistorialVisible(false)}
        titulo="Historial de rutinas"
        style={styles.historialModal}
      >
        <FlatList
          data={historialPorDia}
          keyExtractor={(d) => d.fecha}
          ListEmptyComponent={
            <Text style={styles.vacioHistorial}>
              Todavía no hay rutinas completadas.
            </Text>
          }
          renderItem={({ item: dia }) => (
            <View style={styles.historialDia}>
              <Text style={styles.historialFecha}>{fechaCorta(dia.fecha)}</Text>
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
        <Boton
          titulo="Cerrar"
          variante="texto"
          onPress={() => setHistorialVisible(false)}
        />
      </BottomSheet>
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
  historialItem: {
    color: colors.textSecondary,
    fontSize: 14,
    paddingVertical: 2,
  },
  historialHora: { color: colors.textMuted, fontSize: 12 },
  vacioHistorial: { fontSize: 14, color: colors.textMuted },

  fila: { padding: 14, paddingRight: 4, gap: 12 },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nombre: { fontSize: 15, fontWeight: "500", color: colors.text },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
  hora: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  accionBtn: { padding: 8 },

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
});
