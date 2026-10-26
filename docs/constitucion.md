# Constitución del proyecto

Reglas que todo spec, plan y cambio de código debe respetar. Si un spec las contradice, gana la constitución.

## 1. Primero un servicio

La app existe para ayudar a la persona con Parkinson y a su familia. La investigación es una consecuencia
de la confianza, nunca una condición para usar la app.

## 2. Accesibilidad

- Diseñada para adultos mayores y personas con temblor.
- Texto de cuerpo de 18 px; nada por debajo de 13 px.
- Zonas táctiles de al menos 56 × 56 px y separadas.
- Solo toques simples: nada de deslizar, arrastrar, doble toque ni mantener presionado.
- Todo estado se comunica con color, ícono y texto.
- Toda acción se puede deshacer.

## 3. Privacidad

- Los datos de salud son datos sensibles (LFPDPPP 2025).
- Usar la app y donar datos a la investigación son consentimientos separados.
- Cada persona ve solo sus datos o los de quien acompaña con un vínculo activo.
- Lo que registra un acompañante se guarda como "observado".
- Las notificaciones no muestran el nombre del medicamento.
- Nunca se venden datos.

## 4. Lo que la app no hace

No diagnostica, no recomienda dosis, no sustituye al médico, no atiende emergencias.

## 5. Datos

- Una tabla, un concepto. Catálogos en lugar de listas fijas.
- Cuestionarios como datos, versionados.
- Nunca se borra físicamente; los registros clínicos solo se agregan.
- Toda tabla de salud lleva `paciente_id`.

## 6. Funciona sin internet

Recordatorios, registro de dosis y consulta del directorio no dependen de la conexión.

## 7. Decisiones de especialistas

Lo que deben definir el neurólogo, el psicólogo o el asesor legal se marca como **provisional**
en el código y en la interfaz hasta que lo definan.
