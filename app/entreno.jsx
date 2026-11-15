import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors";
import { useEntreno } from "../src/hooks/useEntreno";

// "mm:ss" o "h:mm:ss"
function cronometro(seg) {
  const h = Math.floor(seg / 3600);
  const m = Math.floor((seg % 3600) / 60);
  const s = seg % 60;
  const dos = (n) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

// Pantalla del entreno en curso. No está en la barra de pestañas
// (href: null en _layout): se llega desde Gimnasio.
export default function EntrenoScreen() {
  const router = useRouter();
  const {
    entreno,
    cargando,
    editarSerie,
    agregarSerie,
    quitarSerie,
    agregarEjercicio,
    terminar,
    descartar,
  } = useEntreno();
  const [ahora, setAhora] = useState(Date.now());
  const [nuevoEjercicio, setNuevoEjercicio] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cronómetro: actualiza la hora cada segundo. El return limpia el
  // intervalo al salir de la pantalla (si no, seguiría corriendo para siempre).
  useEffect(() => {
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  async function handleTerminar() {
    if (guardando) return; // evita guardar dos veces por doble toque
    setGuardando(true);
    try {
      const sesion = await terminar();
      Alert.alert("¡Entreno guardado! 💪", `${sesion.nombre} quedó en tu historial y en el calendario.`);
      router.navigate("/gimnasio");
    } catch (e) {
      Alert.alert("No se pudo guardar", e.message);
    } finally {
      setGuardando(false);
    }
  }

  function handleDescartar() {
    Alert.alert("Descartar entreno", "Se perderá todo lo registrado en este entreno.", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Descartar",
        style: "destructive",
        onPress: async () => {
          await descartar();
          router.navigate("/gimnasio");
        },
      },
    ]);
  }

  if (cargando) return <View style={styles.container} />;

  if (!entreno) {
    return (
      <View style={[styles.container, styles.centro]}>
        <Text style={styles.vacio}>No hay ningún entreno en curso.</Text>
        <TouchableOpacity style={styles.boton} onPress={() => router.navigate("/gimnasio")}>
          <Text style={styles.botonText}>Ir a Gimnasio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const segundos = Math.max(0, Math.floor((ahora - new Date(entreno.inicio)) / 1000));

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.titulo}>{entreno.nombre}</Text>
          <Text style={styles.reloj}>⏱ {cronometro(segundos)}</Text>
        </View>
        <TouchableOpacity onPress={handleDescartar}>
          <Text style={styles.descartar}>Descartar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {entreno.ejercicios.map((ej) => (
          <View key={ej.id} style={styles.card}>
            <Text style={styles.ejNombre}>{ej.nombre}</Text>
            <View style={styles.filaCabecera}>
              <Text style={[styles.cabecera, styles.colSerie]}>Serie</Text>
              <Text style={[styles.cabecera, styles.colInput]}>Reps</Text>
              <Text style={[styles.cabecera, styles.colInput]}>Peso (kg)</Text>
              <View style={styles.colAccion} />
            </View>
            {ej.series.map((s, i) => (
              <View key={s.id} style={styles.fila}>
                <Text style={[styles.numSerie, styles.colSerie]}>{i + 1}</Text>
                <TextInput
                  style={[styles.input, styles.colInput]}
                  keyboardType="number-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={String(s.reps)}
                  onChangeText={(v) => editarSerie(ej.id, s.id, "reps", v)}
                />
                <TextInput
                  style={[styles.input, styles.colInput]}
                  keyboardType="decimal-pad"
                  placeholder="0"
                  placeholderTextColor={colors.textMuted}
                  value={String(s.peso)}
                  onChangeText={(v) => editarSerie(ej.id, s.id, "peso", v)}
                />
                <TouchableOpacity
                  style={styles.colAccion}
                  onPress={() => quitarSerie(ej.id, s.id)}
                >
                  <Ionicons name="close" size={18} color={colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity onPress={() => agregarSerie(ej.id)}>
              <Text style={styles.agregarSerie}>+ Serie</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Agregar un ejercicio que no estaba en la plantilla */}
        <View style={styles.agregarRow}>
          <TextInput
            style={[styles.input, { flex: 1, textAlign: "left" }]}
            placeholder="Agregar ejercicio"
            placeholderTextColor={colors.textMuted}
            value={nuevoEjercicio}
            onChangeText={setNuevoEjercicio}
            onSubmitEditing={() => {
              agregarEjercicio(nuevoEjercicio);
              setNuevoEjercicio("");
            }}
          />
          <TouchableOpacity
            style={styles.masBtn}
            onPress={() => {
              agregarEjercicio(nuevoEjercicio);
              setNuevoEjercicio("");
            }}
          >
            <Ionicons name="add" size={22} color={colors.background} />
          </TouchableOpacity>
        </View>

        <Text style={styles.ayuda}>
          Las series sin repeticiones no se guardan. El peso vacío cuenta como 0
          (ej: peso corporal).
        </Text>
      </ScrollView>

      <TouchableOpacity
        style={[styles.terminar, guardando && { opacity: 0.6 }]}
        onPress={handleTerminar}
        disabled={guardando}
      >
        <Ionicons name="checkmark-done" size={20} color={colors.background} />
        <Text style={styles.botonText}>{guardando ? "Guardando..." : "Terminar entreno"}</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centro: { alignItems: "center", justifyContent: "center", padding: 24, gap: 16 },
  vacio: { color: colors.textSecondary, fontSize: 15 },
  content: { padding: 16, paddingBottom: 100 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  titulo: { color: colors.text, fontSize: 22, fontWeight: "700" },
  reloj: { color: colors.success, fontSize: 15, fontWeight: "600", marginTop: 2 },
  descartar: { color: colors.danger, fontSize: 14 },

  card: { backgroundColor: colors.card, borderRadius: 14, padding: 14, marginBottom: 12 },
  ejNombre: { color: colors.text, fontSize: 16, fontWeight: "600", marginBottom: 10 },
  filaCabecera: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  cabecera: { color: colors.textMuted, fontSize: 11, textAlign: "center" },
  fila: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  colSerie: { width: 40 },
  colInput: { flex: 1 },
  colAccion: { width: 28, alignItems: "center" },
  numSerie: { color: colors.textSecondary, fontSize: 14, textAlign: "center" },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    textAlign: "center",
  },
  agregarSerie: { color: colors.success, fontSize: 14, fontWeight: "600", marginTop: 4 },

  agregarRow: { flexDirection: "row", gap: 8, marginBottom: 12 },
  masBtn: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    width: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  ayuda: { color: colors.textMuted, fontSize: 12, lineHeight: 17 },

  terminar: {
    position: "absolute",
    bottom: 20,
    left: 16,
    right: 16,
    backgroundColor: colors.success,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 8,
  },
  boton: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  botonText: { color: colors.background, fontWeight: "600", fontSize: 15 },
});
