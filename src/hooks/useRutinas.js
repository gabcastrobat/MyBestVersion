import { useEffect, useState } from "react";
import {
    deleteRutina,
    getRutinas,
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
    const data = await getRutinas();
    setRutinas(data);
    setCargando(false);
  }

  async function agregar(rutina) {
    const nueva = await saveRutina(rutina);
    setRutinas((prev) => [...prev, nueva]);
  }

  async function toggle(id) {
    const actualizadas = await toggleRutina(id);
    setRutinas(actualizadas);
  }

  async function eliminar(id) {
    const filtradas = await deleteRutina(id);
    setRutinas(filtradas);
  }

  return { rutinas, cargando, agregar, toggle, eliminar };
}
