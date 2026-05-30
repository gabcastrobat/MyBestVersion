import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tareas";

export async function getTareas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveTarea(tarea) {
  const tareas = await getTareas();
  const nueva = {
    id: Date.now().toString(),
    nombre: tarea.nombre,
    prioridad: tarea.prioridad,
    completada: false,
  };
  tareas.push(nueva);
  await AsyncStorage.setItem(KEY, JSON.stringify(tareas));
  return nueva;
}

export async function toggleTarea(id) {
  const tareas = await getTareas();
  const actualizadas = tareas.map((t) =>
    t.id === id ? { ...t, completada: !t.completada } : t,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(actualizadas));
  return actualizadas;
}

export async function deleteTarea(id) {
  const tareas = await getTareas();
  const filtradas = tareas.filter((t) => t.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtradas));
  return filtradas;
}
