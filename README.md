# 📱 MyBestVersion

App de productividad personal (React Native + Expo SDK 54 + Expo Router).
Hábitos con recordatorios diarios, tareas, gastos y perfil, todo guardado en el
dispositivo con AsyncStorage.

## Módulos

| Tab      | Qué hace |
| -------- | -------- |
| Hoy      | Progreso del día con cuy motivador, lista única de hábitos y tareas marcables, gasto de hoy |
| Más      | Menú con Mi plan, Gym, Alarmas, Gastos y Perfil (las pestañas de la barra son Hoy, Hábitos, Tareas, Calendario y Más) |
| Hábitos  | Rutinas y hábitos ancla unificados: hora con recordatorio diario (opcional), versión mínima, meta de días por semana y máx. 3 hábitos ancla; incluye la cola de metas por área y el historial |
| Tareas   | Tareas con prioridad; al cambiar de día se limpian las ya completadas |
| Gastos   | Gastos por Hoy / Semana / Mes con gráfico por categoría |
| Perfil   | Nombre, email, teléfono y foto |
| Mi plan  | Victorias rápidas y revisión semanal (acceso desde Más) |

## Arquitectura

```
src/storage/*  →  src/hooks/use*.js  →  app/*.jsx
 (AsyncStorage)     (lógica + useFocusEffect)   (solo render)
```

Los hooks usan `useFocusEffect`, así que cada tab se refresca al volver a él.

### Hábitos

Un hábito unifica lo que antes eran las rutinas y los hábitos ancla. Todo vive en
una sola clave (`plan_mejora`, ver `src/storage/plan.js`) y marcar un hábito
escribe siempre en `dias[fecha]`, sin estado que reiniciar cada día. La primera
vez que se abre la app tras la actualización se migra solo: las rutinas pasan a
hábitos conservando su id (y su recordatorio) y su racha se reconstruye desde el
historial. Quedan copias en `plan_mejora_backup_v1` y `rutinas_backup_v1`.

## Desarrollo

```bash
npm install
npx expo start
```

## Generar el APK (EAS Build)

```bash
npx eas-cli login
npx eas-cli build -p android --profile preview
```

- `preview` → `.apk` instalable directo (`android.buildType: "apk"`)
- `production` → `.aab` para Play Store

Las notificaciones de rutinas solo se pueden probar completas en el APK, no en Expo Go.
