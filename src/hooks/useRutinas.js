import { useEffect, useState } from "react";
import {
    cancelarRecordatorio,
    programarRecordatorio,
} from "../storage/notificaciones";
import {
    deleteRutina,
    getRutinas,
    resetDiarioSiNecesario,
    saveRutina,
    toggleRutina,
} from "../storage/rutinas";

export function useRutinas() {
  const [rutinas, setRutinas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    await resetDiarioSiNecesario();
    const data = await getRutinas();
    setRutinas(data);
    setCargando(false);
  }

  async function agregar(rutina) {
    const nueva = await saveRutina(rutina);
    // Programar notificación cuando se crea una rutina
    await programarRecordatorio(nueva.id, nueva.nombre, nueva.hora);
    setRutinas((prev) => [...prev, nueva]);
  }

  async function toggle(id) {
    const actualizadas = await toggleRutina(id);
    setRutinas(actualizadas);
  }

  async function eliminar(id) {
    // Cancelar notificación cuando se elimina una rutina
    await cancelarRecordatorio(id);
    const filtradas = await deleteRutina(id);
    setRutinas(filtradas);
  }

  return { rutinas, cargando, agregar, toggle, eliminar };
}
