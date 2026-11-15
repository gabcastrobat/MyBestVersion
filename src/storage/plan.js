import AsyncStorage from "@react-native-async-storage/async-storage";
import { AREAS, MAX_ANCLAS, PLAN_INICIAL } from "../constants/planMejora";
import { diaAnterior, diasDeLaSemana, hoy, inicioSemana } from "../utils/fechas";
import {
  getActividades,
  quitarActividadDeHoy,
  registrarActividad,
} from "./actividades";
import { crearCola } from "../utils/cola";

// Todas las escrituras de este archivo pasan por la misma cola: así dos
// cambios casi simultáneos no se pisan (ver utils/cola.js).
const enSerie = crearCola();

// Plan de mejora + hábitos: todo se guarda en UNA sola clave porque las partes
// dependen entre sí (promover algo de la cola crea un hábito y lo saca de la
// cola). Guardarlo junto evita que una mitad se guarde y la otra no.
//
// Un HÁBITO unifica lo que antes eran dos cosas: las "rutinas" (hora y
// recordatorio diario) y los "hábitos ancla" (versión mínima, meta semanal,
// máximo 3). Forma del objeto:
// {
//   version: 2,
//   rutinasMigradas: true,
//   victorias: [{ id, nombre, hecha }],                       // se hacen 1 vez
//   habitos: [{
//     id, nombre,
//     categoria,                      // clave de CATEGORIAS
//     hora: "7:30 PM" | null,         // con hora → recordatorio diario
//     minimo: "5 minutos" | null,     // con mínimo → botón "Versión mínima"
//     metaSemanal,                    // 1-7
//     ancla: true | false,            // solo las ancla cuentan para el tope de 3
//     estado: "activo" | "automatico",
//     dias: { "2026-11-14": "completo" | "minimo" },          // historial
//   }],
//   cola: [{ id, nombre, area }],                             // en espera
//   revisiones: [{ semana: "2026-11-09", nota, resumen, guardadaEn }],
// }
//
// Marcar un hábito escribe SIEMPRE en `dias[fecha]`: no hay estado "completada"
// que reiniciar cada día, la fecha misma hace de reinicio.

