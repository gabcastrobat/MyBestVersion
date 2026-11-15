import { Ionicons } from "@expo/vector-icons";
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
import { CategoriaGrid } from "../src/components/CategoriaGrid";
import { colors } from "../src/constants/colors";
import { AREAS, MAX_ANCLAS } from "../src/constants/planMejora";
import { usePlan } from "../src/hooks/usePlan";
import { anclasActivas, diasEstaSemana, racha } from "../src/storage/plan";
import { diasDeLaSemana, hoy, inicioSemana } from "../src/utils/fechas";

const LETRAS_SEMANA = ["L", "M", "M", "J", "V", "S", "D"];
const METAS_SEMANALES = [3, 5, 7];

// Color del cuadrito de cada día según cómo lo marcaste
const COLOR_DIA = { completo: colors.success, minimo: colors.warning };

export default function PlanScreen() {
  const p = usePlan();
  // modal = null | { tipo: "cola" } | { tipo: "victoria" } | { tipo: "promover", meta }
  const [modal, setModal] = useState(null);
  const [texto, setTexto] = useState("");
  const [area, setArea] = useState("Cuerpo");
  const [metaSemanal, setMetaSemanal] = useState(7);
  const [nota, setNota] = useState("");

  if (p.cargando) return <View style={styles.container} />;

  const { plan } = p;
  const activas = anclasActivas(plan);
  const automaticos = plan.habitos.filter((h) => h.estado === "automatico");
  const cupoLibre = activas.length < MAX_ANCLAS;
  const esDomingo = new Date().getDay() === 0;
  const semana = diasDeLaSemana();
  const fechaHoy = hoy();
  const revisionSemana = plan.revisiones.find(
    (r) => r.semana === inicioSemana(),
  );
  const ultimaRevision = plan.revisiones[0];

  function abrirModal(config) {
    setTexto("");
    setArea("Cuerpo");
    setMetaSemanal(7);
    setModal(config);
  }

  async function guardarModal() {
    try {
      if (modal.tipo === "promover") {
        await p.promover(modal.meta.id, { minimo: texto, metaSemanal });
      } else {
        if (!texto.trim()) return;
        if (modal.tipo === "cola") await p.agregarACola(texto, area);
        else await p.agregarVictoria(texto);
      }
      setModal(null);
    } catch (e) {
      Alert.alert("Regla de oro", e.message);
    }
  }

  // Explicación de las reglas del plan, para quien no recuerda cómo funciona
  function explicarReglas() {
    Alert.alert(
      "Cómo funciona",
      `• Máximo ${MAX_ANCLAS} hábitos ancla a la vez: así te enfocas en pocos.\n` +
        "• Cada uno tiene una versión mínima para los días malos: hacerla también cuenta.\n" +
        "• Cuando un hábito ya te sale solo, márcalo como automático (⋯) y se libera el cupo.\n" +
        "• Las metas que esperan están en la cola; ahí eliges la siguiente.\n" +
        "• Los domingos haces la revisión de la semana.",
    );
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

  function opcionesHabito(h) {
    Alert.alert(h.nombre, "¿Qué quieres hacer con este hábito?", [
      {
        text: "Ya me sale solo ✓",
        onPress: () => p.marcarAutomatico(h.id),
      },
      { text: "Devolver a la cola", onPress: () => p.devolverACola(h.id) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  function tocarMetaDeCola(meta) {
    if (!cupoLibre) {
      Alert.alert(
        "Regla de oro",
        `Ya tienes ${MAX_ANCLAS} hábitos ancla. Cuando uno te salga en automático, toca ⋯ en ese hábito y márcalo: ahí se libera el cupo.`,
      );
      return;
    }
    abrirModal({ tipo: "promover", meta });
  }

  function confirmarQuitar(meta) {
    Alert.alert("Quitar de la cola", `¿Borrar "${meta.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => p.quitarDeCola(meta.id),
      },
    ]);
  }

  async function handleGuardarRevision() {
    await p.guardarRevision(nota);
    setNota("");
  }

  const victoriasHechas = plan.victorias.filter((v) => v.hecha).length;

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

        {/* ── Hábitos ancla ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Hábitos ancla</Text>
          <View style={styles.headerDerecha}>
            <Text style={styles.contador}>
              {activas.length}/{MAX_ANCLAS}
            </Text>
            <TouchableOpacity
              onPress={explicarReglas}
              style={styles.iconoBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Cómo funciona el plan"
            >
              <Ionicons
                name="information-circle-outline"
                size={22}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>
        <Text style={styles.ayuda}>
          Toca ⋯ en un hábito cuando ya te salga solo.
        </Text>

        {activas.length === 0 && (
          <Text style={styles.vacio}>
            Sin hábitos activos. Escoge uno de la cola 👇
          </Text>
        )}

        {activas.map((h) => {
          const cfg = AREAS[h.area] ?? AREAS.Cuerpo;
          const marcaHoy = h.dias[fechaHoy];
          const hechos = diasEstaSemana(h);
          const dias = racha(h);
          return (
            <TouchableOpacity
              key={h.id}
              style={styles.card}
              onLongPress={() => opcionesHabito(h)}
              activeOpacity={0.85}
            >
              <View style={styles.habitoTop}>
                <View
                  style={[styles.iconBox, { backgroundColor: cfg.color + "22" }]}
                >
                  <Ionicons name={cfg.icon} size={20} color={cfg.color} />
                </View>
                <View style={styles.flex}>
                  <Text style={styles.nombre}>{h.nombre}</Text>
                  <Text style={styles.sub}>Mínimo: {h.minimo}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => opcionesHabito(h)}
                  style={styles.iconoBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones del hábito ${h.nombre}`}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {/* Semana: L M M J V S D */}
              <View style={styles.semanaRow}>
                {semana.map((fecha, i) => (
                  <View key={fecha} style={styles.diaCol}>
                    <View
                      style={[
                        styles.diaBox,
                        h.dias[fecha] && {
                          backgroundColor: COLOR_DIA[h.dias[fecha]],
                        },
                        fecha === fechaHoy && styles.diaHoy,
                      ]}
                    />
                    <Text style={styles.diaLetra}>{LETRAS_SEMANA[i]}</Text>
                  </View>
                ))}
              </View>

              <Text style={styles.sub}>
                {hechos}/{h.metaSemanal} esta semana
                {dias > 0 ? ` · 🔥 ${dias} día${dias === 1 ? "" : "s"} seguidos` : ""}
              </Text>

              <View style={styles.botonesRow}>
                <TouchableOpacity
                  style={[
                    styles.marcaBtn,
                    marcaHoy === "completo" && styles.marcaCompleto,
                  ]}
                  onPress={() => p.marcarHabito(h.id, "completo")}
                >
                  <Text
                    style={[
                      styles.marcaText,
                      marcaHoy === "completo" && styles.marcaTextActivo,
                    ]}
                  >
                    ✓ Hecho
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.marcaBtn,
                    marcaHoy === "minimo" && styles.marcaMinimo,
                  ]}
                  onPress={() => p.marcarHabito(h.id, "minimo")}
                >
                  <Text
                    style={[
                      styles.marcaText,
                      marcaHoy === "minimo" && styles.marcaTextActivo,
                    ]}
                  >
                    Versión mínima
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          );
        })}

        {automaticos.length > 0 && (
          <View style={styles.automaticosBox}>
            <Text style={styles.sub}>Ya te salen solos:</Text>
            {automaticos.map((h) => (
              <Text key={h.id} style={styles.automatico}>
                ✓ {h.nombre}
              </Text>
            ))}
          </View>
        )}

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
              <Ionicons
                name="close"
                size={18}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => abrirModal({ tipo: "victoria" })}
        >
          <Text style={styles.agregarText}>+ Victoria rápida</Text>
        </TouchableOpacity>

        {/* ── Cola por área ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>En la cola</Text>
          <Text style={styles.contador}>{plan.cola.length}</Text>
        </View>
        <Text style={styles.ayuda}>
          {cupoLibre
            ? "Tienes un cupo libre: toca una meta para volverla hábito ancla."
            : "Esperan su turno. Toca ⋯ para borrar una."}
        </Text>
        {Object.entries(AREAS).map(([nombreArea, cfg]) => {
          const metas = plan.cola.filter((c) => c.area === nombreArea);
          if (metas.length === 0) return null;
          return (
            <View key={nombreArea} style={styles.areaBox}>
              <View style={styles.areaHeader}>
                <Ionicons name={cfg.icon} size={16} color={cfg.color} />
                <Text style={[styles.areaTitulo, { color: cfg.color }]}>
                  {nombreArea}
                </Text>
              </View>
              {metas.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={styles.colaItem}
                  onPress={() => tocarMetaDeCola(m)}
                  onLongPress={() => confirmarQuitar(m)}
                >
                  <Text style={styles.filaText}>{m.nombre}</Text>
                  {cupoLibre && (
                    <Ionicons
                      name="arrow-up-circle-outline"
                      size={20}
                      color={colors.textSecondary}
                    />
                  )}
                  <TouchableOpacity
                    onPress={() => confirmarQuitar(m)}
                    style={styles.iconoBtn}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    accessibilityRole="button"
                    accessibilityLabel={`Borrar meta ${m.nombre}`}
                  >
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={18}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          );
        })}
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => abrirModal({ tipo: "cola" })}
        >
          <Text style={styles.agregarText}>+ Meta a la cola</Text>
        </TouchableOpacity>

        {/* ── Revisión del domingo ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Revisión semanal</Text>
        </View>
        <View style={[styles.card, esDomingo && styles.cardDomingo]}>
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
            value={nota}
            onChangeText={setNota}
            multiline
          />
          <TouchableOpacity style={styles.boton} onPress={handleGuardarRevision}>
            <Text style={styles.botonText}>
              {revisionSemana ? "Actualizar revisión" : "Guardar revisión"}
            </Text>
          </TouchableOpacity>
          {ultimaRevision?.nota ? (
            <Text style={styles.ultimaNota}>
              Última nota (semana del {ultimaRevision.semana}):{" "}
              {ultimaRevision.nota}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* ── Modal: agregar a la cola / victoria / promover ── */}
      <BottomSheet
        visible={modal !== null}
        onClose={() => setModal(null)}
        titulo={
          modal?.tipo === "promover"
            ? "Nuevo hábito ancla"
            : modal?.tipo === "cola"
              ? "Meta a la cola"
              : "Victoria rápida"
        }
      >
            {modal?.tipo === "promover" ? (
              <>
                <Text style={styles.nombre}>{modal.meta.nombre}</Text>
                <Text style={styles.label}>
                  Versión mínima (para los días malos)
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Ej: 5 minutos"
                  placeholderTextColor={colors.textMuted}
                  value={texto}
                  onChangeText={setTexto}
                />
                <Text style={styles.label}>Días por semana</Text>
                <View style={styles.botonesRow}>
                  {METAS_SEMANALES.map((n) => (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.marcaBtn,
                        metaSemanal === n && styles.marcaCompleto,
                      ]}
                      onPress={() => setMetaSemanal(n)}
                    >
                      <Text
                        style={[
                          styles.marcaText,
                          metaSemanal === n && styles.marcaTextActivo,
                        ]}
                      >
                        {n}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </>
            ) : (
              <>
                <TextInput
                  style={styles.input}
                  placeholder={
                    modal?.tipo === "cola"
                      ? "Ej: Retomar la lectura"
                      : "Ej: Comprar el champú"
                  }
                  placeholderTextColor={colors.textMuted}
                  value={texto}
                  onChangeText={setTexto}
                />
                {modal?.tipo === "cola" && (
                  <>
                    <Text style={styles.label}>Área</Text>
                    <CategoriaGrid
                      opciones={AREAS}
                      seleccionada={area}
                      onSeleccionar={setArea}
                    />
                  </>
                )}
              </>
            )}

            <Boton titulo="Guardar" onPress={guardarModal} />
            <Boton
              titulo="Cancelar"
              variante="texto"
              onPress={() => setModal(null)}
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

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  seccionTitulo: { fontSize: 17, fontWeight: "700", color: colors.text },
  contador: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  headerDerecha: { flexDirection: "row", alignItems: "center", gap: 8 },
  iconoBtn: { padding: 6 },
  ayuda: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },
  vacio: { color: colors.textSecondary, fontSize: 14, marginBottom: 10 },

  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardDomingo: { borderWidth: 1, borderColor: colors.warning },
  habitoTop: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nombre: { fontSize: 15, fontWeight: "600", color: colors.text },
  sub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

  semanaRow: { flexDirection: "row", justifyContent: "space-between" },
  diaCol: { alignItems: "center", gap: 4 },
  diaBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: colors.input,
  },
  diaHoy: { borderWidth: 2, borderColor: colors.text },
  diaLetra: { fontSize: 11, color: colors.textMuted },

  botonesRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  marcaBtn: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  marcaCompleto: { backgroundColor: colors.success },
  marcaMinimo: { backgroundColor: colors.warning },
  marcaText: { color: colors.textSecondary, fontWeight: "600", fontSize: 13 },
  marcaTextActivo: { color: colors.background },

  automaticosBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  automatico: { color: colors.success, fontSize: 13 },

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

  areaBox: { marginBottom: 12 },
  areaHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 6,
  },
  areaTitulo: { fontSize: 13, fontWeight: "700" },
  colaItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },

  agregarBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
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

  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.input,
    color: colors.text,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    fontSize: 15,
  },
  boton: {
    backgroundColor: colors.primary,
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
    marginBottom: 10,
  },
  botonText: { color: colors.background, fontWeight: "600", fontSize: 15 },
});
