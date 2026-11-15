import { useFocusEffect } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  descartarEntreno,
  getEntrenoEnCurso,
  guardarEntrenoEnCurso,
  terminarEntreno,
} from "../storage/gimnasio";

function nuevoId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Estado del entreno que estás haciendo. Cada cambio se guarda al momento
// en AsyncStorage, así si la app se cierra puedes continuar donde ibas.
export function useEntreno() {
  const [entreno, setEntreno] = useState(null);
  const [cargando, setCargando] = useState(true);

  // useFocusEffect y no useEffect: las pantallas de pestañas NO se destruyen
  // al salir, así que hay que releer el entreno cada vez que entras
  // (por ejemplo, después de empezar uno nuevo desde Gimnasio).
  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getEntrenoEnCurso().then((e) => {
        if (!activo) return;
        setEntreno(e);
        setCargando(false);
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  // Cada vez que el entreno cambia, se guarda. Lo hacemos en un efecto
  // (y no dentro de setEntreno) porque React pide que las funciones que
  // calculan el estado no tengan efectos secundarios como escribir en disco.
  useEffect(() => {
    if (entreno) guardarEntrenoEnCurso(entreno);
  }, [entreno]);

  // Aplica un cambio al entreno.
  // `cambio` es una función: recibe el entreno actual y devuelve el nuevo.
  function actualizar(cambio) {
    setEntreno((prev) => (prev ? cambio(prev) : prev));
  }

  function editarSerie(ejId, serieId, campo, valor) {
    actualizar((e) => ({
      ...e,
      ejercicios: e.ejercicios.map((ej) =>
        ej.id !== ejId
          ? ej
          : {
              ...ej,
              series: ej.series.map((s) =>
                s.id === serieId ? { ...s, [campo]: valor } : s,
              ),
            },
      ),
    }));
  }

  // Nueva serie copiando los valores de la anterior (lo normal en el gym)
  function agregarSerie(ejId) {
    actualizar((e) => ({
      ...e,
      ejercicios: e.ejercicios.map((ej) => {
        if (ej.id !== ejId) return ej;
        const ultima = ej.series[ej.series.length - 1];
        return {
          ...ej,
          series: [
            ...ej.series,
            { id: nuevoId(), reps: ultima?.reps ?? "", peso: ultima?.peso ?? "" },
          ],
        };
      }),
    }));
  }

  function quitarSerie(ejId, serieId) {
    actualizar((e) => ({
      ...e,
      ejercicios: e.ejercicios.map((ej) =>
        ej.id !== ejId
          ? ej
          : { ...ej, series: ej.series.filter((s) => s.id !== serieId) },
      ),
    }));
  }

  function agregarEjercicio(nombre) {
    const limpio = nombre.trim();
    if (!limpio) return;
    actualizar((e) => ({
      ...e,
      ejercicios: [
        ...e.ejercicios,
        {
          id: nuevoId(),
          nombre: limpio,
          series: [{ id: nuevoId(), reps: "", peso: "" }],
        },
      ],
    }));
  }

  async function terminar() {
    const sesion = await terminarEntreno(entreno); // lanza error si es inválido
    setEntreno(null);
    return sesion;
  }

  async function descartar() {
    await descartarEntreno();
    setEntreno(null);
  }

  return {
    entreno,
    cargando,
    editarSerie,
    agregarSerie,
    quitarSerie,
    agregarEjercicio,
    terminar,
    descartar,
  };
}
