import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getResumenPorFecha } from "../storage/actividades";

// Devuelve { "YYYY-MM-DD": { rutina: n, tarea: n } } para marcar los días
// del calendario. Recarga al ganar foco, como el resto de hooks.
export function useResumenCalendario() {
  const [resumen, setResumen] = useState({});

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getResumenPorFecha().then((data) => {
        if (activo) setResumen(data);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  return { resumen };
}
