import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { colors } from "../src/constants/colors.js";
import { getPerfil } from "../src/storage/perfil";
import { getRutinas } from "../src/storage/rutinas";
import { getTareas } from "../src/storage/tareas";

export default function HomeScreen() {
  const router = useRouter();
  const [rutinas, setRutinas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [perfil, setPerfil] = useState({ nombre: "" });

  useFocusEffect(
    useCallback(() => {
      async function cargar() {
        const r = await getRutinas();
        const t = await getTareas();
        const p = await getPerfil();
        setRutinas(r);
        setTareas(t);
        setPerfil(p);
      }
      cargar();
    }, []),
  );

  const rutinasCompletadas = rutinas.filter((r) => r.completada).length;
  const tareasCompletadas = tareas.filter((t) => t.completada).length;
  const tareasPendientes = tareas.filter((t) => !t.completada);
  const progreso = tareas.length > 0 ? tareasCompletadas / tareas.length : 0;

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
          <Text style={styles.progrеsoPct}>{Math.round(progreso * 100)}%</Text>
        </View>
        <View style={styles.progresoBar}>
          <View
            style={[styles.progresoFill, { width: `${progreso * 100}%` }]}
          />
        </View>
        <Text style={styles.progresoSub}>
          {tareasCompletadas} de {tareas.length} tareas completadas
        </Text>
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
  resumenEmoji: { fontSize: 22, marginBottom: 8 },
  resumenNum: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 2,
  },
  resumenLabel: { fontSize: 12, color: colors.textSecondary },

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