const KEY = "plan_mejora";
const VERSION = 2;

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Primera vez: arma el plan a partir de PLAN_INICIAL, poniéndole ids.
// `rutinasMigradas: false` para que también entre por la migración.
function planInicial() {
  return {
    version: VERSION,
    rutinasMigradas: false,
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

// Deja un hábito con todos los campos del modelo unificado.
// Es idempotente: se puede aplicar a un hábito ya migrado.
function normalizarHabito(h) {
  const { area, ...resto } = h;
  return {
    ...resto,
    categoria: h.categoria ?? area ?? "General",
    hora: h.hora ?? null,
    minimo: h.minimo ?? null,
    metaSemanal: h.metaSemanal ?? 7,
    ancla: h.ancla ?? true, // los hábitos del plan viejo eran todos ancla
    estado: h.estado ?? "activo",
    dias: h.dias ?? {},
  };
}

// ─── Migración (plan viejo + rutinas → modelo unificado) ───────────────────
//
// 1. Guarda copias de seguridad de lo que había (claves *_backup_v1).
// 2. Convierte los hábitos del plan viejo (area → categoria, ancla: true).
// 3. Convierte cada rutina en un hábito con el MISMO id (así su recordatorio
//    programado sigue valiendo) y reconstruye su `dias` desde el historial
//    de actividades, para no perder rachas.
// Las claves viejas ("rutinas", etc.) NO se borran: quedan como respaldo.
let migracionEnCurso = null;

async function migrar(plan, datosOriginales) {
  if (datosOriginales) {
    await AsyncStorage.setItem("plan_mejora_backup_v1", datosOriginales);
  }
  const rutinasRaw = await AsyncStorage.getItem("rutinas");
  if (rutinasRaw) await AsyncStorage.setItem("rutinas_backup_v1", rutinasRaw);
  const rutinas = rutinasRaw ? JSON.parse(rutinasRaw) : [];

  // refId de la rutina → { "2026-11-06": "completo", ... }
  const diasPorRutina = {};
  for (const a of await getActividades()) {
    if (a.tipo !== "rutina") continue;
    (diasPorRutina[a.refId] ??= {})[a.fecha] = "completo";
  }

  const habitos = plan.habitos.map(normalizarHabito);
  for (const r of rutinas) {
    if (habitos.some((h) => h.id === r.id)) continue;
    habitos.push({
      id: r.id,
      nombre: r.nombre,
      categoria: r.categoria || "General",
      hora: r.hora || null,
      minimo: null,
      metaSemanal: 7,
      ancla: false,
      estado: "activo",
      dias: diasPorRutina[r.id] ?? {},
    });
  }

  const migrado = { ...plan, version: VERSION, rutinasMigradas: true, habitos };
  await guardar(migrado);
  return migrado;
}

export async function getPlan() {
  const data = await AsyncStorage.getItem(KEY);
  const plan = data ? JSON.parse(data) : planInicial();
  if (plan.rutinasMigradas) return plan;

  // Varias pantallas pueden pedir el plan a la vez en el primer arranque:
  // todas esperan la MISMA migración para no duplicar las rutinas.
  if (!migracionEnCurso) {
    migracionEnCurso = migrar(plan, data).finally(() => {
      migracionEnCurso = null;
    });
  }
  return migracionEnCurso;
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

// Veces que se marcó en toda su historia
export function totalDias(habito) {
  return Object.keys(habito.dias).length;
}

// Hábitos ancla que ocupan uno de los cupos
export function anclasActivas(plan) {
  return plan.habitos.filter((h) => h.ancla && h.estado === "activo");
}

// Hábitos que tocan hoy: todos los activos (ancla o no).
// Los "automáticos" ya no se muestran en el día a día.
export function habitosDeHoy(plan) {
  return plan.habitos.filter((h) => h.estado === "activo");
}

// Hábitos que ya te salen solos
export function habitosAutomaticos(plan) {
  return plan.habitos.filter((h) => h.estado === "automatico");
}

// Historial reciente agrupado por día, más reciente primero:
// [{ fecha: "2026-11-14", items: [{ id, nombre, marca }] }]
export function historialPorDia(plan, dias = 30) {
  const salida = [];
  let fecha = hoy();
  for (let i = 0; i < dias; i++) {
    const items = plan.habitos
      .filter((h) => h.dias[fecha])
      .map((h) => ({ id: h.id, nombre: h.nombre, marca: h.dias[fecha] }));
    if (items.length > 0) salida.push({ fecha, items });
    fecha = diaAnterior(fecha);
  }
  return salida;
}

// ─── Hábitos ────────────────────────────────────────────────────────────────

// Marca el hábito HOY. tipo = "completo" | "minimo".
// Si ya estaba marcado con ese mismo tipo, lo desmarca (como un toggle).
export const marcarHabitoHoy = enSerie(async (id, tipo) => {
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

  // Queda en el historial y sale en el Calendario
  const item = { id, nombre: habito.nombre, categoria: habito.categoria };
  if (desmarcar) await quitarActividadDeHoy("habito", id);
  else await registrarActividad("habito", item);

  return plan;
});

// Crea un hábito normal (no ancla). `datos` = { nombre, categoria?, hora?,
// minimo?, metaSemanal? }. Con `hora` el hook programa el recordatorio.
export const crearHabito = enSerie(async (datos) => {
  const nombre = datos.nombre?.trim();
  if (!nombre) throw new Error("El nombre del hábito no puede estar vacío");
  const plan = await getPlan();
  plan.habitos.push({
    id: nuevoId(),
    nombre,
    categoria: datos.categoria || "General",
    hora: datos.hora || null,
    minimo: datos.minimo?.trim() || null,
    metaSemanal: datos.metaSemanal || 7,
    ancla: false,
    estado: "activo",
    dias: {},
  });
  await guardar(plan);
  return plan;
});

// Edita nombre, categoría, hora, mínimo y meta semanal. No toca el historial.
// `hora: null` / `minimo: ""` los quitan.
export const actualizarHabito = enSerie(async (id, cambios) => {
  const nombre = cambios.nombre?.trim();
  if (cambios.nombre !== undefined && !nombre) {
    throw new Error("El nombre del hábito no puede estar vacío");
  }
  const plan = await getPlan();
  plan.habitos = plan.habitos.map((h) =>
    h.id === id
      ? {
          ...h,
          ...(nombre !== undefined && { nombre }),
          ...(cambios.categoria && { categoria: cambios.categoria }),
          ...("hora" in cambios && { hora: cambios.hora || null }),
          ...("minimo" in cambios && { minimo: cambios.minimo?.trim() || null }),
          ...(cambios.metaSemanal && { metaSemanal: cambios.metaSemanal }),
        }
      : h,
  );
  await guardar(plan);
  return plan;
});

export const eliminarHabito = enSerie(async (id) => {
  const plan = await getPlan();
  plan.habitos = plan.habitos.filter((h) => h.id !== id);
  await guardar(plan);
  return plan;
});

// "Ya me sale solo": deja de ocupar uno de los 3 cupos de ancla
export const marcarAutomatico = enSerie(async (id) => {
  const plan = await getPlan();
  plan.habitos = plan.habitos.map((h) =>
    h.id === id ? { ...h, estado: "automatico" } : h,
  );
  await guardar(plan);
  return plan;
});

// Convierte un hábito normal en ancla. Lanza error si ya hay MAX_ANCLAS.
// Las ancla necesitan versión mínima: si no tenía, se le pone una por defecto.
export const hacerAncla = enSerie(async (id) => {
  const plan = await getPlan();
  if (anclasActivas(plan).length >= MAX_ANCLAS) {
    throw new Error(
      `Ya tienes ${MAX_ANCLAS} hábitos ancla. Vuelve uno automático primero.`,
    );
  }
  plan.habitos = plan.habitos.map((h) =>
    h.id === id
      ? {
          ...h,
          ancla: true,
          estado: "activo",
          minimo: h.minimo || "La versión más pequeña posible",
        }
      : h,
  );
  await guardar(plan);
  return plan;
});

// Deja de ser ancla (libera el cupo) pero sigue como hábito normal
export const quitarAncla = enSerie(async (id) => {
  const plan = await getPlan();
  plan.habitos = plan.habitos.map((h) =>
    h.id === id ? { ...h, ancla: false, estado: "activo" } : h,
  );
  await guardar(plan);
  return plan;
});

// Saca un hábito y lo devuelve al final de la cola.
// La cola solo conoce las 5 áreas: si la categoría no es un área, va a "Atención".
export const devolverACola = enSerie(async (id) => {
  const plan = await getPlan();
  const habito = plan.habitos.find((h) => h.id === id);
  if (!habito) return plan;
  plan.habitos = plan.habitos.filter((h) => h.id !== id);
  plan.cola.push({
    id: nuevoId(),
    nombre: habito.nombre,
    area: AREAS[habito.categoria] ? habito.categoria : "Atención",
  });
  await guardar(plan);
  return plan;
});

// Convierte una meta de la cola en hábito ancla.
// Lanza un error si ya hay MAX_ANCLAS activos: esa es la regla de oro.
export const promoverAAncla = enSerie(async (colaId, { minimo, metaSemanal }) => {
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
    categoria: meta.area,
    hora: null,
    minimo: minimo.trim() || "La versión más pequeña posible",
    metaSemanal,
    ancla: true,
    estado: "activo",
    dias: {},
  });
  await guardar(plan);
  return plan;
});

// ─── Cola y victorias rápidas ───────────────────────────────────────────────

export const agregarACola = enSerie(async (nombre, area) => {
  const plan = await getPlan();
  plan.cola.push({ id: nuevoId(), nombre: nombre.trim(), area });
  await guardar(plan);
  return plan;
});

export const quitarDeCola = enSerie(async (id) => {
  const plan = await getPlan();
  plan.cola = plan.cola.filter((c) => c.id !== id);
  await guardar(plan);
  return plan;
});

export const agregarVictoria = enSerie(async (nombre) => {
  const plan = await getPlan();
  plan.victorias.push({ id: nuevoId(), nombre: nombre.trim(), hecha: false });
  await guardar(plan);
  return plan;
});

export const toggleVictoria = enSerie(async (id) => {
  const plan = await getPlan();
  plan.victorias = plan.victorias.map((v) =>
    v.id === id ? { ...v, hecha: !v.hecha } : v,
  );
  await guardar(plan);
  return plan;
});

export const eliminarVictoria = enSerie(async (id) => {
  const plan = await getPlan();
  plan.victorias = plan.victorias.filter((v) => v.id !== id);
  await guardar(plan);
  return plan;
});

// ─── Revisión del domingo ───────────────────────────────────────────────────

// Guarda (o reemplaza) la revisión de la semana actual, con una "foto"
// de cómo te fue en cada hábito ancla activo.
export const guardarRevision = enSerie(async (nota) => {
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
});
