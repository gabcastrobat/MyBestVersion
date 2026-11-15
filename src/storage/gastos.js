import AsyncStorage from "@react-native-async-storage/async-storage";
import { crearCola } from "../utils/cola";

// Todas las escrituras de este archivo pasan por la misma cola: así dos
// cambios casi simultáneos no se pisan (ver utils/cola.js).
const enSerie = crearCola();

const KEY = "gastos";

export async function getGastos() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export const saveGasto = enSerie(async (gasto) => {
  const gastos = await getGastos();
  const nuevo = {
    // Tiempo + sufijo aleatorio, para que dos gastos nunca compartan id
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    descripcion: gasto.descripcion,
    monto: parseFloat(gasto.monto),
    categoria: gasto.categoria,
    fecha: new Date().toISOString(),
  };
  gastos.push(nuevo);
  await AsyncStorage.setItem(KEY, JSON.stringify(gastos));
  return nuevo;
});

export const deleteGasto = enSerie(async (id) => {
  const gastos = await getGastos();
  const filtrados = gastos.filter((g) => g.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtrados));
  return filtrados;
});
