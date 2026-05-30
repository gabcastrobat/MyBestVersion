import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "gastos";

export async function getGastos() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function saveGasto(gasto) {
  const gastos = await getGastos();
  const nuevo = {
    id: Date.now().toString(),
    descripcion: gasto.descripcion,
    monto: parseFloat(gasto.monto),
    categoria: gasto.categoria,
    fecha: new Date().toISOString(),
  };
  gastos.push(nuevo);
  await AsyncStorage.setItem(KEY, JSON.stringify(gastos));
  return nuevo;
}

export async function deleteGasto(id) {
  const gastos = await getGastos();
  const filtrados = gastos.filter((g) => g.id !== id);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtrados));
  return filtrados;
}
