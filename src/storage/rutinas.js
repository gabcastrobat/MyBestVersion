import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "rutinas";

// Trae todas las rutinas guardadas
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
  return actualizadas;
}

// Elimina una rutina
export async function deleteRutina(id) {
  const rutinas = await getRutinas();
  const filtradas = rutinas.filter((r) => r.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtradas));
  return filtradas;
}
