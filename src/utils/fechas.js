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

// Suma (o resta, con n negativo) días a una fecha "YYYY-MM-DD".
// Usamos new Date(año, mes, día) para que JavaScript se encargue de
// los cambios de mes/año: 2026-03-01 menos 1 día → 2026-02-28.
export function sumarDias(fecha, n) {
  const [a, m, d] = fecha.split("-").map(Number);
  return fechaLocal(new Date(a, m - 1, d + n));
}

// La fecha de hoy en formato "YYYY-MM-DD"
export function hoy() {
  return fechaLocal(new Date());
}

// Lunes de la semana de `date`, en "YYYY-MM-DD".
// getDay() devuelve 0 = domingo ... 6 = sábado; aquí la semana arranca el lunes,
// así que el domingo pertenece a la semana que empezó 6 días antes.
export function inicioSemana(date = new Date()) {
  const d = new Date(date);
  const retroceso = (d.getDay() + 6) % 7; // lunes → 0, domingo → 6
  d.setDate(d.getDate() - retroceso);
  return fechaLocal(d);
}

// Los 7 días (lunes a domingo) de la semana de `date`, en "YYYY-MM-DD"
export function diasDeLaSemana(date = new Date()) {
  const [a, m, d] = inicioSemana(date).split("-").map(Number);
  return Array.from({ length: 7 }, (_, i) => fechaLocal(new Date(a, m - 1, d + i)));
}

// El día anterior a una fecha "YYYY-MM-DD"
export function diaAnterior(fecha) {
  const [a, m, d] = fecha.split("-").map(Number);
  return fechaLocal(new Date(a, m - 1, d - 1));
}
