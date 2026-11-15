import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useState } from "react";
import {
  Alert,
  FlatList,
  ScrollView,
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
import { EstadoError } from "../src/components/EstadoError";
import { EstadoVacio } from "../src/components/EstadoVacio";
import { TarjetaHabito } from "../src/components/TarjetaHabito";
import { colors } from "../src/constants/colors.js";
import { AREAS, CATEGORIAS, MAX_ANCLAS } from "../src/constants/planMejora";
import { usePlan } from "../src/hooks/usePlan";
import {
  anclasActivas,
  habitosAutomaticos,
  habitosDeHoy,
  historialPorDia,
} from "../src/storage/plan";
import { hoy } from "../src/utils/fechas";
import { formatHora, horaADate, minutosDelDia } from "../src/utils/horas";

const METAS_SEMANALES = [1, 2, 3, 4, 5, 6, 7];

// "2026-11-06" → "vie, 6 nov"
function fechaCorta(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

// Pantalla de Hábitos: lo que antes eran "Rutinas" y los "hábitos ancla" del
// plan, ya unificados. Aquí se crean, editan y se administran; se marcan en
// Hoy o directamente en esta pantalla.
export default function HabitosScreen() {
  const p = usePlan();

  // modal = null | { tipo: "habito", editandoId } | { tipo: "cola" }
  //              | { tipo: "promover", meta }
  const [modal, setModal] = useState(null);
  const [habitoMenu, setHabitoMenu] = useState(null); // hábito con el menú ⋯ abierto
  const [historialVisible, setHistorialVisible] = useState(false);

  // Campos del formulario (los comparten los tres modales)
  const [nombre, setNombre] = useState("");
  const [categoria, setCategoria] = useState("General");
  const [hora, setHora] = useState(null); // Date | null (null = sin recordatorio)
  const [minimo, setMinimo] = useState("");
  const [metaSemanal, setMetaSemanal] = useState(7);
  const [area, setArea] = useState("Cuerpo");
  const [showPicker, setShowPicker] = useState(false);
  const [error, setError] = useState("");

  if (p.cargando) return <View style={styles.container} />;
  if (p.error) {
    return (
      <View style={[styles.container, styles.centrado]}>
        <EstadoError
          mensaje="No se pudieron cargar tus hábitos. Tus datos siguen guardados en el teléfono."
          onReintentar={p.reintentar}
        />
      </View>
    );
  }

  const { plan } = p;
  const delDia = habitosDeHoy(plan).sort(
    (a, b) => minutosDelDia(a.hora) - minutosDelDia(b.hora),
  );
  const automaticos = habitosAutomaticos(plan);
  const anclas = anclasActivas(plan);
  const cupoLibre = anclas.length < MAX_ANCLAS;
  const hechosHoy = delDia.filter((h) => h.dias[hoy()]).length;
  const historial = historialPorDia(plan);

  function limpiarFormulario() {
    setNombre("");
    setCategoria("General");
    setHora(null);
    setMinimo("");
    setMetaSemanal(7);
    setArea("Cuerpo");
    setShowPicker(false);
    setError("");
  }

  function abrirNuevo() {
    limpiarFormulario();
    setModal({ tipo: "habito", editandoId: null });
  }

  function abrirEdicion(h) {
    limpiarFormulario();
    setNombre(h.nombre);
    setCategoria(h.categoria);
    setHora(h.hora ? horaADate(h.hora) : null);
    setMinimo(h.minimo ?? "");
    setMetaSemanal(h.metaSemanal);
    setModal({ tipo: "habito", editandoId: h.id });
  }

  function abrirModalCola(config) {
    limpiarFormulario();
    setModal(config);
  }

  async function guardarModal() {
    try {
      if (modal.tipo === "habito") {
        if (!nombre.trim()) {
          setError("Escribe un nombre para el hábito");
          return;
        }
        const datos = {
          nombre,
          categoria,
          hora: hora ? formatHora(hora) : null,
          minimo,
          metaSemanal,
        };
        if (modal.editandoId) await p.actualizarHabito(modal.editandoId, datos);
        else await p.crearHabito(datos);
      } else if (modal.tipo === "promover") {
        await p.promover(modal.meta.id, { minimo, metaSemanal });
      } else {
        if (!nombre.trim()) {
          setError("Escribe la meta");
          return;
        }
        await p.agregarACola(nombre, area);
      }
      setModal(null);
    } catch (e) {
      Alert.alert("Regla de oro", e.message);
    }
  }

  function explicarReglas() {
    Alert.alert(
      "Cómo funcionan los hábitos",
      "• Un hábito puede tener hora (con recordatorio diario), una versión mínima y una meta de días por semana.\n" +
        `• Los hábitos ancla son tus ${MAX_ANCLAS} más importantes: máximo ${MAX_ANCLAS} a la vez, para enfocarte en pocos.\n` +
        "• La versión mínima es para los días malos: hacerla también cuenta.\n" +
        "• Cuando un ancla ya te sale sola, márcala como automática (⋯) y se libera el cupo.\n" +
        "• Las metas que esperan están en la cola; ahí eliges la siguiente.",
    );
  }

  // Acciones del menú ⋯ de un hábito. Cada una cierra el menú primero.
  async function ejecutarMenu(accion) {
    const h = habitoMenu;
    setHabitoMenu(null);
    try {
      await accion(h);
    } catch (e) {
      Alert.alert("Regla de oro", e.message);
    }
  }

  function confirmarEliminar(h) {
    Alert.alert(
      "Eliminar hábito",
      `¿Borrar "${h.nombre}"? Se pierde su racha y se cancela el recordatorio.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => p.eliminarHabito(h.id),
        },
      ],
    );
  }

  function tocarMetaDeCola(meta) {
    if (!cupoLibre) {
      Alert.alert(
        "Regla de oro",
        `Ya tienes ${MAX_ANCLAS} hábitos ancla. Cuando uno te salga en automático, toca ⋯ en ese hábito y márcalo: ahí se libera el cupo.`,
      );
      return;
    }
    limpiarFormulario();
    setModal({ tipo: "promover", meta });
  }

  function confirmarQuitarMeta(meta) {
    Alert.alert("Quitar de la cola", `¿Borrar "${meta.nombre}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Borrar",
        style: "destructive",
        onPress: () => p.quitarDeCola(meta.id),
      },
    ]);
  }

  // Opciones del menú ⋯ según el tipo de hábito
  const opcionesMenu = habitoMenu
    ? [
        { icono: "create-outline", texto: "Editar", accion: (h) => abrirEdicion(h) },
        habitoMenu.ancla && {
          icono: "checkmark-done-outline",
          texto: "Ya me sale solo",
          accion: (h) => p.marcarAutomatico(h.id),
        },
        habitoMenu.ancla && {
          icono: "arrow-undo-outline",
          texto: "Devolver a la cola",
          accion: (h) => p.devolverACola(h.id),
        },
        habitoMenu.ancla && {
          icono: "pin-outline",
          texto: "Quitar ancla (sigue como hábito)",
          accion: (h) => p.quitarAncla(h.id),
        },
        !habitoMenu.ancla && {
          icono: "pin",
          texto: "Hacer hábito ancla",
          accion: (h) => p.hacerAncla(h.id),
        },
        {
          icono: "trash-outline",
          texto: "Eliminar",
          peligro: true,
          accion: (h) => confirmarEliminar(h),
        },
      ].filter(Boolean)
    : [];

  const tituloModal =
    modal?.tipo === "habito"
      ? modal.editandoId
        ? "Editar hábito"
        : "Nuevo hábito"
      : modal?.tipo === "promover"
        ? "Nuevo hábito ancla"
        : "Meta a la cola";

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Resumen del día */}
        {delDia.length > 0 && (
          <Contadores
            pendientes={delDia.length - hechosHoy}
            completadas={hechosHoy}
          />
        )}

        <View style={styles.cabecera}>
          <View style={styles.anclaInfo}>
            <Text style={styles.contador}>
              Hábitos ancla {anclas.length}/{MAX_ANCLAS}
            </Text>
            <TouchableOpacity
              onPress={explicarReglas}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              accessibilityRole="button"
              accessibilityLabel="Cómo funcionan los hábitos"
            >
              <Ionicons
                name="information-circle-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={styles.historialBtn}
            onPress={() => setHistorialVisible(true)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Ver historial de hábitos"
          >
            <Ionicons
              name="time-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.historialBtnText}>Ver historial</Text>
          </TouchableOpacity>
        </View>

        {/* Hábitos de hoy */}
        {delDia.length === 0 ? (
          <EstadoVacio
            icono="repeat-outline"
            titulo="Sin hábitos aún"
            subtitulo={
              plan.cola.length > 0
                ? "Agrega tu primer hábito, o escoge uno de la cola"
                : "Toca “Nuevo hábito” para agregar el primero"
            }
          />
        ) : (
          delDia.map((h) => (
            <TarjetaHabito
              key={h.id}
              habito={h}
              onMarcar={(tipo) => p.marcarHabito(h.id, tipo)}
              acciones={
                <TouchableOpacity
                  onPress={() => setHabitoMenu(h)}
                  style={styles.menuBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                  accessibilityRole="button"
                  accessibilityLabel={`Opciones del hábito ${h.nombre}`}
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
            />
          ))
        )}

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

        {/* ── Cola por área ── */}
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>En la cola</Text>
          <Text style={styles.contador}>{plan.cola.length}</Text>
        </View>
        <Text style={styles.ayuda}>
          {plan.cola.length === 0
            ? "Guarda aquí las metas que quieres empezar más adelante, para no cargar con todo a la vez."
            : cupoLibre
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
                <View key={m.id} style={styles.colaItem}>
                  <TouchableOpacity
                    style={styles.colaZona}
                    onPress={() => tocarMetaDeCola(m)}
                    onLongPress={() => confirmarQuitarMeta(m)}
                    accessibilityRole="button"
                    accessibilityLabel={`Meta en cola: ${m.nombre}`}
                    accessibilityHint={
                      cupoLibre ? "Convierte la meta en hábito ancla" : undefined
                    }
                  >
                    <Text style={styles.colaTexto}>{m.nombre}</Text>
                    {cupoLibre && (
                      <Ionicons
                        name="arrow-up-circle-outline"
                        size={20}
                        color={colors.textSecondary}
                      />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => confirmarQuitarMeta(m)}
                    style={styles.menuBtn}
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
                </View>
              ))}
            </View>
          );
        })}
        <TouchableOpacity
          style={styles.agregarBtn}
          onPress={() => abrirModalCola({ tipo: "cola" })}
          accessibilityRole="button"
        >
          <Text style={styles.agregarText}>+ Meta a la cola</Text>
        </TouchableOpacity>
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={abrirNuevo}
        accessibilityRole="button"
      >
        <Ionicons name="add" size={22} color={colors.background} />
        <Text style={styles.fabText}>Nuevo hábito</Text>
      </TouchableOpacity>

      {/* Menú ⋯ de un hábito */}
      <BottomSheet
        visible={habitoMenu !== null}
        onClose={() => setHabitoMenu(null)}
        titulo={habitoMenu?.nombre}
      >
        {opcionesMenu.map((o) => (
          <TouchableOpacity
            key={o.texto}
            style={styles.opcion}
            onPress={() => ejecutarMenu(o.accion)}
            accessibilityRole="button"
          >
            <Ionicons
              name={o.icono}
              size={20}
              color={o.peligro ? colors.danger : colors.text}
            />
            <Text
              style={[styles.opcionTexto, o.peligro && { color: colors.danger }]}
            >
              {o.texto}
            </Text>
          </TouchableOpacity>
        ))}
        <Boton
          titulo="Cancelar"
          variante="texto"
          onPress={() => setHabitoMenu(null)}
        />
      </BottomSheet>

      {/* Nuevo / editar hábito, meta a la cola, promover a ancla */}
      <BottomSheet
        visible={modal !== null}
        onClose={() => setModal(null)}
        titulo={tituloModal}
        style={styles.modalAlto}
      >
        {modal?.tipo === "habito" && (
          <ScrollView keyboardShouldPersistTaps="handled">
            <Campo
              placeholder="Nombre (ej: Entrenar)"
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                if (error) setError("");
              }}
              error={error}
            />

            <Text style={styles.label}>Hora del recordatorio (opcional)</Text>
            <View style={styles.horaRow}>
              <TouchableOpacity
                style={styles.horaBtn}
                onPress={() => setShowPicker(true)}
                accessibilityRole="button"
                accessibilityLabel={
                  hora ? `Hora: ${formatHora(hora)}` : "Agregar hora"
                }
              >
                <Ionicons
                  name="time-outline"
                  size={18}
                  color={colors.textSecondary}
                />
                <Text style={styles.horaBtnText}>
                  {hora ? formatHora(hora) : "Sin recordatorio"}
                </Text>
              </TouchableOpacity>
              {hora && (
                <TouchableOpacity
                  onPress={() => setHora(null)}
                  style={styles.quitarHora}
                  accessibilityRole="button"
                  accessibilityLabel="Quitar hora"
                >
                  <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
            {showPicker && (
              <DateTimePicker
                value={hora ?? new Date()}
                mode="time"
                is24Hour={false}
                display="spinner"
                onChange={(event, selectedDate) => {
                  setShowPicker(false);
                  // "set" = confirmó; "dismissed" = canceló (no debe poner hora)
                  if (event.type === "set" && selectedDate) setHora(selectedDate);
                }}
              />
            )}

            <Campo
              label="Versión mínima para los días malos (opcional)"
              placeholder="Ej: 5 minutos"
              value={minimo}
              onChangeText={setMinimo}
            />

            <Text style={styles.label}>Días por semana</Text>
            <View style={styles.metasRow}>
              {METAS_SEMANALES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.metaBtn, metaSemanal === n && styles.metaActiva]}
                  onPress={() => setMetaSemanal(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: metaSemanal === n }}
                  accessibilityLabel={`${n} día${n === 1 ? "" : "s"} por semana`}
                >
                  <Text
                    style={[
                      styles.metaText,
                      metaSemanal === n && styles.metaTextActivo,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Categoría</Text>
            <CategoriaGrid
              opciones={CATEGORIAS}
              seleccionada={categoria}
              onSeleccionar={setCategoria}
            />
          </ScrollView>
        )}

        {modal?.tipo === "promover" && (
          <>
            <Text style={styles.metaNombre}>{modal.meta.nombre}</Text>
            <Campo
              label="Versión mínima (para los días malos)"
              placeholder="Ej: 5 minutos"
              value={minimo}
              onChangeText={setMinimo}
            />
            <Text style={styles.label}>Días por semana</Text>
            <View style={styles.metasRow}>
              {METAS_SEMANALES.map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.metaBtn, metaSemanal === n && styles.metaActiva]}
                  onPress={() => setMetaSemanal(n)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: metaSemanal === n }}
                  accessibilityLabel={`${n} día${n === 1 ? "" : "s"} por semana`}
                >
                  <Text
                    style={[
                      styles.metaText,
                      metaSemanal === n && styles.metaTextActivo,
                    ]}
                  >
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {modal?.tipo === "cola" && (
          <>
            <Campo
              placeholder="Ej: Retomar la lectura"
              value={nombre}
              onChangeText={(t) => {
                setNombre(t);
                if (error) setError("");
              }}
              error={error}
            />
            <Text style={styles.label}>Área</Text>
            <CategoriaGrid
              opciones={AREAS}
              seleccionada={area}
              onSeleccionar={setArea}
            />
          </>
        )}

        <Boton titulo="Guardar" onPress={guardarModal} />
        <Boton
          titulo="Cancelar"
          variante="texto"
          onPress={() => setModal(null)}
        />
      </BottomSheet>

      {/* Historial de hábitos marcados */}
      <BottomSheet
        visible={historialVisible}
        onClose={() => setHistorialVisible(false)}
        titulo="Historial de hábitos"
        style={styles.historialModal}
      >
        <FlatList
          data={historial}
          keyExtractor={(d) => d.fecha}
          ListEmptyComponent={
            <Text style={styles.vacioHistorial}>
              Todavía no hay hábitos marcados.
            </Text>
          }
          renderItem={({ item: dia }) => (
            <View style={styles.historialDia}>
              <Text style={styles.historialFecha}>{fechaCorta(dia.fecha)}</Text>
              {dia.items.map((a) => (
                <Text key={a.id} style={styles.historialItem}>
                  ✓ {a.nombre}
                  {a.marca === "minimo" ? (
                    <Text style={styles.historialHora}> (versión mínima)</Text>
                  ) : null}
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
  centrado: { justifyContent: "center" },
  content: { padding: 16, paddingBottom: 100 },

  cabecera: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    marginBottom: 12,
  },
  anclaInfo: { flexDirection: "row", alignItems: "center", gap: 8 },
  contador: { fontSize: 13, fontWeight: "600", color: colors.textSecondary },
  historialBtn: { flexDirection: "row", alignItems: "center", gap: 6 },
  historialBtnText: { color: colors.textSecondary, fontSize: 13 },
  menuBtn: { padding: 8 },

  automaticosBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 12,
    gap: 4,
    marginTop: 4,
  },
  sub: { fontSize: 12, color: colors.textSecondary },
  automatico: { color: colors.success, fontSize: 13 },

  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 24,
  },
  seccionTitulo: { fontSize: 17, fontWeight: "700", color: colors.text },
  ayuda: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },
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
    paddingRight: 4,
    marginBottom: 6,
  },
  colaZona: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    minHeight: 48,
  },
  colaTexto: { color: colors.text, fontSize: 14, flex: 1 },
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

  opcion: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 52,
  },
  opcionTexto: { color: colors.text, fontSize: 15 },

  label: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: 8,
    marginTop: 12,
  },
  metaNombre: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 4,
  },
  horaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  horaBtn: {
    flex: 1,
    backgroundColor: colors.input,
    borderRadius: 10,
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  horaBtnText: { color: colors.text, fontSize: 15, fontWeight: "500" },
  quitarHora: { padding: 12 },
  metasRow: { flexDirection: "row", gap: 6, marginBottom: 4 },
  metaBtn: {
    flex: 1,
    minHeight: 44,
    backgroundColor: colors.input,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  metaActiva: { backgroundColor: colors.success },
  metaText: { color: colors.textSecondary, fontWeight: "600", fontSize: 14 },
  metaTextActivo: { color: colors.onPrimary },

  modalAlto: { maxHeight: "92%" },
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
});
