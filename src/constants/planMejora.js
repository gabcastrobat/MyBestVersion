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

// Datos iniciales: solo se usan la primera vez que se abre la pantalla.
// Ojo: esto vive en el código (y en GitHub). Lo personal se agrega desde la
// app, que lo guarda solo en el celular con AsyncStorage.
export const PLAN_INICIAL = {
  victorias: [
    { nombre: "Dejar las gafas al lado del teclado", hecha: false },
    { nombre: "Armar rutina de cuidado personal (piel y cabello)", hecha: false },
    { nombre: "Definir los 3 días fijos de gym", hecha: false },
  ],
  habitos: [
    {
      nombre: "Entrenamiento de fuerza",
      minimo: "1 serie de cada ejercicio",
      area: "Cuerpo",
      metaSemanal: 3,
    },
    {
      nombre: "Celular fuera del cuarto + leer",
      minimo: "Leer 1 página",
      area: "Atención",
      metaSemanal: 7,
    },
    {
      nombre: "Inglés 20 min (discografía con letras)",
      minimo: "5 minutos",
      area: "Futuro",
      metaSemanal: 7,
    },
  ],
  cola: [
    { nombre: "Salir 1 vez por semana con gente", area: "Social" },
    { nombre: "Mejorar habilidades sociales", area: "Social" },
    { nombre: "Terminar la app de control de tiempo", area: "Futuro" },
    { nombre: "Cobrar las clases de Excel / tutorías", area: "Futuro" },
    { nombre: "1 día a la semana trabajando solo en Linux", area: "Futuro" },
    { nombre: "Ejercicios de lógica de programación", area: "Futuro" },
    { nombre: "Idear un proyecto más ambicioso", area: "Futuro" },
    { nombre: "Ser más organizado", area: "Atención" },
    { nombre: "Conseguir un estilo propio", area: "Cuerpo" },
    { nombre: "Discografía completa de un artista", area: "Ocio" },
    { nombre: "Subir de rango en Rivals", area: "Ocio" },
  ],
};
