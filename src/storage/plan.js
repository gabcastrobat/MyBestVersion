import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_ANCLAS, PLAN_INICIAL } from "../constants/planMejora";
import { diaAnterior, diasDeLaSemana, hoy, inicioSemana } from "../utils/fechas";
import { quitarActividadDeHoy, registrarActividad } from "./actividades";

// Plan de mejora: todo se guarda en UNA sola clave porque las partes dependen
// entre sí (promover algo de la cola crea un hábito y lo saca de la cola).
// Guardarlo junto evita que una mitad se guarde y la otra no.
//
// Forma del objeto:
// {
//   victorias: [{ id, nombre, hecha }],                       // se hacen 1 vez
//   habitos: [{
//     id, nombre, minimo, area, metaSemanal,                  // metaSemanal: 1-7
//     estado: "activo" | "automatico",
//     dias: { "2026-11-14": "completo" | "minimo" },          // historial
//   }],
//   cola: [{ id, nombre, area }],                             // en espera
//   revisiones: [{ semana: "2026-11-09", nota, resumen, guardadaEn }],
// }

const KEY = "plan_mejora";

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Primera vez: arma el plan a partir de PLAN_INICIAL, poniéndole ids
function planInicial() {
  return {
    victorias: PLAN_INICIAL.victorias.map((v) => ({ ...v, id: nuevoId() })),
    habitos: PLAN_INICIAL.habitos.map((h) => ({
      ...h,
      id: nuevoId(),
      estado: "activo",
      dias: {},
    })),
    cola: PLAN_INICIAL.cola.map((c) => ({ ...c, id: nuevoId() })),
    revisiones: [],
  };
}

export async function getPlan() {
  const data = await AsyncStorage.getItem(KEY);
  if (data) return JSON.parse(data);
  const plan = planInicial();
  await guardar(plan);
  return plan;
}

async function guardar(plan) {
  await AsyncStorage.setItem(KEY, JSON.stringify(plan));
}

// ─── Cálculos (funciones puras: no tocan AsyncStorage) ──────────────────────

// Cuántos días de esta semana (lunes-domingo) marcaste el hábito
export function diasEstaSemana(habito) {
  return diasDeLaSemana().filter((f) => habito.dias[f]).length;
}

// Días seguidos marcados. Si hoy todavía no lo marcas, cuenta desde ayer:
// la racha no se rompe hasta que se acaba el día.
export function racha(habito) {
  let fecha = hoy();
  if (!habito.dias[fecha]) fecha = diaAnterior(fecha);
  let total = 0;
  while (habito.dias[fecha]) {
    total++;
    fecha = diaAnterior(fecha);
  }
  return total;
}

export function anclasActivas(plan) {
  return plan.habitos.filter((h) => h.estado === "activo");
}

// ─── Hábitos ────────────────────────────────────────────────────────────────

// Marca el hábito HOY. tipo = "completo" | "minimo".
// Si ya estaba marcado con ese mismo tipo, lo desmarca (como un toggle).
export async function marcarHabitoHoy(id, tipo) {
  const plan = await getPlan();
  const fecha = hoy();
  const habito = plan.habitos.find((h) => h.id === id);
  if (!habito) return plan;

  const desmarcar = habito.dias[fecha] === tipo;
  const dias = { ...habito.dias };
  if (desmarcar) delete dias[fecha];
  else dias[fecha] = tipo;

  const actualizado = { ...habito, dias };
  plan.habitos = plan.habitos.map((h) => (h.id === id ? actualizado : h));
  await guardar(plan);

  // Igual que las rutinas: queda en el historial y sale en el Calendario
  const item = { id, nombre: habito.nombre, categoria: habito.area };
  if (desmarcar) await quitarActividadDeHoy("habito", id);
  else await registrarActividad("habito", item);

  return plan;
}

// "Ya me sale solo": deja de ocupar uno de los 3 cupos de ancla
export async function marcarAutomatico(id) {
  const plan = await getPlan();
  plan.habitos = plan.habitos.map((h) =>
    h.id === id ? { ...h, estado: "automatico" } : h,
  );
  await guardar(plan);
  return plan;
}

// Saca un hábito activo y lo devuelve al final de la cola
export async function devolverACola(id) {
  const plan = await getPlan();
  const habito = plan.habitos.find((h) => h.id === id);
  if (!habito) return plan;
  plan.habitos = plan.habitos.filter((h) => h.id !== id);
  plan.cola.push({ id: nuevoId(), nombre: habito.nombre, area: habito.area });
  await guardar(plan);
  return plan;
}

// Convierte una meta de la cola en hábito ancla.
// Lanza un error si ya hay MAX_ANCLAS activos: esa es la regla de oro.
export async function promoverAAncla(colaId, { minimo, metaSemanal }) {
  const plan = await getPlan();
  if (anclasActivas(plan).length >= MAX_ANCLAS) {
    throw new Error(
      `Ya tienes ${MAX_ANCLAS} hábitos ancla. Vuelve uno automático primero.`,
    );
  }
  const meta = plan.cola.find((c) => c.id === colaId);
  if (!meta) return plan;

  plan.cola = plan.cola.filter((c) => c.id !== colaId);
  plan.habitos.push({
    id: nuevoId(),
    nombre: meta.nombre,
    minimo: minimo.trim() || "La versión más pequeña posible",
    area: meta.area,
    metaSemanal,
    estado: "activo",
    dias: {},
  });
  await guardar(plan);
  return plan;
}

// ─── Cola y victorias rápidas ───────────────────────────────────────────────

export async function agregarACola(nombre, area) {
  const plan = await getPlan();
  plan.cola.push({ id: nuevoId(), nombre: nombre.trim(), area });
  await guardar(plan);
  return plan;
}

export async function quitarDeCola(id) {
  const plan = await getPlan();
  plan.cola = plan.cola.filter((c) => c.id !== id);
  await guardar(plan);
  return plan;
}

export async function agregarVictoria(nombre) {
  const plan = await getPlan();
  plan.victorias.push({ id: nuevoId(), nombre: nombre.trim(), hecha: false });
  await guardar(plan);
  return plan;
}

export async function toggleVictoria(id) {
  const plan = await getPlan();
  plan.victorias = plan.victorias.map((v) =>
    v.id === id ? { ...v, hecha: !v.hecha } : v,
  );
  await guardar(plan);
  return plan;
}

export async function eliminarVictoria(id) {
  const plan = await getPlan();
  plan.victorias = plan.victorias.filter((v) => v.id !== id);
  await guardar(plan);
  return plan;
}

// ─── Revisión del domingo ───────────────────────────────────────────────────

// Guarda (o reemplaza) la revisión de la semana actual, con una "foto"
// de cómo te fue en cada hábito activo.
export async function guardarRevision(nota) {
  const plan = await getPlan();
  const semana = inicioSemana();
  const resumen = anclasActivas(plan).map((h) => ({
    nombre: h.nombre,
    dias: diasEstaSemana(h),
    meta: h.metaSemanal,
  }));
  const revision = {
    semana,
    nota: nota.trim(),
    resumen,
    guardadaEn: new Date().toISOString(),
  };
  plan.revisiones = [
    revision,
    ...plan.revisiones.filter((r) => r.semana !== semana),
  ];
  await guardar(plan);
  return plan;
}
