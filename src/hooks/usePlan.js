import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import {
  cancelarRecordatorio,
  programarRecordatorio,
} from "../storage/notificaciones";
import * as storage from "../storage/plan";

// Hook de hábitos + plan de mejora (rutinas y hábitos ancla ya son lo mismo).
// Recarga al ganar foco, como el resto de hooks.
//
// Todas las funciones de storage/plan.js devuelven el plan completo ya
// guardado, así que cada acción es "llamar al storage → setPlan(resultado)".
// `ejecutar` evita repetir esas dos líneas en cada función y devuelve el plan
// nuevo por si hace falta (ej: para programar un recordatorio).
export function usePlan() {
  const [plan, setPlan] = useState(null);
  // Si la lectura (o la migración) falla, la pantalla muestra el error con un
  // botón de reintentar en vez de quedarse en blanco para siempre.
  const [error, setError] = useState(null);

  const cargar = useCallback(async (sigueActivo = () => true) => {
    try {
      const data = await storage.getPlan();
      if (!sigueActivo()) return;
      setPlan(data);
      setError(null);
    } catch (e) {
      console.log("Error cargando el plan:", e);
      if (sigueActivo()) setError(e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      cargar(() => activo);
      return () => {
        activo = false;
      };
    }, [cargar]),
  );

  async function ejecutar(accion, ...args) {
    const nuevo = await accion(...args);
    setPlan(nuevo);
    return nuevo;
  }

  // Un hábito con hora tiene recordatorio diario; sin hora (o ya automático,
  // o eliminado) no. El id del hábito es el id de la notificación.
  async function sincronizarRecordatorio(plan, id) {
    await cancelarRecordatorio(id);
    const h = plan.habitos.find((x) => x.id === id);
    if (h?.hora && h.estado === "activo") {
      await programarRecordatorio(h.id, h.nombre, h.hora);
    }
  }

  return {
    plan,
    cargando: plan === null && !error,
    error: plan === null ? error : null, // con datos ya cargados no se molesta
    reintentar: () => cargar(),
    marcarHabito: (id, tipo) => ejecutar(storage.marcarHabitoHoy, id, tipo),
    crearHabito: async (datos) => {
      const nuevo = await ejecutar(storage.crearHabito, datos);
      const creado = nuevo.habitos[nuevo.habitos.length - 1];
      await sincronizarRecordatorio(nuevo, creado.id);
    },
    actualizarHabito: async (id, cambios) => {
      const nuevo = await ejecutar(storage.actualizarHabito, id, cambios);
      await sincronizarRecordatorio(nuevo, id);
    },
    eliminarHabito: async (id) => {
      const nuevo = await ejecutar(storage.eliminarHabito, id);
      await sincronizarRecordatorio(nuevo, id);
    },
    marcarAutomatico: async (id) => {
      const nuevo = await ejecutar(storage.marcarAutomatico, id);
      await sincronizarRecordatorio(nuevo, id);
    },
    // Estos dos pueden fallar (regla de los 3 hábitos): el error sube a la pantalla
    hacerAncla: (id) => ejecutar(storage.hacerAncla, id),
    promover: (colaId, datos) => ejecutar(storage.promoverAAncla, colaId, datos),
    quitarAncla: (id) => ejecutar(storage.quitarAncla, id),
    devolverACola: async (id) => {
      const nuevo = await ejecutar(storage.devolverACola, id);
      await sincronizarRecordatorio(nuevo, id);
    },
    agregarACola: (nombre, area) => ejecutar(storage.agregarACola, nombre, area),
    quitarDeCola: (id) => ejecutar(storage.quitarDeCola, id),
    agregarVictoria: (nombre) => ejecutar(storage.agregarVictoria, nombre),
    toggleVictoria: (id) => ejecutar(storage.toggleVictoria, id),
    eliminarVictoria: (id) => ejecutar(storage.eliminarVictoria, id),
    guardarRevision: (nota) => ejecutar(storage.guardarRevision, nota),
  };
}
