import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
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

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      (async () => {
        await resetDiarioSiNecesario();
        const data = await getRutinas();
        if (activo) {
          setRutinas(data);
          setCargando(false);
        }
      })();
      return () => {
        activo = false;
      };
    }, []),
  );

  async function agregar(rutina) {
    const nueva = await saveRutina(rutina);
    await programarRecordatorio(nueva.id, nueva.nombre, nueva.hora);
    setRutinas((prev) => [...prev, nueva]);
  }

  async function toggle(id) {
    const actualizadas = await toggleRutina(id);
    setRutinas(actualizadas);
  }

  async function eliminar(id) {
    await cancelarRecordatorio(id);
    const filtradas = await deleteRutina(id);
    setRutinas(filtradas);
  }

  return { rutinas, cargando, agregar, toggle, eliminar };
}
