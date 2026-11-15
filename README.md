# 📱 MyBestVersion

App de productividad personal (React Native + Expo SDK 54 + Expo Router).
Rutinas con recordatorios diarios, tareas, gastos y perfil, todo guardado en el
dispositivo con AsyncStorage.

## Módulos

| Tab      | Qué hace |
| -------- | -------- |
| Home     | Progreso del día (rutinas + tareas), cuy motivador, gasto de hoy |
| Rutinas  | Rutinas diarias con notificación diaria y reset automático cada día |
| Tareas   | Tareas con prioridad; al cambiar de día se limpian las ya completadas |
| Gastos   | Gastos por Hoy / Semana / Mes con gráfico por categoría |
| Perfil   | Nombre, email, teléfono y foto |

## Arquitectura

```
src/storage/*  →  src/hooks/use*.js  →  app/*.jsx
 (AsyncStorage)     (lógica + useFocusEffect)   (solo render)
```

Los hooks usan `useFocusEffect`, así que cada tab se refresca al volver a él.

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
