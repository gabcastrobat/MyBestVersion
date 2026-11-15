import AsyncStorage from "@react-native-async-storage/async-storage";
import { quitarActividadDeHoy, registrarActividad } from "./actividades";
import { crearCola } from "../utils/cola";

// Todas las escrituras de este archivo pasan por la misma cola: así dos
// cambios casi simultáneos no se pisan (ver utils/cola.js).
const enSerie = crearCola();

const KEY = "tareas";
const KEY_FECHA = "tareas_ultima_fecha";

// Mismo patrón que en Rutinas: si cambió el día, se limpian las tareas
// que ya se completaron en días anteriores. Las pendientes se conservan
// para que no se pierdan (se "arrastran" al día nuevo).
export const resetDiarioSiNecesario = enSerie(async () => {
  const hoy = new Date().toDateString();
  const ultimaFecha = await AsyncStorage.getItem(KEY_FECHA);

  if (ultimaFecha !== hoy) {
    const tareas = await getTareas();
    const vigentes = tareas.filter((t) => !t.completada);
    await AsyncStorage.setItem(KEY, JSON.stringify(vigentes));
    await AsyncStorage.setItem(KEY_FECHA, hoy);
  }
});

export async function getTareas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export const saveTarea = enSerie(async (tarea) => {
  const tareas = await getTareas();
  const nueva = {
    // Tiempo + sufijo aleatorio: dos tareas creadas en el mismo milisegundo
    // ya no comparten id (con id repetido, marcar una marcaba las dos).
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    nombre: tarea.nombre.trim(),
    prioridad: tarea.prioridad,
    completada: false,
    fechaCreacion: new Date().toISOString(),
  };
  tareas.push(nueva);
  await AsyncStorage.setItem(KEY, JSON.stringify(tareas));
  return nueva;
});

export const toggleTarea = enSerie(async (id) => {
  const tareas = await getTareas();
  const actualizadas = tareas.map((t) =>
    t.id === id
      ? {
          ...t,
          completada: !t.completada,
          fechaCompletada: !t.completada ? new Date().toISOString() : null,
        }
      : t,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(actualizadas));

  // Anotar en el historial. Importante: el reset diario BORRA las tareas
  // completadas, así que el historial es lo único que recordará que existieron.
  const tarea = actualizadas.find((t) => t.id === id);
  if (tarea) {
    if (tarea.completada) await registrarActividad("tarea", tarea);
    else await quitarActividadDeHoy("tarea", id);
  }

  return actualizadas;
});

// Edita nombre y/o prioridad. `cambios` = { nombre?, prioridad? }
// Solo se aceptan esos campos: así una pantalla no puede cambiar por error
// el id o el estado de completada desde aquí.
export const updateTarea = enSerie(async (id, cambios) => {
  const nombre = cambios.nombre?.trim();
  if (cambios.nombre !== undefined && !nombre) {
    throw new Error("El nombre de la tarea no puede estar vacío");
  }
  const tareas = await getTareas();
  const actualizadas = tareas.map((t) =>
    t.id === id
      ? {
          ...t,
          ...(nombre !== undefined && { nombre }),
          ...(cambios.prioridad && { prioridad: cambios.prioridad }),
          updatedAt: new Date().toISOString(),
        }
      : t,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(actualizadas));
  return actualizadas;
});

export const deleteTarea = enSerie(async (id) => {
  const tareas = await getTareas();
  const filtradas = tareas.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtradas));
  return filtradas;
});
