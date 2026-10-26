# Spec 008 — Primer uso

Estado: **implementado en la demo**

## Para quién

Persona con Parkinson que acaba de instalar la app (en la demo: Rosa Hernández).

## Qué debe hacer

1. Después del consentimiento, mostrar el cuestionario "Conocerle mejor" con una bienvenida. Se puede omitir.
2. Llegar a "Hoy" casi vacía, con una lista de **primeros pasos**: conocerle mejor, agregar medicamentos y agregar la próxima cita.
3. Agregar un medicamento: elegirlo del catálogo, cantidad por toma, unidad y horarios (botones grandes, se pueden elegir varios).
4. Agregar una cita: especialidad, día, hora, médico y lugar (estos dos opcionales).
5. Al guardar el primer medicamento en el celular, programar los recordatorios (pide permiso de notificaciones).
6. La lista de primeros pasos desaparece cuando los tres están listos.
7. Desde "Tratamiento" se pueden agregar más medicamentos y citas.

## Reglas

| Regla | Valor |
| --- | --- |
| Inicio del tratamiento | Momento en que se guarda; las dosis anteriores de ese día no se programan ni cuentan como omitidas |
| Sin dosis hoy | "Hoy" muestra la primera dosis de mañana |
| Quién puede agregar | El paciente o un acompañante con "ver y registrar" (la base lo verifica) |
| Demo | Los formularios vienen **prellenados** con ejemplos (`src/features/tratamiento/ejemplos.ts`); en la app real empiezan vacíos |

## Criterios de aceptación

- [x] Rosa empieza sin tratamiento, sin citas y con los tres pasos pendientes.
- [x] Un medicamento nuevo no genera dosis anteriores al momento en que se agregó.
- [x] Un acompañante de solo lectura o una persona ajena no puede agregar tratamiento.
- [x] Pruebas automáticas en `tests/primerUso.test.ts`.

## Pendiente de definir

- Preguntas finales de "Conocerle mejor" (neurólogo).
- Catálogo real de medicamentos y si se permite escribir uno que no esté en la lista.
- Editar o suspender un medicamento (siempre como registro nuevo, nunca borrando).
- Recordatorio de citas el día anterior.
