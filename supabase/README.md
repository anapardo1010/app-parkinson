# Supabase (después de la demo)

Aquí vivirán las migraciones de la base en la nube y las funciones del servidor.
El esquema parte de `src/data/esquema.ts`, traducido a PostgreSQL, más:

- Funciones `puede_ver(paciente_id)` y `puede_registrar(paciente_id)`.
- Reglas Row Level Security en cada tabla de salud.
- Disparadores que llenan `registrado_por` y `fuente`, verifican `paciente_id` contra la tabla padre
  y escriben en `bitacora_acceso`.
- Función para validar códigos de invitación (huella, vigencia de 48 horas, un solo uso).

Ver "Inicio de sesión y pertenencia de los datos" en la definición técnica.
