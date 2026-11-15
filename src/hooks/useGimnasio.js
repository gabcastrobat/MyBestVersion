import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  calcularEstadisticas,
  deletePlantilla,
  getEntrenoEnCurso,
  getPlantillas,
  getSesiones,
  savePlantilla,
} from "../storage/gimnasio";

// Todo lo que necesita la pestaña Gimnasio: plantillas, historial,
// estadísticas y si hay un entreno sin terminar.
export function useGimnasio() {
  const [plantillas, setPlantillas] = useState([]);
  const [sesiones, setSesiones] = useState([]);
  const [enCurso, setEnCurso] = useState(null);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([getPlantillas(), getSesiones(), getEntrenoEnCurso()]).then(
        ([p, s, e]) => {
          if (!activo) return;
          setPlantillas(p);
          setSesiones(s);
          setEnCurso(e);
          setCargando(false);
        },
      );
      return () => {
        activo = false;
      };
    }, []),
  );

  async function agregarPlantilla(datos) {
    const nueva = await savePlantilla(datos); // lanza error si es inválida
    setPlantillas((prev) => [...prev, nueva]);
  }

  async function eliminarPlantilla(id) {
    await deletePlantilla(id);
    setPlantillas((prev) => prev.filter((p) => p.id !== id));
  }

  // Las estadísticas se derivan de las sesiones: no se guardan aparte,
  // así nunca pueden quedar desactualizadas.
  const estadisticas = calcularEstadisticas(sesiones);

  return {
    plantillas,
    sesiones,
    enCurso,
    estadisticas,
    cargando,
    agregarPlantilla,
    eliminarPlantilla,
  };
}
