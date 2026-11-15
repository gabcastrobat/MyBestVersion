import AsyncStorage from "@react-native-async-storage/async-storage";
import { fechaLocal, hoy, sumarDias } from "../utils/fechas";
import { registrarActividad } from "./actividades";

// Datos del gimnasio. Tres "tablas":
//
// 1. PLANTILLAS: tus rutinas de gym (ej: "Pierna").
//    { id, nombre, ejercicios: [{ id, nombre }], updatedAt, deleted }
//
// 2. SESIONES: cada entrenamiento terminado.
//    { id, plantillaId, nombre, fecha: "YYYY-MM-DD", inicio, fin, duracionSeg,
//      ejercicios: [{ nombre, series: [{ reps, peso }] }], updatedAt, deleted }
//
// 3. EN CURSO: el entrenamiento que estás haciendo ahora mismo. Se guarda
//    con cada cambio, así no pierdes nada si se cierra la app a mitad.

const KEY_PLANTILLAS = "gym_plantillas";
const KEY_SESIONES = "gym_sesiones";
const KEY_EN_CURSO = "gym_en_curso";

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function leer(key) {
  const data = await AsyncStorage.getItem(key);
  return data ? JSON.parse(data) : [];
}

async function escribir(key, valor) {
  await AsyncStorage.setItem(key, JSON.stringify(valor));
}

// Convierte "12,5" o "12.5" a 12.5. Devuelve NaN si no es un número.
export function parseNumero(texto) {
  if (typeof texto === "number") return texto;
  return Number(String(texto ?? "").trim().replace(",", "."));
}

// ───────────────────────── Plantillas ─────────────────────────

export async function getPlantillas() {
  return (await leer(KEY_PLANTILLAS)).filter((p) => !p.deleted);
}

// ejercicios = ["Sentadilla", "Prensa", ...]
export async function savePlantilla({ nombre, ejercicios }) {
  const limpio = nombre?.trim();
  const lista = (ejercicios || []).map((e) => e.trim()).filter(Boolean);
  if (!limpio) throw new Error("Ponle un nombre a la rutina");
  if (lista.length === 0) throw new Error("Agrega al menos un ejercicio");

  const todas = await leer(KEY_PLANTILLAS);
  const nueva = {
    id: nuevoId(),
    nombre: limpio,
    ejercicios: lista.map((n) => ({ id: nuevoId(), nombre: n })),
    updatedAt: new Date().toISOString(),
    deleted: false,
  };
  todas.push(nueva);
  await escribir(KEY_PLANTILLAS, todas);
  return nueva;
}

// Borrado lógico: el historial de sesiones de esa rutina se conserva
export async function deletePlantilla(id) {
  const todas = await leer(KEY_PLANTILLAS);
  const ahora = new Date().toISOString();
  await escribir(
    KEY_PLANTILLAS,
    todas.map((p) => (p.id === id ? { ...p, deleted: true, updatedAt: ahora } : p)),
  );
}

// ───────────────────────── Entreno en curso ─────────────────────────

export async function getEntrenoEnCurso() {
  const data = await AsyncStorage.getItem(KEY_EN_CURSO);
  return data ? JSON.parse(data) : null;
}

// Empieza un entreno a partir de una plantilla: 1 serie vacía por ejercicio
export async function iniciarEntreno(plantilla) {
  const entreno = {
    plantillaId: plantilla.id,
    nombre: plantilla.nombre,
    inicio: new Date().toISOString(),
    ejercicios: plantilla.ejercicios.map((e) => ({
      id: nuevoId(),
      nombre: e.nombre,
      series: [{ id: nuevoId(), reps: "", peso: "" }],
    })),
  };
  await guardarEntrenoEnCurso(entreno);
  return entreno;
}

export async function guardarEntrenoEnCurso(entreno) {
  await AsyncStorage.setItem(KEY_EN_CURSO, JSON.stringify(entreno));
}

export async function descartarEntreno() {
  await AsyncStorage.removeItem(KEY_EN_CURSO);
}

// Valida y limpia el entreno, lo guarda como sesión y lo anota en el
// historial de actividades (→ aparece en el Calendario).
export async function terminarEntreno(entreno) {
  const ejercicios = [];
  for (const ej of entreno.ejercicios) {
    const series = [];
    for (const s of ej.series) {
      // Una serie sin repeticiones se ignora (la dejaste en blanco)
      if (String(s.reps).trim() === "") continue;
      const reps = parseNumero(s.reps);
      const peso = String(s.peso).trim() === "" ? 0 : parseNumero(s.peso);
      if (!Number.isInteger(reps) || reps <= 0) {
        throw new Error(`Repeticiones inválidas en "${ej.nombre}"`);
      }
      if (Number.isNaN(peso) || peso < 0) {
        throw new Error(`Peso inválido en "${ej.nombre}"`);
      }
      series.push({ reps, peso });
    }
    if (series.length > 0) ejercicios.push({ nombre: ej.nombre, series });
  }
  if (ejercicios.length === 0) {
    throw new Error("Registra al menos una serie con repeticiones");
  }

  const fin = new Date();
  const inicio = new Date(entreno.inicio);
  const sesion = {
    id: nuevoId(),
    plantillaId: entreno.plantillaId ?? null,
    nombre: entreno.nombre,
    fecha: fechaLocal(inicio), // el día en que EMPEZASTE
    inicio: entreno.inicio,
    fin: fin.toISOString(),
    duracionSeg: Math.round((fin - inicio) / 1000),
    ejercicios,
    updatedAt: fin.toISOString(),
    deleted: false,
  };

  const sesiones = await leer(KEY_SESIONES);
  sesiones.push(sesion);
  await escribir(KEY_SESIONES, sesiones);
  await registrarActividad("entreno", {
    id: sesion.id,
    nombre: sesion.nombre,
    categoria: "Gimnasio",
  });
  await descartarEntreno();
  return sesion;
}

// ───────────────────────── Historial y estadísticas ─────────────────────────

export async function getSesiones() {
  return (await leer(KEY_SESIONES))
    .filter((s) => !s.deleted)
    .sort((a, b) => b.inicio.localeCompare(a.inicio));
}

// Volumen = suma de (repeticiones × peso) de todas las series.
// Es la medida clásica de "cuánto trabajo" hiciste en un entreno.
export function volumenSesion(sesion) {
  let total = 0;
  for (const ej of sesion.ejercicios) {
    for (const s of ej.series) total += s.reps * s.peso;
  }
  return total;
}

export function calcularEstadisticas(sesiones) {
  const hace7 = sumarDias(hoy(), -6); // últimos 7 días, hoy incluido
  const semana = sesiones.filter((s) => s.fecha >= hace7);

  // Récord personal (mayor peso) por ejercicio
  const records = {};
  for (const s of sesiones) {
    for (const ej of s.ejercicios) {
      for (const serie of ej.series) {
        const actual = records[ej.nombre];
        if (!actual || serie.peso > actual.peso) {
          records[ej.nombre] = { peso: serie.peso, reps: serie.reps, fecha: s.fecha };
        }
      }
    }
  }

  return {
    total: sesiones.length,
    semana: semana.length,
    volumenSemana: semana.reduce((acc, s) => acc + volumenSesion(s), 0),
    minutosSemana: Math.round(
      semana.reduce((acc, s) => acc + s.duracionSeg, 0) / 60,
    ),
    records: Object.entries(records)
      .map(([nombre, r]) => ({ nombre, ...r }))
      .filter((r) => r.peso > 0)
      .sort((a, b) => b.peso - a.peso),
  };
}
