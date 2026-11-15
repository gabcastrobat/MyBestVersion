import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors";
import { useAlarmas } from "../src/hooks/useAlarmas";
import {
  DESAFIOS,
  DIAS_SEMANA,
  proximoDisparo,
  textoDias,
  textoFaltante,
  textoHora,
} from "../src/storage/alarmas";
import { probarAlarma } from "../src/storage/programadorAlarmas";

// Valores con los que arranca el formulario de una alarma nueva
const FORM_VACIO = {
  hora: 6,
  minuto: 0,
  etiqueta: "",
  dias: [1, 2, 3, 4, 5],
  desafio: "sentadillas",
  cantidad: String(DESAFIOS.sentadillas.porDefecto),
};

const AVISOS_PERMISOS = [
  {
    clave: "exactas",
    titulo: "Alarmas exactas desactivadas",
    texto: "Sin este permiso Android puede retrasar la alarma varios minutos.",
  },
  {
    clave: "pantallaCompleta",
    titulo: "Pantalla completa desactivada",
    texto: "La alarma no aparecerá sobre la pantalla bloqueada.",
  },
  {
    clave: "bateria",
    titulo: "Ahorro de batería activo",
    texto: "Elige \"Sin restricciones\" para que Android no duerma la app.",
  },
];

function textoDesafio(alarma) {
  const d = DESAFIOS[alarma.desafio];
  return `${d.icono} ${alarma.cantidad}${d.unidad === "seg" ? " s de" : ""} ${d.label.toLowerCase()}`;
}

