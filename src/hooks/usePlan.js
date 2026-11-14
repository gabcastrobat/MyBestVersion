import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import * as storage from "../storage/plan";

// Hook del Plan de mejora. Mismo patrón que useRutinas: recarga al ganar foco.
//
// Todas las funciones de storage/plan.js devuelven el plan completo ya
// guardado, así que cada acción es "llamar al storage → setPlan(resultado)".
// `ejecutar` evita repetir esas dos líneas en cada función.
export function usePlan() {
  const [plan, setPlan] = useState(null);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      storage.getPlan().then((data) => {
        if (activo) setPlan(data);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  async function ejecutar(accion, ...args) {
    const nuevo = await accion(...args);
    setPlan(nuevo);
  }

  return {
    plan,
    cargando: plan === null,
    marcarHabito: (id, tipo) => ejecutar(storage.marcarHabitoHoy, id, tipo),
    marcarAutomatico: (id) => ejecutar(storage.marcarAutomatico, id),
    devolverACola: (id) => ejecutar(storage.devolverACola, id),
    // Este sí puede fallar (regla de los 3 hábitos): el error sube a la pantalla
    promover: (colaId, datos) => ejecutar(storage.promoverAAncla, colaId, datos),
    agregarACola: (nombre, area) => ejecutar(storage.agregarACola, nombre, area),
    quitarDeCola: (id) => ejecutar(storage.quitarDeCola, id),
    agregarVictoria: (nombre) => ejecutar(storage.agregarVictoria, nombre),
    toggleVictoria: (id) => ejecutar(storage.toggleVictoria, id),
    eliminarVictoria: (id) => ejecutar(storage.eliminarVictoria, id),
    guardarRevision: (nota) => ejecutar(storage.guardarRevision, nota),
  };
}
