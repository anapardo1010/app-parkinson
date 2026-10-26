# Spec 001 — Registro de dosis y adherencia

Estado: **implementado en la demo**

## Para quién

- Persona con Parkinson.
- Acompañante con permiso "ver y registrar".

## Qué debe hacer

1. Mostrar en "Hoy" la próxima dosis pendiente (medicamento, cantidad, presentación y hora).
2. Registrar la dosis con un toque ("Ya la tomé") o con más detalle: tomada a tiempo, tomada tarde o no tomada.
3. Si no se tomó, preguntar el motivo de forma opcional: la olvidé, efectos secundarios, se me acabó, otro.
4. Permitir deshacer el último registro.
5. Calcular adherencia, puntualidad y clasificación (ver reglas).
6. Mostrar un calendario mensual con el estado de cada día.

## Reglas

| Regla | Valor |
| --- | --- |
| Adherencia | Dosis tomadas (a tiempo o tarde) ÷ dosis programadas que ya debieron tomarse |
| Puntualidad | Dosis tomadas dentro de ±30 minutos ÷ dosis programadas |
| Clasificación | ≥ 80 % buena · 50–79 % parcial · < 50 % baja |
| Dosis pasada sin registro | Cuenta como no tomada |
| Día completo | Todas las dosis pasadas tomadas a tiempo |
| Día parcial | Al menos una tomada, pero alguna tarde o faltante |
| Día omitido | Ninguna tomada |

## Criterios de aceptación

- [x] Registrar una dosis toma como máximo 2 toques.
- [x] Un acompañante de solo lectura no puede registrar (la base lo rechaza, no solo la pantalla).
- [x] Lo registrado por un acompañante queda con `fuente = observado` y su autoría.
- [x] Deshacer marca el registro como eliminado; nunca lo borra.
- [x] Cada día del calendario muestra color, marca y texto accesible.
- [x] Pruebas automáticas cubren las reglas de cálculo (`tests/adherencia.test.ts`).

## Fuera de alcance

- Ventana de puntualidad distinta por medicamento (la puede pedir el neurólogo).
- Registro desde el botón "Tomada" de la notificación sin abrir la app: implementado de forma básica, falta probar en celulares reales.
