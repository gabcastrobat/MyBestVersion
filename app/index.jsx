import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors.js";
import { useGastos } from "../src/hooks/useGastos";
import { usePerfil } from "../src/hooks/usePerfil";
import { useRutinas } from "../src/hooks/useRutinas";
import { useTareas } from "../src/hooks/useTareas";

// Accesos rápidos: un toque para llegar a cualquier sección,
// incluidas Gastos y Perfil, que ya no están en la barra de pestañas.
const ACCESOS = [
  { ruta: "/calendario", icono: "calendar-outline", label: "Calendario" },
  { ruta: "/gimnasio", icono: "barbell-outline", label: "Gym" },
  { ruta: "/alarmas", icono: "alarm-outline", label: "Alarmas" },
  { ruta: "/gastos", icono: "wallet-outline", label: "Gastos" },
];

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
      texto: "Agrega una rutina o una tarea. El cuy te está esperando.",
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

export default function HomeScreen() {
  const router = useRouter();
  // Los hooks recargan al ganar foco y aplican el reset diario
  const { rutinas } = useRutinas();
  const { tareas } = useTareas();
  const { perfil } = usePerfil();
  const { gastos } = useGastos();

  const rutinasCompletadas = rutinas.filter((r) => r.completada).length;
  const tareasCompletadas = tareas.filter((t) => t.completada).length;
  const tareasPendientes = tareas.filter((t) => !t.completada);

  // Progreso del día = rutinas + tareas
  const totalItems = rutinas.length + tareas.length;
  const hechos = rutinasCompletadas + tareasCompletadas;
  const progreso = totalItems > 0 ? hechos / totalItems : 0;
  const cuy = mensajeCuy(progreso, totalItems);

  const hoyStr = new Date().toDateString();
  const gastoHoy = gastos
    .filter((g) => new Date(g.fecha).toDateString() === hoyStr)
    .reduce((s, g) => s + (Number(g.monto) || 0), 0);

  const hora = new Date().getHours();
  const saludo =
    hora < 12 ? "Buenos días" : hora < 18 ? "Buenas tardes" : "Buenas noches";
  const nombre = perfil.nombre ? perfil.nombre.split(" ")[0] : "Gabi";

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
          <Text style={styles.nombre}>{nombre} 👋</Text>
        </View>
        <TouchableOpacity
          style={styles.avatar}
          onPress={() => router.push("/perfil")}
        >
          <Text style={styles.avatarText}>{inicial}</Text>
        </TouchableOpacity>
      </View>

      {/* Progreso del día */}
      <View style={styles.progresoCard}>
        <View style={styles.progresoHeader}>
          <Text style={styles.progresoTitulo}>Progreso del día</Text>
          <Text style={styles.progresoPct}>{Math.round(progreso * 100)}%</Text>
        </View>
        <View style={styles.progresoBar}>
          <View
            style={[styles.progresoFill, { width: `${progreso * 100}%` }]}
          />
        </View>
        <Text style={styles.progresoSub}>
          {hechos} de {totalItems} rutinas y tareas completadas
        </Text>
      </View>

      {/* Cuy motivador */}
      <View style={styles.cuyCard}>
        <Image source={cuy.img} style={styles.cuyImg} contentFit="cover" />
        <View style={styles.cuyInfo}>
          <Text style={styles.cuyTitulo}>{cuy.titulo}</Text>
          <Text style={styles.cuyTexto}>{cuy.texto}</Text>
        </View>
      </View>

      {/* Cards resumen */}
      <View style={styles.resumenRow}>
        <TouchableOpacity
          style={[styles.resumenCard, styles.resumenCardRutinas]}
          onPress={() => router.push("/rutinas")}
        >
          <Text style={styles.resumenEmoji}>🔁</Text>
          <Text style={styles.resumenNum}>
            {rutinasCompletadas}/{rutinas.length}
          </Text>
          <Text style={styles.resumenLabel}>Rutinas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resumenCard, styles.resumenCardTareas]}
          onPress={() => router.push("/tareas")}
        >
          <Text style={styles.resumenEmoji}>✅</Text>
          <Text style={styles.resumenNum}>
            {tareasCompletadas}/{tareas.length}
          </Text>
          <Text style={styles.resumenLabel}>Tareas</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.resumenCard, styles.resumenCardGastos]}
          onPress={() => router.push("/gastos")}
        >
          <Text style={styles.resumenEmoji}>💸</Text>
          <Text style={styles.resumenNum} numberOfLines={1} adjustsFontSizeToFit>
            ${gastoHoy.toLocaleString("es-CO")}
          </Text>
          <Text style={styles.resumenLabel}>Gastado hoy</Text>
        </TouchableOpacity>
      </View>

      {/* Accesos rápidos */}
      <View style={styles.accesosRow}>
        {ACCESOS.map((a) => (
          <TouchableOpacity
            key={a.ruta}
            style={styles.acceso}
            onPress={() => router.push(a.ruta)}
          >
            <Ionicons name={a.icono} size={22} color={colors.text} />
            <Text style={styles.accesoLabel}>{a.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Pendientes */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Pendiente hoy</Text>
          <TouchableOpacity onPress={() => router.push("/tareas")}>
            <Text style={styles.verTodo}>Ver todo →</Text>
          </TouchableOpacity>
        </View>
        {tareasPendientes.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>🎉</Text>
            <Text style={styles.emptyText}>Todo al día</Text>
          </View>
        ) : (
          tareasPendientes.slice(0, 4).map((t) => (
            <View key={t.id} style={styles.tareaItem}>
              <View
                style={[
                  styles.dot,
                  {
                    backgroundColor:
                      t.prioridad === "Alta"
                        ? colors.danger
                        : t.prioridad === "Media"
                          ? colors.warning
                          : colors.success,
                  },
                ]}
              />
              <Text style={styles.tareaNombre}>{t.nombre}</Text>
              <Text
                style={[
                  styles.prioridadTag,
                  {
                    color:
                      t.prioridad === "Alta"
                        ? colors.danger
                        : t.prioridad === "Media"
                          ? colors.warning
                          : colors.success,
                  },
                ]}
              >
                {t.prioridad}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Rutinas */}
      <View style={styles.seccion}>
        <View style={styles.seccionHeader}>
          <Text style={styles.seccionTitulo}>Rutinas de hoy</Text>
          <TouchableOpacity onPress={() => router.push("/rutinas")}>
            <Text style={styles.verTodo}>Ver todo →</Text>
          </TouchableOpacity>
        </View>
        {rutinas.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyEmoji}>📋</Text>
            <Text style={styles.emptyText}>No tienes rutinas configuradas</Text>
          </View>
        ) : (
          rutinas.slice(0, 4).map((r) => (
            <View key={r.id} style={styles.rutinaItem}>
              <View style={[styles.check, r.completada && styles.checkDone]}>
                {r.completada && <Text style={styles.checkMark}>✓</Text>}
              </View>
              <View style={styles.rutinaInfo}>
                <Text
                  style={[
                    styles.rutinaNombre,
                    r.completada && styles.completada,
                  ]}
                >
                  {r.nombre}
                </Text>
                <Text style={styles.rutinaHora}>
                  {r.hora} · {r.categoria}
                </Text>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
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
    padding: 18,
    marginBottom: 16,
  },
  progresoHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  progresoTitulo: { fontSize: 14, fontWeight: "600", color: colors.text },
  progresoPct: { fontSize: 20, fontWeight: "700", color: colors.success },
  progresoBar: {
    height: 6,
    backgroundColor: colors.input,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 8,
  },
  progresoFill: {
    height: "100%",
    backgroundColor: colors.success,
    borderRadius: 3,
  },
  progresoSub: { fontSize: 12, color: colors.textSecondary },

  resumenRow: { flexDirection: "row", gap: 12, marginBottom: 24 },
  resumenCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: "flex-start",
  },
  resumenCardRutinas: { backgroundColor: "#1a1a2e" },
  resumenCardTareas: { backgroundColor: "#1a2e1a" },
  resumenCardGastos: { backgroundColor: "#2e1a1a" },

  cuyCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  cuyImg: { width: 72, height: 72, borderRadius: 12 },
  cuyInfo: { flex: 1 },
  cuyTitulo: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 4,
  },
  cuyTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  resumenEmoji: { fontSize: 22, marginBottom: 8 },
  resumenNum: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  resumenLabel: { fontSize: 12, color: colors.textSecondary },

  accesosRow: { flexDirection: "row", gap: 10, marginBottom: 24 },
  acceso: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    gap: 6,
  },
  accesoLabel: { fontSize: 11, color: colors.textSecondary },

  seccion: { marginBottom: 24 },
  seccionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seccionTitulo: { fontSize: 16, fontWeight: "600", color: colors.text },
  verTodo: { fontSize: 13, color: colors.textSecondary },

  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14 },

  tareaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  tareaNombre: { color: colors.text, fontSize: 14, flex: 1 },
  prioridadTag: { fontSize: 11, fontWeight: "500" },

  rutinaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    alignItems: "center",
    justifyContent: "center",
  },
  checkDone: { backgroundColor: colors.success, borderColor: colors.success },
  checkMark: { color: "#000", fontSize: 12, fontWeight: "700" },
  rutinaInfo: { flex: 1 },
  rutinaNombre: { color: colors.text, fontSize: 14, fontWeight: "500" },
  rutinaHora: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  completada: { textDecorationLine: "line-through", color: colors.textMuted },
});
