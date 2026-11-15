// Configuración del Plan de mejora: las 5 áreas y los datos con los que arranca.
//
// Mismo formato que categoriaConfig en Rutinas ({ nombre: { icon, color } })
// para poder reutilizar <CategoriaGrid> sin cambiarle nada.
export const AREAS = {
  Cuerpo: { icon: "body-outline", color: "#ff6b6b" },
  Atención: { icon: "eye-outline", color: "#ffaa00" },
  Social: { icon: "people-outline", color: "#44ccff" },
  Futuro: { icon: "rocket-outline", color: "#4488ff" },
  Ocio: { icon: "game-controller-outline", color: "#aa44ff" },
};

// Categorías de un hábito: las de las antiguas rutinas + las áreas del plan,
// en un solo mapa. Así los hábitos migrados conservan su categoría original.
export const CATEGORIAS = {
  General: { icon: "star-outline", color: "#888888" },
  Ejercicio: { icon: "barbell-outline", color: "#ff6b6b" },
  Estudio: { icon: "book-outline", color: "#4488ff" },
  Agua: { icon: "water-outline", color: "#44ccff" },
  Entretenimiento: { icon: "game-controller-outline", color: "#aa44ff" },
  ...AREAS,
};

// La regla de oro: como máximo 3 hábitos ancla activos a la vez.
// Para meter uno nuevo, otro tiene que volverse automático primero.
export const MAX_ANCLAS = 3;

// Datos con los que arranca una instalación nueva: vacío.
// La app es para cualquier persona, así que cada quien agrega sus hábitos,
// metas y victorias desde la app (se guardan solo en su teléfono). Nada
// personal debe vivir aquí: este archivo va al repositorio y a la tienda.
//
// Formato, por si algún día se quieren ejemplos genéricos:
//   victorias: [{ nombre, hecha: false }]
//   habitos:   [{ nombre, minimo, area, metaSemanal }]   (area = clave de AREAS)
//   cola:      [{ nombre, area }]
export const PLAN_INICIAL = {
  victorias: [],
  habitos: [],
  cola: [],
};
