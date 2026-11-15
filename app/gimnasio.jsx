import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors";
import { useGimnasio } from "../src/hooks/useGimnasio";
import { iniciarEntreno, volumenSesion } from "../src/storage/gimnasio";

function formatDuracion(seg) {
  const min = Math.round(seg / 60);
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)} h ${min % 60} min`;
}

function fechaCorta(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export default function GimnasioScreen() {
  const router = useRouter();
  const {
    plantillas,
    sesiones,
    enCurso,
    estadisticas,
    agregarPlantilla,
    eliminarPlantilla,
  } = useGimnasio();

  // Formulario de nueva rutina de gym
  const [modalVisible, setModalVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [ejercicioTexto, setEjercicioTexto] = useState("");
  const [ejercicios, setEjercicios] = useState([]);
  const [error, setError] = useState("");

  function abrirModal() {
    setNombre("");
    setEjercicioTexto("");
    setEjercicios([]);
    setError("");
    setModalVisible(true);
  }

  function agregarEjercicioALista() {
    const limpio = ejercicioTexto.trim();
    if (!limpio) return;
    setEjercicios((prev) => [...prev, limpio]);
    setEjercicioTexto("");
  }

  async function handleGuardar() {
    try {
      // Si quedó algo escrito sin pulsar "+", también se incluye
      const lista = ejercicioTexto.trim()
        ? [...ejercicios, ejercicioTexto.trim()]
        : ejercicios;
      await agregarPlantilla({ nombre, ejercicios: lista });
      setModalVisible(false);
    } catch (e) {
      setError(e.message);
    }
  }

  async function empezar(plantilla) {
    const arrancar = async () => {
      await iniciarEntreno(plantilla);
      router.push("/entreno");
    };
    if (enCurso) {
      Alert.alert(
        "Tienes un entreno sin terminar",
        `Si empiezas "${plantilla.nombre}", se perderá "${enCurso.nombre}".`,
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Empezar igual", style: "destructive", onPress: arrancar },
        ],
      );
    } else {
      await arrancar();
    }
  }

  function confirmarEliminar(plantilla) {
    Alert.alert(
      "Eliminar rutina",
      `¿Eliminar "${plantilla.nombre}"? Tu historial de entrenos se conserva.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => eliminarPlantilla(plantilla.id),
        },
      ],
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Entreno sin terminar */}
        {enCurso && (
          <TouchableOpacity
            style={styles.enCurso}
            onPress={() => router.push("/entreno")}
          >
            <Ionicons name="play-circle" size={28} color={colors.background} />
            <View style={{ flex: 1 }}>
              <Text style={styles.enCursoTitulo}>Continuar entreno</Text>
              <Text style={styles.enCursoSub}>{enCurso.nombre}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.background} />
          </TouchableOpacity>
        )}

        {/* Estadísticas de la semana */}
        <Text style={styles.seccionTitulo}>Últimos 7 días</Text>
        <View style={styles.statsRow}>
          <Stat valor={estadisticas.semana} label="Entrenos" />
          <Stat valor={`${estadisticas.minutosSemana}`} label="Minutos" />
          <Stat
            valor={`${Math.round(estadisticas.volumenSemana).toLocaleString("es-CO")}`}
            label="kg de volumen"
          />
        </View>

        {/* Rutinas de gym */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Mis rutinas de gym</Text>
          <TouchableOpacity
            onPress={abrirModal}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Nueva rutina de gym"
          >
            <Text style={styles.link}>+ Nueva</Text>
          </TouchableOpacity>
        </View>
        {plantillas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="barbell-outline" size={36} color={colors.textMuted} />
            <Text style={styles.emptyText}>
              Crea tu primera rutina (ej: &quot;Pierna&quot;) con sus ejercicios.
            </Text>
          </View>
        ) : (
          plantillas.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitulo}>{p.nombre}</Text>
                <Text style={styles.cardSub} numberOfLines={2}>
                  {p.ejercicios.map((e) => e.nombre).join(" · ")}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmarEliminar(p)}
                style={styles.iconBtn}
                hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel={`Eliminar rutina ${p.nombre}`}
              >
                <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.empezarBtn}
                onPress={() => empezar(p)}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityRole="button"
                accessibilityLabel={`Empezar entreno ${p.nombre}`}
              >
                <Ionicons name="play" size={16} color={colors.background} />
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Récords personales */}
        {estadisticas.records.length > 0 && (
          <>
            <Text style={styles.seccionTitulo}>Récords personales</Text>
            <View style={styles.listaCard}>
              {estadisticas.records.slice(0, 5).map((r) => (
                <View key={r.nombre} style={styles.fila}>
                  <Text style={styles.filaNombre}>🏆 {r.nombre}</Text>
                  <Text style={styles.filaValor}>
                    {r.peso} kg × {r.reps}
                  </Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Historial */}
        <Text style={styles.seccionTitulo}>Historial</Text>
        {sesiones.length === 0 ? (
          <Text style={styles.emptyText}>Aún no terminas ningún entreno.</Text>
        ) : (
          sesiones.slice(0, 15).map((s) => (
            <View key={s.id} style={styles.sesion}>
              <View style={styles.sesionHeader}>
                <Text style={styles.cardTitulo}>{s.nombre}</Text>
                <Text style={styles.sesionFecha}>{fechaCorta(s.fecha)}</Text>
              </View>
              <Text style={styles.cardSub}>
                {formatDuracion(s.duracionSeg)} ·{" "}
                {Math.round(volumenSesion(s)).toLocaleString("es-CO")} kg ·{" "}
                {s.ejercicios.reduce((acc, e) => acc + e.series.length, 0)} series
              </Text>
              {s.ejercicios.map((e, i) => (
                <Text key={`${e.nombre}-${i}`} style={styles.sesionEjercicio}>
                  {e.nombre}:{" "}
                  {e.series.map((x) => `${x.reps}×${x.peso}kg`).join(", ")}
                </Text>
              ))}
            </View>
          ))
        )}
      </ScrollView>

      {/* Modal: nueva rutina de gym */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitulo}>Nueva rutina de gym</Text>
            <TextInput
              style={styles.input}
              placeholder="Nombre (ej: Pierna)"
              placeholderTextColor={colors.textMuted}
              value={nombre}
              onChangeText={setNombre}
            />
            <Text style={styles.label}>Ejercicios</Text>
            {ejercicios.map((e, i) => (
              <View key={`${e}-${i}`} style={styles.ejercicioItem}>
                <Text style={styles.ejercicioTexto}>
                  {i + 1}. {e}
                </Text>
                <TouchableOpacity
                  onPress={() =>
                    setEjercicios((prev) => prev.filter((_, j) => j !== i))
                  }
                  hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ejercicio ${e}`}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.agregarRow}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                placeholder="Ej: Sentadilla"
                placeholderTextColor={colors.textMuted}
                value={ejercicioTexto}
                onChangeText={setEjercicioTexto}
                onSubmitEditing={agregarEjercicioALista}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.masBtn}
                onPress={agregarEjercicioALista}
                accessibilityRole="button"
                accessibilityLabel="Agregar ejercicio a la lista"
              >
                <Ionicons name="add" size={22} color={colors.background} />
              </TouchableOpacity>
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <TouchableOpacity style={styles.boton} onPress={handleGuardar}>
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

function Stat({ valor, label }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValor} numberOfLines={1} adjustsFontSizeToFit>
        {valor}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  enCurso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.success,
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
  },
  enCursoTitulo: { color: colors.background, fontWeight: "700", fontSize: 15 },
  enCursoSub: { color: colors.background, fontSize: 13 },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seccionTitulo: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  link: { color: colors.success, fontSize: 14, fontWeight: "600", marginBottom: 10 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
  },
  statValor: { fontSize: 22, fontWeight: "700", color: colors.text },
  statLabel: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },

  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    gap: 8,
    marginBottom: 24,
  },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardTitulo: { color: colors.text, fontSize: 15, fontWeight: "600" },
  cardSub: { color: colors.textSecondary, fontSize: 12, marginTop: 3 },
  iconBtn: { padding: 6 },
  empezarBtn: {
    backgroundColor: colors.success,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },

  listaCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 24,
  },
  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  filaNombre: { color: colors.text, fontSize: 14 },
  filaValor: { color: colors.warning, fontSize: 14, fontWeight: "600" },

  sesion: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  sesionHeader: { flexDirection: "row", justifyContent: "space-between" },
  sesionFecha: { color: colors.textSecondary, fontSize: 12, textTransform: "capitalize" },
  sesionEjercicio: { color: colors.textMuted, fontSize: 12, marginTop: 4 },

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
    maxHeight: "85%",
  },
  modalTitulo: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: 8 },
  ejercicioItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  ejercicioTexto: { color: colors.text, fontSize: 14 },
  agregarRow: { flexDirection: "row", gap: 8, marginTop: 4, marginBottom: 12 },
  masBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  error: { color: colors.danger, fontSize: 13, marginBottom: 10 },
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