export default function AlarmasScreen() {
  const { alarmas, permisos, cargando, agregar, editar, alternar, eliminar, abrirAjuste } =
    useAlarmas();
  const [modalVisible, setModalVisible] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  // Cambia un solo campo del formulario
  const campo = (nombre, valor) => setForm((f) => ({ ...f, [nombre]: valor }));

  function abrirNueva() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setError("");
    setModalVisible(true);
  }

  function abrirEdicion(alarma) {
    setEditandoId(alarma.id);
    setForm({
      hora: alarma.hora,
      minuto: alarma.minuto,
      etiqueta: alarma.etiqueta,
      dias: alarma.dias,
      desafio: alarma.desafio,
      cantidad: String(alarma.cantidad),
    });
    setError("");
    setModalVisible(true);
  }

  function toggleDia(dia) {
    campo(
      "dias",
      form.dias.includes(dia) ? form.dias.filter((d) => d !== dia) : [...form.dias, dia],
    );
  }

  // Al cambiar de desafío se pone su cantidad típica (15 sentadillas ≠ 15 s de plancha)
  function elegirDesafio(clave) {
    setForm((f) => ({ ...f, desafio: clave, cantidad: String(DESAFIOS[clave].porDefecto) }));
  }

  async function handleGuardar() {
    if (guardando) return;
    setGuardando(true);
    try {
      const datos = { ...form, cantidad: Number(form.cantidad) };
      if (editandoId) await editar(editandoId, { ...datos, activa: true });
      else await agregar(datos);
      setModalVisible(false);
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  function handleEliminar() {
    Alert.alert("Eliminar alarma", "¿Seguro que quieres eliminarla?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await eliminar(editandoId);
          setModalVisible(false);
        },
      },
    ]);
  }

  async function handleProbar() {
    await probarAlarma({ ...form, id: editandoId ?? "prueba", cantidad: Number(form.cantidad) || 0 });
    Alert.alert(
      "Prueba programada",
      "Sonará en 10 segundos. Bloquea el celular para ver cómo aparece.",
    );
  }

  if (cargando) return <View style={styles.container} />;

  const avisos = permisos ? AVISOS_PERMISOS.filter((a) => !permisos[a.clave]) : [];

  // La alarma activa que va a sonar antes
  const ahora = new Date();
  const proxima = alarmas
    .map((a) => ({ alarma: a, fecha: proximoDisparo(a, ahora) }))
    .filter((x) => x.fecha)
    .sort((x, y) => x.fecha - y.fecha)[0];

  const fechaPicker = new Date();
  fechaPicker.setHours(form.hora, form.minuto, 0, 0);
  const desafioForm = DESAFIOS[form.desafio];

  return (
    <View style={styles.container}>
      <FlatList
        data={alarmas}
        keyExtractor={(a) => a.id}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <>
            {avisos.map((a) => (
              <TouchableOpacity
                key={a.clave}
                style={styles.aviso}
                onPress={() => abrirAjuste(a.clave)}
              >
                <Ionicons name="warning-outline" size={20} color={colors.warning} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.avisoTitulo}>{a.titulo}</Text>
                  <Text style={styles.avisoTexto}>{a.texto}</Text>
                </View>
                <Text style={styles.avisoBtn}>Activar</Text>
              </TouchableOpacity>
            ))}

            {proxima && (
              <View style={styles.resumen}>
                <Text style={styles.resumenLabel}>Próxima alarma</Text>
                <Text style={styles.resumenTexto}>
                  {textoHora(proxima.alarma.hora, proxima.alarma.minuto)} ·{" "}
                  {textoFaltante(proxima.fecha, ahora)}
                </Text>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>⏰</Text>
            <Text style={styles.emptyTitulo}>Aún no tienes alarmas</Text>
            <Text style={styles.emptyText}>
              Crea una y elige el ejercicio que tendrás que hacer para apagarla.
            </Text>
            <TouchableOpacity style={styles.boton} onPress={abrirNueva}>
              <Text style={styles.botonText}>Crear alarma</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, !item.activa && styles.cardApagada]}
            onPress={() => abrirEdicion(item)}
          >
            <View style={{ flex: 1 }}>
              <Text style={[styles.hora, !item.activa && styles.textoApagado]}>
                {textoHora(item.hora, item.minuto)}
              </Text>
              <Text style={styles.detalle}>
                {item.etiqueta ? `${item.etiqueta} · ` : ""}
                {textoDias(item.dias)}
              </Text>
              <Text style={styles.detalle}>{textoDesafio(item)}</Text>
            </View>
            <Switch
              value={item.activa}
              onValueChange={() => alternar(item)}
              accessibilityLabel={`Alarma de las ${textoHora(item.hora, item.minuto)} ${item.activa ? "activa" : "apagada"}`}
              trackColor={{ false: colors.input, true: colors.success }}
              thumbColor={colors.text}
            />
          </TouchableOpacity>
        )}
      />

      {alarmas.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={abrirNueva}
          accessibilityRole="button"
          accessibilityLabel="Nueva alarma"
        >
          <Ionicons name="add" size={28} color={colors.background} />
        </TouchableOpacity>
      )}

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalFondo}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View style={styles.modal}>
            <ScrollView keyboardShouldPersistTaps="handled">
              <Text style={styles.modalTitulo}>
                {editandoId ? "Editar alarma" : "Nueva alarma"}
              </Text>

              {/* Hora */}
              <TouchableOpacity onPress={() => setShowPicker(true)}>
                <Text style={styles.horaGrande}>{textoHora(form.hora, form.minuto)}</Text>
                <Text style={styles.ayudaCentro}>Toca para cambiar la hora</Text>
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={fechaPicker}
                  mode="time"
                  is24Hour
                  onChange={(event, fecha) => {
                    setShowPicker(false);
                    // "set" = el usuario confirmó; "dismissed" = canceló
                    if (event.type === "set" && fecha) {
                      setForm((f) => ({ ...f, hora: fecha.getHours(), minuto: fecha.getMinutes() }));
                    }
                  }}
                />
              )}

              {/* Días */}
              <Text style={styles.label}>Repetir</Text>
              <View style={styles.diasRow}>
                {DIAS_SEMANA.map(({ dia, corto }) => {
                  const on = form.dias.includes(dia);
                  return (
                    <TouchableOpacity
                      key={dia}
                      style={[styles.dia, on && styles.diaOn]}
                      onPress={() => toggleDia(dia)}
                    >
                      <Text style={[styles.diaTexto, on && styles.diaTextoOn]}>{corto}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.ayuda}>{textoDias(form.dias)}</Text>

              {/* Desafío */}
              <Text style={styles.label}>Desafío para apagarla</Text>
              <View style={styles.desafiosRow}>
                {Object.entries(DESAFIOS).map(([clave, d]) => {
                  const on = form.desafio === clave;
                  return (
                    <TouchableOpacity
                      key={clave}
                      style={[styles.desafio, on && styles.desafioOn]}
                      onPress={() => elegirDesafio(clave)}
                    >
                      <Text style={styles.desafioIcono}>{d.icono}</Text>
                      <Text style={[styles.desafioTexto, on && styles.diaTextoOn]}>{d.label}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Text style={styles.label}>
                {desafioForm.unidad === "seg" ? "Segundos" : "Repeticiones"} ({desafioForm.min}–
                {desafioForm.max})
              </Text>
              <TextInput
                style={styles.input}
                keyboardType="number-pad"
                value={form.cantidad}
                onChangeText={(v) => campo("cantidad", v.replace(/[^0-9]/g, ""))}
              />

              <Text style={styles.label}>Etiqueta (opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Ir al gym"
                placeholderTextColor={colors.textMuted}
                value={form.etiqueta}
                onChangeText={(v) => campo("etiqueta", v)}
                maxLength={40}
              />

              {error ? <Text style={styles.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[styles.boton, guardando && { opacity: 0.6 }]}
                onPress={handleGuardar}
                disabled={guardando}
              >
                <Text style={styles.botonText}>
                  {guardando ? "Guardando..." : editandoId ? "Guardar cambios" : "Crear alarma"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.secundario} onPress={handleProbar}>
                <Ionicons name="play-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.secundarioTexto}>Probar (suena en 10 s)</Text>
              </TouchableOpacity>

              {editandoId && (
                <TouchableOpacity style={styles.secundario} onPress={handleEliminar}>
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.secundarioTexto, { color: colors.danger }]}>
                    Eliminar alarma
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelar}>Cancelar</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 100 },

  aviso: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderColor: colors.warning,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  avisoTitulo: { color: colors.text, fontSize: 14, fontWeight: "600" },
  avisoTexto: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  avisoBtn: { color: colors.warning, fontWeight: "700", fontSize: 13 },

  resumen: { marginBottom: 14, marginTop: 4 },
  resumenLabel: { color: colors.textSecondary, fontSize: 12 },
  resumenTexto: { color: colors.text, fontSize: 16, fontWeight: "600", marginTop: 2 },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
  },
  cardApagada: { opacity: 0.6 },
  hora: { color: colors.text, fontSize: 34, fontWeight: "300" },
  textoApagado: { color: colors.textSecondary },
  detalle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },

  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 24,
    alignItems: "center",
    marginTop: 20,
  },
  emptyEmoji: { fontSize: 36, marginBottom: 8 },
  emptyTitulo: { color: colors.text, fontSize: 17, fontWeight: "600" },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: "center",
    marginTop: 6,
    marginBottom: 16,
  },

  fab: {
    position: "absolute",
    right: 20,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalFondo: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.6)" },
  modal: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "92%",
  },
  modalTitulo: { color: colors.text, fontSize: 18, fontWeight: "700", marginBottom: 8 },
  horaGrande: {
    color: colors.text,
    fontSize: 56,
    fontWeight: "200",
    textAlign: "center",
  },
  ayudaCentro: { color: colors.textMuted, fontSize: 12, textAlign: "center" },
  label: { color: colors.textSecondary, fontSize: 13, marginTop: 16, marginBottom: 8 },
  ayuda: { color: colors.textMuted, fontSize: 12, marginTop: 6 },

  diasRow: { flexDirection: "row", justifyContent: "space-between" },
  dia: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.input,
    alignItems: "center",
    justifyContent: "center",
  },
  diaOn: { backgroundColor: colors.success },
  diaTexto: { color: colors.textSecondary, fontWeight: "600" },
  diaTextoOn: { color: colors.background },

  desafiosRow: { flexDirection: "row", gap: 8 },
  desafio: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  desafioOn: { backgroundColor: colors.success },
  desafioIcono: { fontSize: 22 },
  desafioTexto: { color: colors.textSecondary, fontSize: 12, marginTop: 4, fontWeight: "600" },

  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
  },
  error: { color: colors.danger, fontSize: 13, marginTop: 12 },

  boton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center",
    marginTop: 20,
  },
  botonText: { color: colors.background, fontWeight: "600", fontSize: 15 },
  secundario: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
  },
  secundarioTexto: { color: colors.textSecondary, fontSize: 14 },
  cancelar: { color: colors.textMuted, textAlign: "center", paddingVertical: 10 },
});
