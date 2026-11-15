import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useEffect, useState } from "react";
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors.js";
import { usePerfil } from "../src/hooks/usePerfil";
import { useRutinas } from "../src/hooks/useRutinas";
import { useTareas } from "../src/hooks/useTareas";

export default function PerfilScreen() {
  const { perfil, guardar } = usePerfil();
  const { rutinas } = useRutinas();
  const { tareas } = useTareas();
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    foto: null,
  });

  useEffect(() => {
    setForm(perfil);
  }, [perfil]);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setForm((prev) => ({ ...prev, foto: result.assets[0].uri }));
    }
  }

  async function handleGuardar() {
    await guardar(form);
    setEditando(false);
  }

  const foto = editando ? form.foto : perfil.foto;
  const nombre = perfil.nombre || "Tu nombre";
  const inicial = nombre.charAt(0).toUpperCase();

  const rutinasCompletadas = rutinas.filter((r) => r.completada).length;
  const tareasPendientes = tareas.filter((t) => !t.completada).length;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerBox}>
        <TouchableOpacity
          onPress={editando ? pickImage : null}
          style={styles.avatarContainer}
        >
          {foto ? (
            <Image source={{ uri: foto }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarInitial}>{inicial}</Text>
            </View>
          )}
          {editando && (
            <View style={styles.avatarOverlay}>
              <Ionicons name="camera-outline" size={18} color="#fff" />
            </View>
          )}
        </TouchableOpacity>

        {!editando && (
          <>
            <Text style={styles.nombreDisplay}>{nombre}</Text>
            {perfil.email ? (
              <Text style={styles.emailDisplay}>{perfil.email}</Text>
            ) : null}
          </>
        )}
      </View>

      {/* Stats */}
      {!editando && (
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{rutinas.length}</Text>
            <Text style={styles.statLabel}>Rutinas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statNum}>{rutinasCompletadas}</Text>
            <Text style={styles.statLabel}>Completadas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNum,
                tareasPendientes > 0 && { color: colors.warning },
              ]}
            >
              {tareasPendientes}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>
      )}

      {/* Campos */}
      <View style={styles.seccionBox}>
        <Text style={styles.seccionTitulo}>Información personal</Text>

        <View style={styles.campo}>
          <Ionicons
            name="person-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.campoIcon}
          />
          <View style={styles.campoContent}>
            <Text style={styles.campoLabel}>Nombre</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={form.nombre}
                onChangeText={(v) =>
                  setForm((prev) => ({ ...prev, nombre: v }))
                }
                placeholder="Tu nombre"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.campoValor}>{perfil.nombre || "—"}</Text>
            )}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.campo}>
          <Ionicons
            name="mail-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.campoIcon}
          />
          <View style={styles.campoContent}>
            <Text style={styles.campoLabel}>Email</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={form.email}
                onChangeText={(v) => setForm((prev) => ({ ...prev, email: v }))}
                placeholder="tu@email.com"
                placeholderTextColor={colors.textMuted}
                keyboardType="email-address"
              />
            ) : (
              <Text style={styles.campoValor}>{perfil.email || "—"}</Text>
            )}
          </View>
        </View>

        <View style={styles.separator} />

        <View style={styles.campo}>
          <Ionicons
            name="call-outline"
            size={18}
            color={colors.textSecondary}
            style={styles.campoIcon}
          />
          <View style={styles.campoContent}>
            <Text style={styles.campoLabel}>Teléfono</Text>
            {editando ? (
              <TextInput
                style={styles.input}
                value={form.telefono}
                onChangeText={(v) =>
                  setForm((prev) => ({ ...prev, telefono: v }))
                }
                placeholder="+57 300 000 0000"
                placeholderTextColor={colors.textMuted}
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.campoValor}>{perfil.telefono || "—"}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Botones */}
      {editando ? (
        <View style={styles.botonesRow}>
          <TouchableOpacity
            style={styles.botonSecundario}
            onPress={() => {
              setForm(perfil);
              setEditando(false);
            }}
          >
            <Text style={styles.botonSecundarioText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.boton} onPress={handleGuardar}>
            <Text style={styles.botonText}>Guardar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.botonEditar}
          onPress={() => {
            setForm(perfil);
            setEditando(true);
          }}
        >
          <Ionicons name="pencil-outline" size={18} color={colors.background} />
          <Text style={styles.botonText}>Editar perfil</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },

  headerBox: { alignItems: "center", marginBottom: 20, marginTop: 8 },
  avatarContainer: { position: "relative", marginBottom: 14 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  avatarInitial: { fontSize: 40, color: colors.text, fontWeight: "700" },
  avatarOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderBottomLeftRadius: 50,
    borderBottomRightRadius: 50,
    padding: 8,
    alignItems: "center",
  },
  nombreDisplay: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  emailDisplay: { fontSize: 13, color: colors.textSecondary },

  statsRow: {
    flexDirection: "row",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    alignItems: "center",
  },
  statCard: { flex: 1, alignItems: "center" },
  statNum: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  statLabel: { fontSize: 12, color: colors.textSecondary },
  statDivider: { width: 1, height: 36, backgroundColor: colors.border },

  seccionBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
  },
  seccionTitulo: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 16,
  },
  campo: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  campoIcon: { marginTop: 2 },
  campoContent: { flex: 1 },
  campoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  campoValor: { fontSize: 15, color: colors.text },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
  },
  separator: {
    height: 0.5,
    backgroundColor: colors.border,
    marginVertical: 14,
  },

  botonesRow: { flexDirection: "row", gap: 12 },
  botonSecundario: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  botonSecundarioText: { color: colors.text, fontWeight: "600", fontSize: 15 },
  boton: {
    flex: 1,
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
  },
  botonEditar: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  botonText: { color: colors.background, fontWeight: "600", fontSize: 15 },
});
