import AsyncStorage from "@react-native-async-storage/async-storage";

// Alarmas estilo Alarmy: solo se apagan haciendo un ejercicio.
//
// { id, etiqueta, hora: 0-23, minuto: 0-59,
//   dias: [0-6]   (0 = domingo, como Date.getDay(); vacío = suena una sola vez),
//   desafio: "sentadillas" | "flexiones" | "plancha",
//   cantidad: repeticiones (o segundos en la plancha),
//   activa, updatedAt, deleted }

const KEY = "alarmas";

// Los 3 desafíos físicos. `unidad` dice si `cantidad` son reps o segundos.
export const DESAFIOS = {
  sentadillas: { label: "Sentadillas", icono: "🦵", unidad: "reps", porDefecto: 15, min: 5, max: 100 },
  flexiones: { label: "Flexiones", icono: "💪", unidad: "reps", porDefecto: 10, min: 3, max: 100 },
  plancha: { label: "Plancha", icono: "🧱", unidad: "seg", porDefecto: 30, min: 10, max: 300 },
};

// Orden de la semana en pantalla: lunes primero
export const DIAS_SEMANA = [
  { dia: 1, corto: "L" },
  { dia: 2, corto: "M" },
  { dia: 3, corto: "X" },
  { dia: 4, corto: "J" },
  { dia: 5, corto: "V" },
  { dia: 6, corto: "S" },
  { dia: 0, corto: "D" },
];

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

async function leerTodas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

async function guardarTodas(lista) {
  await AsyncStorage.setItem(KEY, JSON.stringify(lista));
}

// Revisa los datos antes de guardar. Lanza un Error con un mensaje
// que se puede mostrar tal cual al usuario.
function validar({ hora, minuto, dias, desafio, cantidad }) {
  if (!Number.isInteger(hora) || hora < 0 || hora > 23) throw new Error("Hora inválida.");
  if (!Number.isInteger(minuto) || minuto < 0 || minuto > 59) throw new Error("Minuto inválido.");
  if (!Array.isArray(dias) || dias.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) {
    throw new Error("Días inválidos.");
  }
  const config = DESAFIOS[desafio];
  if (!config) throw new Error("Elige un desafío.");
  const n = Number(cantidad);
  if (!Number.isInteger(n) || n < config.min || n > config.max) {
    const unidad = config.unidad === "seg" ? "segundos" : "repeticiones";
    throw new Error(`${config.label}: entre ${config.min} y ${config.max} ${unidad}.`);
  }
  return n;
}

// Alarmas activas e inactivas, ordenadas por hora del día
export async function getAlarmas() {
  const todas = await leerTodas();
  return todas
    .filter((a) => !a.deleted)
    .sort((a, b) => a.hora * 60 + a.minuto - (b.hora * 60 + b.minuto));
}

export async function getAlarma(id) {
  const todas = await leerTodas();
  return todas.find((a) => a.id === id && !a.deleted) ?? null;
}

export async function saveAlarma(datos) {
  const cantidad = validar(datos);
  const nueva = {
    id: nuevoId(),
    etiqueta: (datos.etiqueta ?? "").trim(),
    hora: datos.hora,
    minuto: datos.minuto,
    dias: [...new Set(datos.dias)].sort((a, b) => a - b),
    desafio: datos.desafio,
    cantidad,
    activa: true,
    updatedAt: new Date().toISOString(),
    deleted: false,
  };
  const todas = await leerTodas();
  await guardarTodas([...todas, nueva]);
  return nueva;
}

export async function updateAlarma(id, cambios) {
  const todas = await leerTodas();
  const actual = todas.find((a) => a.id === id && !a.deleted);
  if (!actual) throw new Error("La alarma ya no existe.");
  const combinada = { ...actual, ...cambios };
  const cantidad = validar(combinada);
  const editada = {
    ...combinada,
    id: actual.id, // el id nunca cambia
    etiqueta: (combinada.etiqueta ?? "").trim(),
    dias: [...new Set(combinada.dias)].sort((a, b) => a - b),
    cantidad,
    updatedAt: new Date().toISOString(),
  };
  await guardarTodas(todas.map((a) => (a.id === id ? editada : a)));
  return editada;
}

// Borrado "suave": se marca deleted para que la sincronización con el PC
// sepa que se borró (si la quitáramos del todo, el PC la volvería a subir).
export async function deleteAlarma(id) {
  const todas = await leerTodas();
  await guardarTodas(
    todas.map((a) =>
      a.id === id ? { ...a, deleted: true, updatedAt: new Date().toISOString() } : a,
    ),
  );
}

// ───────────────────────── Cálculo de horarios ─────────────────────────
// Funciones "puras": no leen ni guardan nada, solo calculan. Así se pueden
// probar fácilmente pasándoles cualquier `ahora`.

// Próxima vez que suena la alarma en un día concreto de la semana (0-6).
export function proximaEnDia(alarma, dia, ahora = new Date()) {
  const diff = (dia - ahora.getDay() + 7) % 7;
  const fecha = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate() + diff,
    alarma.hora,
    alarma.minuto,
    0,
    0,
  );
  // Si es hoy pero la hora ya pasó, toca la semana siguiente
  if (fecha <= ahora) fecha.setDate(fecha.getDate() + 7);
  return fecha;
}

// Próxima vez que suena una alarma de "una sola vez" (sin días)
export function proximaUnaVez(alarma, ahora = new Date()) {
  const fecha = new Date(
    ahora.getFullYear(),
    ahora.getMonth(),
    ahora.getDate(),
    alarma.hora,
    alarma.minuto,
    0,
    0,
  );
  if (fecha <= ahora) fecha.setDate(fecha.getDate() + 1);
  return fecha;
}

// La más cercana de todas las veces que va a sonar (o null si está apagada)
export function proximoDisparo(alarma, ahora = new Date()) {
  if (!alarma.activa) return null;
  if (alarma.dias.length === 0) return proximaUnaVez(alarma, ahora);
  return alarma.dias
    .map((d) => proximaEnDia(alarma, d, ahora))
    .reduce((min, f) => (f < min ? f : min));
}

// "Suena en 7 h 30 min"
export function textoFaltante(fecha, ahora = new Date()) {
  const min = Math.max(1, Math.ceil((fecha - ahora) / 60000));
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  const m = min % 60;
  const partes = [];
  if (d) partes.push(`${d} d`);
  if (h) partes.push(`${h} h`);
  if (m && !d) partes.push(`${m} min`);
  return `Suena en ${partes.join(" ")}`;
}

// "Lun a vie", "Todos los días", "Una vez", "L X V"
export function textoDias(dias) {
  if (dias.length === 0) return "Una vez";
  if (dias.length === 7) return "Todos los días";
  const set = new Set(dias);
  if (dias.length === 5 && [1, 2, 3, 4, 5].every((d) => set.has(d))) return "Lun a vie";
  if (dias.length === 2 && set.has(0) && set.has(6)) return "Fines de semana";
  return DIAS_SEMANA.filter((d) => set.has(d.dia)).map((d) => d.corto).join(" ");
}

// 7:05 → "07:05"
export function textoHora(hora, minuto) {
  return `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`;
}
