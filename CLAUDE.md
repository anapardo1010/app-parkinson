# Contexto para asistentes de código

App de seguimiento y divulgación sobre Parkinson (proyecto de investigación doctoral, México).
Lee también `AGENTS.md` (reglas de Expo SDK 58) y `docs/constitucion.md` (reglas del proyecto).

## Reglas que no se negocian

1. **Accesibilidad:** texto de 16 px o más (18 px en cuerpo), zonas táctiles de 56 px o más,
   solo toques simples, ningún estado comunicado solo con color.
2. **Privacidad:** todo acceso a datos de salud pasa por `exigir(...)` en `src/data/repositorio.ts`
   (equivalente a `puede_ver` / `puede_registrar`). Nunca consultar tablas de salud sin verificar.
3. **Autoría:** `registrado_por` y `fuente` los calcula el repositorio, nunca la pantalla.
4. **Nunca borrar físicamente:** usar `eliminado_en`. Los registros clínicos solo se agregan.
5. **Cuestionarios como datos:** no crear columnas para preguntas; usar `src/config/cuestionarios`.
6. **Sin internet:** recordatorios y registro de dosis deben funcionar sin conexión.
7. **Lenguaje:** español de México, trato de "usted", frases cortas.

## Convenciones

- Código y nombres en español.
- Colores y tipografía solo desde `src/theme`.
- Fechas locales como texto ISO sin zona (`src/lib/fechas.ts`).
- Cada funcionalidad nueva empieza con un spec en `specs/NNN-nombre/`.
- Antes de terminar: `npm run typecheck` y `npm test`.
