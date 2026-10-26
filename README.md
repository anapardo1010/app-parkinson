# App Parkinson — demo

Demo de la app de seguimiento y divulgación sobre Parkinson. Funciona **solo en el celular**, con
**datos ficticios** y sin servicios en la nube.

> Ningún dato de esta demo corresponde a una persona real.

## Cómo verla en tu celular

1. Instala **Expo Go** desde App Store o Google Play (versión para SDK 58).
2. En tu computadora, con Node 20 o superior:

   ```bash
   npm install
   npx expo start
   ```

3. Escanea el código QR con la cámara (iPhone) o con Expo Go (Android).

También puedes verla en el navegador con `npx expo start --web`.

## Qué incluye

| Pantalla | Qué muestra |
| --- | --- |
| Bienvenida → Entrar | Selector para entrar como María (paciente), Juan (acompañante, ver y registrar) o Laura (acompañante, solo ver) |
| Consentimiento | Aviso de privacidad y, por separado, la participación opcional en investigación |
| Hoy | Próxima dosis, "Ya la tomé" con deshacer, ánimo del día y avance |
| Registro de dosis | Tomada, tomada tarde o no tomada con motivo |
| Tratamiento | Medicamentos con horarios y citas |
| Mi evolución | Ánimo, adherencia y puntualidad, síntomas (provisional) |
| Calendario | Adherencia por día con color, marca y texto |
| Aprende y Directorio | Contenido de ejemplo y directorio con espacios para teléfonos |
| Perfil y Acompañantes | Invitar con código, retirar acompañantes, recordatorios, investigación, reiniciar demo |

## Estructura

```
src/
├── app/                    Pantallas (Expo Router: cada archivo es una ruta)
├── components/             Botones, textos, íconos y gráficas reutilizables
├── config/cuestionarios/   Cuestionarios en JSON (ánimo, síntomas, perfil inicial)
├── data/
│   ├── esquema.ts          Las 22 tablas del modelo + catálogos
│   ├── semilla.ts          Datos ficticios de la demo
│   ├── repositorio.ts      Consultas; cada una verifica permisos
│   └── db/                 Conexión: expo-sqlite (celular) y sql.js (web)
├── features/
│   ├── adherencia/         Cálculo de adherencia y puntualidad (definido)
│   ├── permisos/           puede_ver / puede_registrar (mismas reglas que tendrá Supabase)
│   └── cuestionarios/      Lectura de los cuestionarios configurables
├── notifications/          Recordatorios locales
├── session/                Sesión de la demo
└── theme/                  Colores, tipografía y espacios
docs/                       Constitución del proyecto
specs/                      Specs para spec-driven development
tests/                      Pruebas de adherencia, permisos y base de datos
```

## Cuestionarios del neurólogo y del psicólogo

Los cuestionarios **no están en el código**: viven en `src/config/cuestionarios/*.json`.
Para cambiar uno, se edita su archivo, se sube `version` y se marca `"provisional": false`.
Al abrir la app, se carga en las tablas `instrumento`, `pregunta` y `opcion_respuesta`.
Las respuestas anteriores quedan ligadas a la versión que se contestó.

## Comandos

```bash
npm test            # pruebas
npm run typecheck   # verificación de tipos
npm run export:web  # versión web estática en dist/
```

## Pendiente para producción

- Conectar Supabase (inicio de sesión real con código por correo y reglas Row Level Security).
- Sincronización entre el celular y la nube.
- Instrumentos definitivos de los especialistas y reporte en PDF para el médico.
- Textos legales del asesor y el comité de ética.
