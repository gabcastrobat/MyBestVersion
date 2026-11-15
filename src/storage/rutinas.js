import AsyncStorage from "@react-native-async-storage/async-storage";
import { quitarActividadDeHoy, registrarActividad } from "./actividades";

const KEY = "rutinas";
const KEY_FECHA = "rutinas_ultima_fecha";

// Revisa si cambió el día y reinicia las rutinas si es necesario
export async function resetDiarioSiNecesario() {
  const hoy = new Date().toDateString(); // ej: "Thu May 29 2026"
  const ultimaFecha = await AsyncStorage.getItem(KEY_FECHA);

  if (ultimaFecha !== hoy) {
    // Es un día nuevo: poner todas las rutinas en no completadas
    const rutinas = await getRutinas();
    const reiniciadas = rutinas.map((r) => ({ ...r, completada: false }));
    await AsyncStorage.setItem(KEY, JSON.stringify(reiniciadas));
    await AsyncStorage.setItem(KEY_FECHA, hoy);
  }
}


export async function getRutinas() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

// Guarda una rutina nueva
export async function saveRutina(rutina) {
  const rutinas = await getRutinas();
  const nueva = {
    id: Date.now().toString(),
    nombre: rutina.nombre,
    hora: rutina.hora,
    categoria: rutina.categoria,
    completada: false,
  };
  rutinas.push(nueva);
  await AsyncStorage.setItem(KEY, JSON.stringify(rutinas));
  return nueva;
}

// Marca una rutina como completada o no
export async function toggleRutina(id) {
  const rutinas = await getRutinas();
  const actualizadas = rutinas.map((r) =>
    r.id === id ? { ...r, completada: !r.completada } : r,
  );
  await AsyncStorage.setItem(KEY, JSON.stringify(actualizadas));

  // Anotar en el historial: así el calendario sabe qué hiciste cada día,
  // aunque mañana el reset diario vuelva a poner la rutina en "no completada".
  const rutina = actualizadas.find((r) => r.id === id);
  if (rutina) {
    if (rutina.completada) await registrarActividad("rutina", rutina);
    else await quitarActividadDeHoy("rutina", id);
  }

  return actualizadas;
}

// Elimina una rutina
export async function deleteRutina(id) {
  const rutinas = await getRutinas();
  const filtradas = rutinas.filter((r) => r.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtradas));
  return filtradas;
}
