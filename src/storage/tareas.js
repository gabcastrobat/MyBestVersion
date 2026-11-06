import AsyncStorage from "@react-native-async-storage/async-storage";
import { quitarActividadDeHoy, registrarActividad } from "./actividades";

const KEY = "tareas";
const KEY_FECHA = "tareas_ultima_fecha";

// Mismo patrón que en Rutinas: si cambió el día, se limpian las tareas
// que ya se completaron en días anteriores. Las pendientes se conservan
// para que no se pierdan (se "arrastran" al día nuevo).
export async function resetDiarioSiNecesario() {
  const hoy = new Date().toDateString();
  const ultimaFecha = await AsyncStorage.getItem(KEY_FECHA);

  if (ultimaFecha !== hoy) {
    const tareas = await getTareas();
    const vigentes = tareas.filter((t) => !t.completada);
    await AsyncStorage.setItem(KEY, JSON.stringify(vigentes));
    await AsyncStorage.setItem(KEY_FECHA, hoy);
  }
}

export async function getTareas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveTarea(tarea) {
  const tareas = await getTareas();
  const nueva = {
    id: Date.now().toString(),
    nombre: tarea.nombre.trim(),
    prioridad: tarea.prioridad,
    completada: false,
    fechaCreacion: new Date().toISOString(),
  };
  tareas.push(nueva);
  await AsyncStorage.setItem(KEY, JSON.stringify(tareas));
  return nueva;
}

export async function toggleTarea(id) {
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
}

export async function deleteTarea(id) {
  const tareas = await getTareas();
  const filtradas = tareas.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtradas));
  return filtradas;
}
