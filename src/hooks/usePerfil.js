import { useEffect, useState } from "react";
import { getPerfil, savePerfil } from "../storage/perfil";

export function usePerfil() {
  const [perfil, setPerfil] = useState({
    nombre: "",
    email: "",
    telefono: "",
    foto: null,
  });
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    const data = await getPerfil();
    setPerfil(data);
    setCargando(false);
  }

  async function guardar(datos) {
    const actualizado = await savePerfil(datos);
    setPerfil(actualizado);
  }

  return { perfil, cargando, guardar };
}
