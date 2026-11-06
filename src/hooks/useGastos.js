import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { deleteGasto, getGastos, saveGasto } from "../storage/gastos";

export function useGastos() {
  const [gastos, setGastos] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getGastos().then((data) => {
        if (activo) {
          setGastos(data);
          setCargando(false);
        }
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  async function agregar(gasto) {
    const nuevo = await saveGasto(gasto);
    setGastos((prev) => [...prev, nuevo]);
    return nuevo;
  }

  async function eliminar(id) {
    const filtrados = await deleteGasto(id);
    setGastos(filtrados);
  }

  return { gastos, cargando, agregar, eliminar };
}
