import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { Alert, AppState } from "react-native";
import {
  deleteAlarma,
  getAlarmas,
  saveAlarma,
  updateAlarma,
} from "../storage/alarmas";
import {
  abrirAjuste,
  estadoPermisosAlarma,
  reprogramarAlarmas,
} from "../storage/programadorAlarmas";

// Todo lo que necesita la pestaña Alarmas. Después de cada cambio en el
// storage se reprograma Android, así lo guardado y lo que va a sonar
// nunca se desincronizan.
export function useAlarmas() {
  const [alarmas, setAlarmas] = useState([]);
  const [permisos, setPermisos] = useState(null);
  const [cargando, setCargando] = useState(true);

  const recargar = useCallback(async () => {
    try {
      const [lista, estado] = await Promise.all([getAlarmas(), estadoPermisosAlarma()]);
      setAlarmas(lista);
      setPermisos(estado);
    } catch (e) {
      console.log("Error cargando alarmas:", e);
    } finally {
      // Aunque falle (ej: módulo nativo no disponible) la pantalla no se
      // queda en blanco para siempre
      setCargando(false);
    }
  }, []);

  // Al entrar a la pestaña se releen las alarmas y los permisos.
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      Promise.all([getAlarmas(), estadoPermisosAlarma()])
        .then(([lista, estado]) => {
          if (!activo) return;
          setAlarmas(lista);
          setPermisos(estado);
        })
        .catch((e) => console.log("Error cargando alarmas:", e))
        .finally(() => {
          if (activo) setCargando(false);
        });
      return () => {
        activo = false;
      };
    }, []),
  );

  // Al volver de los Ajustes de Android la pestaña no pierde el foco
  // (la app solo pasó a segundo plano), así que escuchamos AppState para
  // ver al momento si el usuario ya dio el permiso.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (estado) => {
      if (estado === "active") recargar();
    });
    return () => sub.remove();
  }, [recargar]);

  // Envuelve cada cambio: guardar → reprogramar Android → recargar la lista
  async function conReprogramar(accion) {
    const resultado = await accion(); // lanza error si los datos son inválidos
    // Si falla la programación, el cambio YA quedó guardado: no se relanza el
    // error (el formulario seguiría abierto y al reintentar se duplicaría la
    // alarma), pero sí se avisa, porque una alarma que no suena es grave.
    try {
      await reprogramarAlarmas();
    } catch (e) {
      console.log("Error programando alarmas:", e);
      Alert.alert(
        "Guardado, pero no programado",
        "La alarma se guardó, pero Android no pudo programarla. Revisa los permisos y vuelve a intentarlo.",
      );
    }
    await recargar();
    return resultado;
  }

  return {
    alarmas,
    permisos,
    cargando,
    agregar: (datos) => conReprogramar(() => saveAlarma(datos)),
    editar: (id, cambios) => conReprogramar(() => updateAlarma(id, cambios)),
    alternar: (alarma) => conReprogramar(() => updateAlarma(alarma.id, { activa: !alarma.activa })),
    eliminar: (id) => conReprogramar(() => deleteAlarma(id)),
    abrirAjuste,
    recargar,
  };
}
