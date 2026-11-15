import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Boton } from "../src/components/Boton";
import { EstadoVacio } from "../src/components/EstadoVacio";
import { FilaMarcable } from "../src/components/FilaMarcable";
import { TarjetaHabito } from "../src/components/TarjetaHabito";
import { colors } from "../src/constants/colors.js";
import { useGastos } from "../src/hooks/useGastos";
import { usePerfil } from "../src/hooks/usePerfil";
import { usePlan } from "../src/hooks/usePlan";
import { useTareas } from "../src/hooks/useTareas";
import { habitosDeHoy } from "../src/storage/plan";
import { hoy as fechaHoy } from "../src/utils/fechas";
import { minutosDelDia } from "../src/utils/horas";

// El cuy entrenador cambia según cuánto llevas del día
const cuyImagenes = {
  agua: require("../assets/images/cuy/agua.jpg"),
  cuerda: require("../assets/images/cuy/cuerda.jpg"),
  pesas: require("../assets/images/cuy/pesas.jpg"),
  boxeando: require("../assets/images/cuy/boxeando.jpg"),
};

function mensajeCuy(progreso, total) {
  if (total === 0)
    return {
      img: cuyImagenes.agua,
      titulo: "Empieza tu día",
      texto: "Agrega un hábito o una tarea. El cuy te está esperando.",
    };
  if (progreso >= 1)
    return {
      img: cuyImagenes.boxeando,
      titulo: "¡Día completado! 🥊",
      texto: "Cumpliste todo. Esa es tu mejor versión.",
    };
  if (progreso >= 0.5)
    return {
      img: cuyImagenes.pesas,
      titulo: "Vas con toda 💪",
      texto: "Ya pasaste la mitad, no aflojes ahora.",
    };
  if (progreso > 0)
    return {
      img: cuyImagenes.cuerda,
      titulo: "Arrancaste",
      texto: "Cada cosa que marcas cuenta. Sigue así.",
    };
  return {
    img: cuyImagenes.agua,
    titulo: "Toma agua y arranca",
    texto: "Aún no marcas nada hoy. Empieza por lo más fácil.",
  };
}

const COLOR_PRIORIDAD = {
  Alta: colors.danger,
  Media: colors.warning,
  Baja: colors.success,
};
const ORDEN_PRIORIDAD = { Alta: 0, Media: 1, Baja: 2 };

