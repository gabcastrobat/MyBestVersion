import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { getPerfil, savePerfil } from "../storage/perfil";

export function usePerfil() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    telefono: "",
    foto: null,
  });
  const [cargando, setCargando] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let activo = true;
      getPerfil().then((data) => {
        if (activo) {
          setPerfil(data);
          setCargando(false);
        }
      });
      return () => {
        activo = false;
      };
    }, []),
  );

  async function guardar(datos) {
    const actualizado = await savePerfil(datos);
    setPerfil(actualizado);
  }

  return { perfil, cargando, guardar };
}
