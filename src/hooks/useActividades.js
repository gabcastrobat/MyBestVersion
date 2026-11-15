import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getActividadesPorFecha } from "../storage/actividades";

// Hook del historial: devuelve lo que se completó en una fecha ("YYYY-MM-DD").
// Mismo patrón que useTareas/useRutinas: recarga cada vez que la pestaña
// gana foco, así ves al instante lo que marcaste en otra pestaña.
export function useActividades(fecha) {
  const [actividades, setActividades] = useState([]);
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getActividadesPorFecha(fecha).then((data) => {
        if (activo) {
          // Más recientes primero
          data.sort((a, b) => b.completadaEn.localeCompare(a.completadaEn));
          setActividades(data);
          setCargando(false);
        }
      });
      return () => {
        activo = false;
      };
    }, [fecha]), // si cambia la fecha, se vuelve a cargar
  );

  return { actividades, cargando };
}
