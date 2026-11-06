import { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { colors } from "../src/constants/colors";
import { useActividades } from "../src/hooks/useActividades";
import { useResumenCalendario } from "../src/hooks/useResumenCalendario";
import { hoy } from "../src/utils/fechas";

// Calendario en español (la librería viene en inglés por defecto)
LocaleConfig.locales.es = {
  monthNames: [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ],
  monthNamesShort: [
    "Ene", "Feb", "Mar", "Abr", "May", "Jun",
    "Jul", "Ago", "Sep", "Oct", "Nov", "Dic",
  ],
  dayNames: [
    "Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado",
  ],
  dayNamesShort: ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"],
  today: "Hoy",
};
LocaleConfig.defaultLocale = "es";

// Un color por tipo de actividad: el mismo en los puntos y en la leyenda
const TIPOS = {
  rutina: { color: colors.info, icono: "🔁", label: "Rutina" },
  tarea: { color: colors.success, icono: "✅", label: "Tarea" },
};

// "2026-11-06" → "viernes, 6 de noviembre"
function fechaLarga(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-CO", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function CalendarioScreen() {
  const [seleccionada, setSeleccionada] = useState(hoy());
  // Mes que se está viendo ("YYYY-MM-DD", siempre día 01)
  const [mesVisible, setMesVisible] = useState(hoy().slice(0, 8) + "01");
  // "Ancla" del calendario: mes al que saltamos con los botones de año o "Hoy".
  // `saltos` cuenta cada salto: al cambiar la `key`, React vuelve a crear el
  // calendario en el mes del ancla (aunque el ancla sea la misma que antes).
  const [ancla, setAncla] = useState(mesVisible);
  const [saltos, setSaltos] = useState(0);

  function saltarA(mes) {
    setMesVisible(mes);
    setAncla(mes);
    setSaltos((n) => n + 1);
  }

  const { resumen } = useResumenCalendario();
  const { actividades } = useActividades(seleccionada);

  // Convertimos el resumen al formato que pide la librería:
  // { "2026-11-06": { dots: [...], selected: true } }
  const marcados = {};
  for (const [fecha, conteo] of Object.entries(resumen)) {
    marcados[fecha] = {
      dots: Object.keys(conteo)
        .filter((tipo) => TIPOS[tipo])
        .map((tipo) => ({ key: tipo, color: TIPOS[tipo].color })),
    };
  }
  marcados[seleccionada] = {
    ...marcados[seleccionada],
    selected: true,
    selectedColor: colors.input,
  };

  function saltarAnio(delta) {
    const anio = Number(mesVisible.slice(0, 4)) + delta;
    saltarA(`${anio}${mesVisible.slice(4)}`);
  }

  function irAHoy() {
    const h = hoy();
    setSeleccionada(h);
    saltarA(h.slice(0, 8) + "01");
  }

  const anioVisible = Number(mesVisible.slice(0, 4));
  const rutinasDia = actividades.filter((a) => a.tipo === "rutina").length;
  const tareasDia = actividades.filter((a) => a.tipo === "tarea").length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Navegación por años */}
      <View style={styles.aniosRow}>
        <TouchableOpacity onPress={() => saltarAnio(-1)}>
          <Text style={styles.anioBtn}>‹ {anioVisible - 1}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.hoyBtn} onPress={irAHoy}>
          <Text style={styles.hoyTexto}>Hoy</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => saltarAnio(1)}>
          <Text style={styles.anioBtn}>{anioVisible + 1} ›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.calendarCard}>
        <Calendar
          key={saltos}
          current={ancla}
          firstDay={1} // la semana empieza el lunes
          enableSwipeMonths
          markingType="multi-dot"
          markedDates={marcados}
          onDayPress={(day) => setSeleccionada(day.dateString)}
          onMonthChange={(m) => setMesVisible(m.dateString.slice(0, 8) + "01")}
          theme={{
            calendarBackground: colors.card,
            monthTextColor: colors.text,
            textMonthFontWeight: "700",
            arrowColor: colors.text,
            textSectionTitleColor: colors.textSecondary,
            dayTextColor: colors.text,
            textDisabledColor: colors.textMuted,
            todayTextColor: colors.success,
            selectedDayTextColor: colors.text,
          }}
        />
        {/* Leyenda */}
        <View style={styles.leyenda}>
          {Object.entries(TIPOS).map(([tipo, t]) => (
            <View key={tipo} style={styles.leyendaItem}>
              <View style={[styles.punto, { backgroundColor: t.color }]} />
              <Text style={styles.leyendaTexto}>{t.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Historial del día seleccionado */}
      <Text style={styles.diaTitulo}>{fechaLarga(seleccionada)}</Text>
      <Text style={styles.diaSub}>
        {rutinasDia} rutina{rutinasDia === 1 ? "" : "s"} · {tareasDia} tarea
        {tareasDia === 1 ? "" : "s"}
      </Text>

      {actividades.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyEmoji}>🗓️</Text>
          <Text style={styles.emptyText}>
            {seleccionada === hoy()
              ? "Aún no completas nada hoy. Marca una rutina o tarea y aparecerá aquí."
              : "No hay actividades registradas este día."}
          </Text>
        </View>
      ) : (
        actividades.map((a) => (
          <View key={a.id} style={styles.item}>
            <Text style={styles.icono}>{TIPOS[a.tipo]?.icono ?? "•"}</Text>
            <View style={styles.info}>
              <Text style={styles.nombre}>{a.nombre}</Text>
              <Text style={styles.detalle}>
                {TIPOS[a.tipo]?.label ?? a.tipo}
                {a.categoria ? ` · ${a.categoria}` : ""} ·{" "}
                {new Date(a.completadaEn).toLocaleTimeString("es-CO", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, paddingBottom: 40 },

  aniosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  anioBtn: { color: colors.textSecondary, fontSize: 14, padding: 6 },
  hoyBtn: {
    backgroundColor: colors.card,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  hoyTexto: { color: colors.text, fontWeight: "600" },

  calendarCard: {
    backgroundColor: colors.card,
    borderRadius: 16,
    overflow: "hidden",
    paddingBottom: 12,
    marginBottom: 24,
  },
  leyenda: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 20,
    marginTop: 4,
  },
  leyendaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 8, height: 8, borderRadius: 4 },
  leyendaTexto: { color: colors.textSecondary, fontSize: 12 },

  diaTitulo: {
    fontSize: 18,
    fontWeight: "700",
    color: colors.text,
    textTransform: "capitalize",
  },
  diaSub: { fontSize: 13, color: colors.textSecondary, marginBottom: 12 },

  emptyBox: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  emptyEmoji: { fontSize: 28, marginBottom: 8 },
  emptyText: { color: colors.textMuted, fontSize: 14, textAlign: "center" },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  icono: { fontSize: 20 },
  info: { flex: 1 },
  nombre: { color: colors.text, fontSize: 14, fontWeight: "500" },
  detalle: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
});
