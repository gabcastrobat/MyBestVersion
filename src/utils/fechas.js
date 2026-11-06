// Utilidades de fechas compartidas por toda la app.
//
// ¿Por qué no usar `new Date().toISOString().slice(0, 10)`?
// Porque toISOString() devuelve la fecha en UTC. En Perú/Colombia (UTC-5),
// a las 8 PM del lunes UTC ya es martes, y la actividad quedaría guardada
// en el día equivocado del calendario. Aquí usamos la hora LOCAL del celular.

// Convierte una fecha a "YYYY-MM-DD" en hora local. Ej: 2026-11-06
export function fechaLocal(date = new Date()) {
  const anio = date.getFullYear();
  const mes = String(date.getMonth() + 1).padStart(2, "0"); // getMonth() va de 0 a 11
  const dia = String(date.getDate()).padStart(2, "0");
  return `${anio}-${mes}-${dia}`;
}

// La fecha de hoy en formato "YYYY-MM-DD"
export function hoy() {
  return fechaLocal(new Date());
}
