import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BottomSheet } from "../src/components/BottomSheet";
import { Boton } from "../src/components/Boton";
import { Campo } from "../src/components/Campo";
import { colors } from "../src/constants/colors";
import { MAX_ANCLAS } from "../src/constants/planMejora";
import { usePlan } from "../src/hooks/usePlan";
import { anclasActivas, diasEstaSemana } from "../src/storage/plan";
import { inicioSemana } from "../src/utils/fechas";

// Mi plan: victorias rápidas (cosas de una sola vez) y la revisión semanal.
// Los hábitos y la cola de metas viven ahora en la pestaña Hábitos.
export default function PlanScreen() {
  const router = useRouter();
  const p = usePlan();
  const [modalVictoria, setModalVictoria] = useState(false);
  const [texto, setTexto] = useState("");
  const [error, setError] = useState("");
  const [nota, setNota] = useState("");

  if (p.cargando) return <View style={styles.container} />;

  const { plan } = p;
  const activas = anclasActivas(plan);
  const esDomingo = new Date().getDay() === 0;
  const revisionSemana = plan.revisiones.find(
    (r) => r.semana === inicioSemana(),
  );
  const ultimaRevision = plan.revisiones[0];
  const victoriasHechas = plan.victorias.filter((v) => v.hecha).length;

  function abrirVictoria() {
    setTexto("");
    setError("");
    setModalVictoria(true);
  }

  async function guardarVictoria() {
    if (!texto.trim()) {
      setError("Escribe la victoria");
      return;
    }
    await p.agregarVictoria(texto);
    setModalVictoria(false);
  }

  function confirmarQuitarVictoria(v) {
    Alert.alert("Quitar victoria", `¿Borrar "${v.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => p.eliminarVictoria(v.id),
      },
    ]);
  }

  async function handleGuardarRevision() {
    await p.guardarRevision(nota);
    setNota("");
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Aviso de domingo */}
        {esDomingo && !revisionSemana && (
          <View style={styles.domingoBanner}>
            <Ionicons name="clipboard-outline" size={20} color={colors.warning} />
            <Text style={styles.domingoText}>
              Es domingo: toca la revisión de la semana (al final).
            </Text>
          </View>
        )}

        {/* Acceso a los hábitos */}
        <TouchableOpacity
          style={styles.habitosLink}
          onPress={() => router.push("/rutinas")}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Abrir Hábitos"
        >
          <Ionicons name="repeat-outline" size={20} color={colors.text} />
          <View style={styles.flex}>
            <Text style={styles.nombre}>Hábitos y cola de metas</Text>
            <Text style={styles.sub}>
              Hábitos ancla {activas.length}/{MAX_ANCLAS} · se manejan en la
              pestaña Hábitos
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textMuted}
          />
        </TouchableOpacity>

        {/* ── Victorias rápidas ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Victorias rápidas</Text>
          <Text style={styles.contador}>
            {victoriasHechas}/{plan.victorias.length}
          </Text>
        </View>
        <Text style={styles.ayuda}>Cosas de una sola vez. Táchalas ya.</Text>
        {plan.victorias.map((v) => (
          <TouchableOpacity
            key={v.id}
            style={styles.fila}
            onPress={() => p.toggleVictoria(v.id)}
            onLongPress={() => confirmarQuitarVictoria(v)}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: !!v.hecha }}
            accessibilityLabel={v.nombre}
          >
            <Ionicons
              name={v.hecha ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={v.hecha ? colors.success : colors.textMuted}
            />
            <Text style={[styles.filaText, v.hecha && styles.tachado]}>
              {v.nombre}
            </Text>
            <TouchableOpacity
              onPress={() => confirmarQuitarVictoria(v)}
              style={styles.iconoBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel={`Borrar victoria ${v.nombre}`}
            >
              <Ionicons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={abrirVictoria}
          accessibilityRole="button"
        >
          <Text style={styles.agregarText}>+ Victoria rápida</Text>
        </TouchableOpacity>

        {/* ── Revisión del domingo ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Revisión semanal</Text>
        </View>
        <View style={[styles.card, esDomingo && styles.cardDomingo]}>
          {activas.length === 0 && (
            <Text style={styles.sub}>
              Aún no tienes hábitos ancla. Escoge uno de la cola en Hábitos.
            </Text>
          )}
          {activas.map((h) => (
            <View key={h.id} style={styles.resumenFila}>
              <Text style={styles.filaText}>{h.nombre}</Text>
              <Text
                style={[
                  styles.resumenNum,
                  diasEstaSemana(h) >= h.metaSemanal && {
                    color: colors.success,
                  },
                ]}
              >
                {diasEstaSemana(h)}/{h.metaSemanal}
              </Text>
            </View>
          ))}
          <TextInput
            style={styles.notaInput}
            placeholder="¿Qué falló? ¿Qué ajusto la próxima semana?"
            placeholderTextColor={colors.textMuted}
            accessibilityLabel="Nota de la revisión semanal"
            value={nota}
            onChangeText={setNota}
            multiline
          />
          <Boton
            titulo={revisionSemana ? "Actualizar revisión" : "Guardar revisión"}
            onPress={handleGuardarRevision}
          />
          {ultimaRevision?.nota ? (
            <Text style={styles.ultimaNota}>
              Última nota (semana del {ultimaRevision.semana}):{" "}
              {ultimaRevision.nota}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      <BottomSheet
        visible={modalVictoria}
        onClose={() => setModalVictoria(false)}
        titulo="Victoria rápida"
      >
        <Campo
          placeholder="Ej: Comprar el champú"
          value={texto}
          onChangeText={(t) => {
            setTexto(t);
            if (error) setError("");
          }}
          error={error}
        />
        <Boton titulo="Guardar" onPress={guardarVictoria} />
        <Boton
          titulo="Cancelar"
          variante="texto"
          onPress={() => setModalVictoria(false)}
        />
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  flex: { flex: 1 },

  domingoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.warning + "22",
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  domingoText: { color: colors.warning, fontSize: 13, flex: 1 },

  habitosLink: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    minHeight: 60,
  },
  nombre: { fontSize: 15, fontWeight: "600", color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  seccionTitulo: { fontSize: 17, fontWeight: "700", color: colors.text },
  contador: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  ayuda: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
    gap: 10,
  },
  cardDomingo: { borderWidth: 1, borderColor: colors.warning },

  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  filaText: { color: colors.text, fontSize: 14, flex: 1 },
  tachado: { textDecorationLine: "line-through", color: colors.textMuted },
  iconoBtn: { padding: 6 },

  agregarBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  agregarText: { color: colors.textSecondary, fontSize: 14 },

  resumenFila: { flexDirection: "row", alignItems: "center" },
  resumenNum: { color: colors.textSecondary, fontWeight: "700" },
  notaInput: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 12,
    minHeight: 70,
    textAlignVertical: "top",
    fontSize: 14,
  },
  ultimaNota: { color: colors.textMuted, fontSize: 12, lineHeight: 18 },
});
