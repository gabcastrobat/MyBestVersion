import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getEstadisticasRutinas, getHistorial } from "../storage/actividades";

// Estadísticas (total y racha por rutina) + últimas rutinas completadas.
// Devuelve también `recargar`: la pantalla lo llama después de marcar una
// rutina, porque en ese caso la pestaña no pierde ni gana foco y
// useFocusEffect no volvería a ejecutarse.
export function useHistorialRutinas() {
  const [estadisticas, setEstadisticas] = useState({});
  const [recientes, setRecientes] = useState([]);

  const recargar = useCallback(async () => {
    const [stats, historial] = await Promise.all([
      getEstadisticasRutinas(),
      getHistorial("rutina", 30),
    ]);
    setEstadisticas(stats);
    setRecientes(historial);
  }, []);

  useFocusEffect(
    useCallback(() => {
      recargar();
    }, [recargar]),
  );

  return { estadisticas, recientes, recargar };
}
