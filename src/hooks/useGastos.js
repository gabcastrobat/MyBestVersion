import { useEffect, useState } from "react";
import { deleteGasto, getGastos, saveGasto } from "../storage/gastos";

export function useGastos() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const data = await getGastos();
    setGastos(data);
    setCargando(false);
  }

  async function agregar(gasto) {
    const nuevo = await saveGasto(gasto);
    setGastos((prev) => [...prev, nuevo]);
  }

  async function eliminar(id) {
    const filtrados = await deleteGasto(id);
    setGastos(filtrados);
  }

  return { gastos, cargando, agregar, eliminar };
}