export default function HoyScreen() {
  const router = useRouter();
  // Los hooks recargan al ganar foco y aplican el reset diario
  const { tareas, toggle: toggleTarea } = useTareas();
  const { perfil } = usePerfil();
  const { gastos } = useGastos();
  const { plan, marcarHabito, error: errorPlan, reintentar } = usePlan();

  // Marcar una tarea: vibración suave solo al completar.
  // (Los hábitos se marcan dentro de TarjetaHabito, que ya vibra por su cuenta.)
  function marcarTarea(tarea) {
    if (!tarea.completada)
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    toggleTarea(tarea.id);
  }

  // Hábitos que tocan hoy (activos, ancla o no), por hora. Cuenta como hecho si
  // está marcado "completo" o "minimo". Mientras el plan carga, no hay ninguno.
  const hoyStr = fechaHoy();
  const habitos = (plan ? habitosDeHoy(plan) : [])
    .sort((a, b) => minutosDelDia(a.hora) - minutosDelDia(b.hora))
    .map((h) => ({ ...h, tipo: "habito", completada: !!h.dias[hoyStr] }));

  // Lista única de "lo de hoy": hábitos por hora y tareas por prioridad.
  // Lo pendiente va arriba; lo hecho baja (sigue visible para poder deshacer).
  const items = [
    ...habitos,
    ...[...tareas]
      .sort(
        (a, b) =>
          (ORDEN_PRIORIDAD[a.prioridad] ?? 3) -
          (ORDEN_PRIORIDAD[b.prioridad] ?? 3),
      )
      .map((t) => ({ ...t, tipo: "tarea" })),
  ];
  const lista = [
    ...items.filter((i) => !i.completada),
    ...items.filter((i) => i.completada),
  ];

  const hechos = items.length - items.filter((i) => !i.completada).length;
  const progreso = items.length > 0 ? hechos / items.length : 0;
  const cuy = mensajeCuy(progreso, items.length);

  const hoyDateStr = new Date().toDateString();
  const gastoHoy = gastos
    .filter((g) => new Date(g.fecha).toDateString() === hoyDateStr)
    .reduce((s, g) => s + (Number(g.monto) || 0), 0);

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  // Primer nombre del perfil. Sin perfil todavía: saludo genérico e icono.
  const nombre = perfil.nombre?.trim().split(" ")[0] ?? "";
  const inicial = nombre.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.saludo}>{saludo}</Text>
          <Text style={styles.nombre}>{nombre || "¡Hola!"} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/perfil")}
          accessibilityRole="button"
          accessibilityLabel="Abrir perfil"
        >
          {inicial ? (
            <Text style={styles.avatarText}>{inicial}</Text>
          ) : (
            <Ionicons name="person-outline" size={20} color={colors.text} />
          )}
        </TouchableOpacity>
      </View>

      {/* Progreso del día + cuy, en una sola tarjeta */}
      <View style={styles.progresoCard}>
        <View style={styles.cuyRow}>
          <Image source={cuy.img} style={styles.cuyImg} contentFit="cover" />
          <View style={styles.cuyInfo}>
            <Text style={styles.cuyTitulo}>{cuy.titulo}</Text>
            <Text style={styles.cuyTexto}>{cuy.texto}</Text>
          </View>
        </View>
        <View style={styles.progresoHeader}>
          <Text style={styles.progresoSub}>
            {hechos} de {items.length} hechas
          </Text>
          <Text style={styles.progresoPct}>{Math.round(progreso * 100)}%</Text>
        </View>
        <View
          style={styles.progresoBar}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Progreso del día"
          accessibilityValue={{ min: 0, max: 100, now: Math.round(progreso * 100) }}
        >
          <View
            style={[styles.progresoFill, { width: `${progreso * 100}%` }]}
          />
        </View>
      </View>

      {/* Lista unificada de lo de hoy */}
      <Text style={styles.seccionTitulo}>Para hoy</Text>
      {errorPlan && (
        <TouchableOpacity
          style={styles.avisoError}
          onPress={reintentar}
          accessibilityRole="button"
          accessibilityLabel="No se pudieron cargar tus hábitos. Reintentar"
        >
          <Ionicons name="alert-circle-outline" size={20} color={colors.danger} />
          <Text style={styles.avisoErrorTexto}>
            No se pudieron cargar tus hábitos. Toca para reintentar.
          </Text>
        </TouchableOpacity>
      )}
      {lista.length === 0 ? (
        <View>
          <EstadoVacio
            icono="sunny-outline"
            titulo="Nada para hoy todavía"
            subtitulo="Agrega un hábito o una tarea para empezar"
          />
          <View style={styles.vacioBotones}>
            <Boton
              titulo="Nuevo hábito"
              onPress={() => router.push("/rutinas")}
            />
            <Boton
              titulo="Nueva tarea"
              onPress={() => router.push("/tareas")}
            />
          </View>
        </View>
      ) : (
        lista.map((i) => {
          if (i.tipo === "habito") {
            return (
              <TarjetaHabito
                key={`habito-${i.id}`}
                habito={i}
                onMarcar={(tipo) => marcarHabito(i.id, tipo)}
              />
            );
          }
          const colorPrioridad = COLOR_PRIORIDAD[i.prioridad];
          return (
            <FilaMarcable
              key={`${i.tipo}-${i.id}`}
              completada={i.completada}
              onPress={() => marcarTarea(i)}
              etiqueta={`Tarea ${i.nombre}, prioridad ${i.prioridad}`}
              style={styles.fila}
              izquierda={
                <View style={[styles.check, i.completada && styles.checkDone]}>
                  {i.completada && (
                    <Ionicons
                      name="checkmark"
                      size={14}
                      color={colors.onPrimary}
                    />
                  )}
                </View>
              }
            >
              <Text
                style={[styles.filaNombre, i.completada && styles.completada]}
              >
                {i.nombre}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={12}
                  color={colors.textSecondary}
                />
                <Text style={styles.meta}>Tarea</Text>
                <Text style={[styles.meta, { color: colorPrioridad }]}>
                  · {i.prioridad}
                </Text>
              </View>
            </FilaMarcable>
          );
        })
      )}

      {/* Gasto de hoy: fila compacta, lleva a Gastos */}
      <TouchableOpacity
        style={styles.gastoRow}
        onPress={() => router.push("/gastos")}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel={`Gastado hoy: ${gastoHoy.toLocaleString("es-CO")} pesos. Abrir gastos`}
      >
        <Ionicons name="wallet-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.gastoLabel}>Gastado hoy</Text>
        <Text style={styles.gastoMonto}>
          ${gastoHoy.toLocaleString("es-CO")}
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 8,
  },
  saludo: { fontSize: 14, color: colors.textSecondary },
  nombre: { fontSize: 26, fontWeight: "700", color: colors.text },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatarText: { fontSize: 18, fontWeight: "600", color: colors.text },

  progresoCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  cuyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  cuyImg: { width: 56, height: 56, borderRadius: 12 },
  cuyInfo: { flex: 1 },
  cuyTitulo: { fontSize: 15, fontWeight: "700", color: colors.text },
  cuyTexto: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
    marginTop: 2,
  },
  progresoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  progresoSub: { fontSize: 13, color: colors.textSecondary },
  progresoPct: { fontSize: 20, fontWeight: "700", color: colors.success },
  progresoBar: {
    height: 6,
    backgroundColor: colors.input,
    borderRadius: 3,
    overflow: "hidden",
  },
  progresoFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 3,
  },

  seccionTitulo: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 12,
  },
  vacioBotones: { marginTop: 24 },
  avisoError: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.danger + "22",
    borderRadius: 12,
    padding: 12,
    minHeight: 48,
    marginBottom: 10,
  },
  avisoErrorTexto: { color: colors.text, fontSize: 13, flex: 1 },

  fila: { padding: 14, gap: 12 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  filaNombre: { color: colors.text, fontSize: 15, fontWeight: "500" },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 3,
  },
  meta: { fontSize: 12, color: colors.textSecondary },

  gastoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
    minHeight: 52,
  },
  gastoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  gastoMonto: { fontSize: 16, fontWeight: "700", color: colors.text },
});
