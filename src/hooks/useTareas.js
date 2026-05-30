import { useEffect, useState } from "react";
import {
    deleteTarea,
    getTareas,
    saveTarea,
    toggleTarea,
} from "../storage/tareas";

export function useTareas() {
  const [tareas, setTareas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const data = await getTareas();
    setTareas(data);
    setCargando(false);
  }

  async function agregar(tarea) {
    const nueva = await saveTarea(tarea);
    setTareas((prev) => [...prev, nueva]);
  }

  async function toggle(id) {
    const actualizadas = await toggleTarea(id);
    setTareas(actualizadas);
  }

  async function eliminar(id) {
    const filtradas = await deleteTarea(id);
    setTareas(filtradas);
  }

  return { tareas, cargando, agregar, toggle, eliminar };
}
