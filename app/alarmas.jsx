import { Proximamente } from "../src/components/Proximamente";

export default function AlarmasScreen() {
  return (
    <Proximamente
      icono="alarm-outline"
      titulo="Alarmas con desafío"
      descripcion="Alarmas que solo se apagan haciendo sentadillas, flexiones o plancha. Necesitan un development build, porque Expo Go no permite alarmas a pantalla completa."
      fase="Fase 6 del plan"
    />
  );
}
