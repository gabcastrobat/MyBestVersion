import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  deleteTarea,
  getTareas,
  resetDiarioSiNecesario,
  saveTarea,
  toggleTarea,
  updateTarea,
} from "../storage/tareas";

export function useTareas() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect (no useEffect): recarga cada vez que el tab gana foco
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        await resetDiarioSiNecesario();
        const data = await getTareas();
        if (activo) {
          setTareas(data);
          setCargando(false);
        }
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  async function agregar(tarea) {
    const nueva = await saveTarea(tarea);
    setTareas((prev) => [...prev, nueva]);
  }

  async function toggle(id) {
    const actualizadas = await toggleTarea(id);
    setTareas(actualizadas);
  }

  async function editar(id, cambios) {
    const actualizadas = await updateTarea(id, cambios);
    setTareas(actualizadas);
  }

  async function eliminar(id) {
    const filtradas = await deleteTarea(id);
    setTareas(filtradas);
  }

  return { tareas, cargando, agregar, toggle, editar, eliminar };
}
