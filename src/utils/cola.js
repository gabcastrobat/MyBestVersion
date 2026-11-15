// Cola de operaciones: ejecuta funciones async DE UNA EN UNA, en orden.
//
// ¿Para qué? Guardar en AsyncStorage es "leer todo → cambiar → escribir todo".
// Si dos cambios arrancan casi a la vez (dos toques rápidos), ambos leen la
// misma versión vieja y el segundo en escribir borra el cambio del primero.
// Poniéndolos en cola, cada uno lee lo que dejó el anterior.
//
// Uso:
//   const enSerie = crearCola();
//   export const guardarAlgo = enSerie(async (dato) => { ... });
export function crearCola() {
  let ultima = Promise.resolve();
  return (fn) =>
    (...args) => {
      const resultado = ultima.then(() => fn(...args));
      // Si esta operación falla, la cola sigue con la siguiente
      ultima = resultado.catch(() => {});
      return resultado;
    };
}
