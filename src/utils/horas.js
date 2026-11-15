// Utilidades de horas en formato "7:30 PM" (el que guardan los hábitos).
import { parseHora } from "../storage/notificaciones";

// Date → "7:30 PM"
export function formatHora(date) {
  let horas = date.getHours();
  const minutos = date.getMinutes();
  const periodo = horas >= 12 ? "PM" : "AM";
  horas = horas % 12 || 12;
  return `${horas}:${minutos.toString().padStart(2, "0")} ${periodo}`;
}

// "7:30 PM" → Date de hoy a esa hora (para precargar el selector al editar)
export function horaADate(hora) {
  const { hora24, minutos } = parseHora(hora);
  const d = new Date();
  d.setHours(hora24, minutos, 0, 0);
  return d;
}

// "7:30 PM" → minutos desde medianoche, para ordenar por hora.
// Sin hora (null) → al final del día.
export function minutosDelDia(hora) {
  if (!hora) return 24 * 60 + 1;
  const { hora24, minutos } = parseHora(hora);
  return hora24 * 60 + minutos;
}
