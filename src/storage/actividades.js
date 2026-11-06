import AsyncStorage from "@react-native-async-storage/async-storage";
import { fechaLocal, hoy } from "../utils/fechas";

// Historial de actividades: el "diario" de todo lo que completas.
//
// Rutinas y tareas se reinician cada día, pero este historial NO se borra.
// Es la fuente que después leerán el Calendario y las estadísticas.
//
// Cada actividad se ve así:
// {
//   id: "1762440000000-k3j9x2",   // único, aunque se creen dos en el mismo ms
//   tipo: "rutina" | "tarea",      // más adelante: "entreno", "alarma"...
//   refId: "1762...",              // id de la rutina/tarea original
//   nombre: "Correr 5km",          // copia del nombre: la tarea puede borrarse después
//   categoria: "Ejercicio" | null,
//   fecha: "2026-11-06",           // día local, para agrupar en el calendario
//   completadaEn: "2026-11-06T...",// momento exacto (ISO)
//   updatedAt: "2026-11-06T...",   // última modificación (lo usará la sincronización)
//   deleted: false,                // borrado lógico (también para la sincronización)
// }

const KEY = "actividades";

// Id único sin librerías: tiempo actual + 6 caracteres aleatorios
function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Lee TODO, incluyendo las marcadas como borradas (uso interno)
async function leerTodas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

async function guardarTodas(actividades) {
  await AsyncStorage.setItem(KEY, JSON.stringify(actividades));
}

// Actividades visibles (sin las borradas)
export async function getActividades() {
  const todas = await leerTodas();
  return todas.filter((a) => !a.deleted);
}

// Actividades de un día concreto. fecha = "YYYY-MM-DD"
export async function getActividadesPorFecha(fecha) {
  const actividades = await getActividades();
  return actividades.filter((a) => a.fecha === fecha);
}

// Resumen para pintar el calendario: cuántas cosas de cada tipo hubo por día.
// Devuelve un objeto (como un HashMap<String, ...> en Java):
// { "2026-11-06": { rutina: 2, tarea: 1 }, "2026-11-05": { rutina: 1 } }
export async function getResumenPorFecha() {
  const actividades = await getActividades();
  const resumen = {};
  for (const a of actividades) {
    if (!resumen[a.fecha]) resumen[a.fecha] = {};
    resumen[a.fecha][a.tipo] = (resumen[a.fecha][a.tipo] || 0) + 1;
  }
  return resumen;
}

// Registra que se completó algo. `item` es la rutina o tarea completada.
export async function registrarActividad(tipo, item) {
  const todas = await leerTodas();
  const ahora = new Date();
  const fecha = fechaLocal(ahora);

  // Evita duplicados: si ya hay registro activo de este item hoy, no repetir
  const yaExiste = todas.some(
    (a) =>
      !a.deleted && a.tipo === tipo && a.refId === item.id && a.fecha === fecha,
  );
  if (yaExiste) return;

  todas.push({
    id: nuevoId(),
    tipo,
    refId: item.id,
    nombre: item.nombre,
    categoria: item.categoria ?? null,
    fecha,
    completadaEn: ahora.toISOString(),
    updatedAt: ahora.toISOString(),
    deleted: false,
  });
  await guardarTodas(todas);
}

// Deshace el registro de HOY (cuando desmarcas algo por error).
// Los días anteriores no se tocan: el historial es historial.
export async function quitarActividadDeHoy(tipo, refId) {
  const todas = await leerTodas();
  const fecha = hoy();
  const ahora = new Date().toISOString();

  const actualizadas = todas.map((a) =>
    !a.deleted && a.tipo === tipo && a.refId === refId && a.fecha === fecha
      ? { ...a, deleted: true, updatedAt: ahora }
      : a,
  );
  await guardarTodas(actualizadas);
}
