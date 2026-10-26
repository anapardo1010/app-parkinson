/**
 * Esquema de la base de datos (versión 1).
 *
 * Mismo modelo que se usará en Supabase (PostgreSQL). En la demo corre en SQLite,
 * dentro del celular. Reglas del modelo (ver "Modelo de datos" en la definición técnica):
 *  - Una tabla, un concepto.
 *  - Catálogos en lugar de listas fijas: agregar una opción es insertar una fila.
 *  - Cuestionarios como datos (instrumento → pregunta → opcion_respuesta; aplicacion → respuesta).
 *  - Nunca se borra físicamente: columna eliminado_en.
 *  - Los registros clínicos solo se agregan; una corrección crea un registro nuevo.
 *  - Toda tabla de salud lleva paciente_id directamente (para las reglas de acceso).
 */

const comunes = `
  creado_en      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')),
  actualizado_en TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')),
  eliminado_en   TEXT`;

const catalogo = (nombre: string) => `
CREATE TABLE IF NOT EXISTS ${nombre} (
  codigo   TEXT PRIMARY KEY,
  etiqueta TEXT NOT NULL,
  orden    INTEGER NOT NULL DEFAULT 0,
  activo   INTEGER NOT NULL DEFAULT 1
);`;

export const CATALOGOS = [
  'parentesco',
  'permiso',
  'estado_toma',
  'motivo_omision',
  'unidad_dosis',
  'especialidad',
  'tipo_consentimiento',
  'tipo_contenido',
  'categoria_directorio',
  'estado',
  'tipo_instrumento',
  'tipo_respuesta',
] as const;

export const ESQUEMA_V1 = `
PRAGMA foreign_keys = ON;

${CATALOGOS.map(catalogo).join('\n')}

-- ============ Personas y acceso ============

CREATE TABLE IF NOT EXISTS usuario (
  id        TEXT PRIMARY KEY,
  auth_id   TEXT UNIQUE,             -- cuenta de inicio de sesión (Supabase Auth)
  nombre    TEXT NOT NULL,
  correo    TEXT,
  telefono  TEXT,${comunes}
);

CREATE TABLE IF NOT EXISTS paciente (
  id                TEXT PRIMARY KEY,
  usuario_id        TEXT REFERENCES usuario(id),   -- opcional: el paciente puede no tener cuenta
  nombre_preferido  TEXT NOT NULL,                 -- dato de identidad; nunca se exporta
  anio_nacimiento   INTEGER,
  sexo              TEXT,
  estado_codigo     TEXT REFERENCES estado(codigo),
  anio_diagnostico  INTEGER,${comunes}
);

CREATE TABLE IF NOT EXISTS vinculo_acompanante (
  id                TEXT PRIMARY KEY,
  paciente_id       TEXT NOT NULL REFERENCES paciente(id),
  usuario_id        TEXT NOT NULL REFERENCES usuario(id),
  parentesco_codigo TEXT REFERENCES parentesco(codigo),
  permiso_codigo    TEXT NOT NULL REFERENCES permiso(codigo),
  estado_vinculo    TEXT NOT NULL CHECK (estado_vinculo IN ('pendiente', 'activo', 'retirado')),
  revocado_en       TEXT,${comunes}
);

CREATE TABLE IF NOT EXISTS invitacion (
  id             TEXT PRIMARY KEY,
  paciente_id    TEXT NOT NULL REFERENCES paciente(id),
  codigo_hash    TEXT NOT NULL,
  permiso_codigo TEXT NOT NULL REFERENCES permiso(codigo),
  expira_en      TEXT NOT NULL,
  usado_en       TEXT,
  usado_por      TEXT REFERENCES usuario(id),${comunes}
);

CREATE TABLE IF NOT EXISTS documento_legal (
  id                         TEXT PRIMARY KEY,
  tipo_consentimiento_codigo TEXT NOT NULL REFERENCES tipo_consentimiento(codigo),
  version                    TEXT NOT NULL,
  vigente_desde              TEXT NOT NULL,
  resumen                    TEXT,${comunes},
  UNIQUE (tipo_consentimiento_codigo, version)
);

CREATE TABLE IF NOT EXISTS consentimiento (
  id                         TEXT PRIMARY KEY,
  usuario_id                 TEXT NOT NULL REFERENCES usuario(id),
  paciente_id                TEXT REFERENCES paciente(id),
  tipo_consentimiento_codigo TEXT NOT NULL REFERENCES tipo_consentimiento(codigo),
  documento_legal_id         TEXT NOT NULL REFERENCES documento_legal(id),
  otorgado                   INTEGER NOT NULL CHECK (otorgado IN (0, 1)),
  registrado_en              TEXT NOT NULL,${comunes}
);

-- ============ Tratamiento y adherencia ============

CREATE TABLE IF NOT EXISTS medicamento (
  id               TEXT PRIMARY KEY,
  nombre_generico  TEXT NOT NULL,
  nombre_comercial TEXT,
  presentacion     TEXT,${comunes}
);

CREATE TABLE IF NOT EXISTS prescripcion (
  id             TEXT PRIMARY KEY,
  paciente_id    TEXT NOT NULL REFERENCES paciente(id),
  medicamento_id TEXT NOT NULL REFERENCES medicamento(id),
  dosis_cantidad REAL NOT NULL,
  unidad_codigo  TEXT NOT NULL REFERENCES unidad_dosis(codigo),
  indicaciones   TEXT,
  fecha_inicio   TEXT NOT NULL,
  fecha_fin      TEXT,
  registrado_por TEXT REFERENCES usuario(id),${comunes}
);

CREATE TABLE IF NOT EXISTS horario_toma (
  id              TEXT PRIMARY KEY,
  paciente_id     TEXT NOT NULL REFERENCES paciente(id),
  prescripcion_id TEXT NOT NULL REFERENCES prescripcion(id),
  hora            TEXT NOT NULL,                      -- 'HH:MM'
  dias_semana     TEXT NOT NULL DEFAULT '0123456',    -- 0 = domingo${comunes}
);

CREATE TABLE IF NOT EXISTS dosis_programada (
  id                    TEXT PRIMARY KEY,
  paciente_id           TEXT NOT NULL REFERENCES paciente(id),
  horario_toma_id       TEXT NOT NULL REFERENCES horario_toma(id),
  fecha_hora_programada TEXT NOT NULL,                -- 'YYYY-MM-DDTHH:MM'${comunes},
  UNIQUE (horario_toma_id, fecha_hora_programada)
);

CREATE TABLE IF NOT EXISTS registro_toma (
  id                    TEXT PRIMARY KEY,
  paciente_id           TEXT NOT NULL REFERENCES paciente(id),
  dosis_programada_id   TEXT NOT NULL REFERENCES dosis_programada(id),
  estado_toma_codigo    TEXT NOT NULL REFERENCES estado_toma(codigo),
  hora_real             TEXT,
  motivo_omision_codigo TEXT REFERENCES motivo_omision(codigo),
  registrado_por        TEXT NOT NULL REFERENCES usuario(id),
  fuente                TEXT NOT NULL CHECK (fuente IN ('paciente', 'observado')),${comunes}
);

CREATE TABLE IF NOT EXISTS cita (
  id                   TEXT PRIMARY KEY,
  paciente_id          TEXT NOT NULL REFERENCES paciente(id),
  especialidad_codigo  TEXT REFERENCES especialidad(codigo),
  medico               TEXT,
  lugar                TEXT,
  fecha_hora           TEXT NOT NULL,
  recordatorio_minutos INTEGER,
  notas                TEXT,
  registrado_por       TEXT REFERENCES usuario(id),${comunes}
);

-- ============ Cuestionarios (los definen los especialistas) ============

CREATE TABLE IF NOT EXISTS instrumento (
  id                      TEXT PRIMARY KEY,
  codigo                  TEXT NOT NULL,
  nombre                  TEXT NOT NULL,
  version                 INTEGER NOT NULL,
  tipo_instrumento_codigo TEXT NOT NULL REFERENCES tipo_instrumento(codigo),
  frecuencia              TEXT,
  quien_responde          TEXT,
  licencia                TEXT,
  provisional             INTEGER NOT NULL DEFAULT 0,
  activo                  INTEGER NOT NULL DEFAULT 1,${comunes},
  UNIQUE (codigo, version)
);

CREATE TABLE IF NOT EXISTS pregunta (
  id                    TEXT PRIMARY KEY,
  instrumento_id        TEXT NOT NULL REFERENCES instrumento(id),
  orden                 INTEGER NOT NULL,
  texto                 TEXT NOT NULL,
  tipo_respuesta_codigo TEXT NOT NULL REFERENCES tipo_respuesta(codigo),
  minimo                REAL,
  maximo                REAL,
  etiqueta_minimo       TEXT,
  etiqueta_maximo       TEXT,
  obligatoria           INTEGER NOT NULL DEFAULT 1,${comunes}
);

CREATE TABLE IF NOT EXISTS opcion_respuesta (
  id          TEXT PRIMARY KEY,
  pregunta_id TEXT NOT NULL REFERENCES pregunta(id),
  orden       INTEGER NOT NULL,
  etiqueta    TEXT NOT NULL,
  valor       REAL,${comunes}
);

CREATE TABLE IF NOT EXISTS aplicacion (
  id             TEXT PRIMARY KEY,
  instrumento_id TEXT NOT NULL REFERENCES instrumento(id),
  paciente_id    TEXT NOT NULL REFERENCES paciente(id),
  registrado_por TEXT NOT NULL REFERENCES usuario(id),
  fuente         TEXT NOT NULL CHECK (fuente IN ('paciente', 'observado')),
  completado_en  TEXT NOT NULL,
  puntaje        REAL,${comunes}
);

CREATE TABLE IF NOT EXISTS respuesta (
  id             TEXT PRIMARY KEY,
  paciente_id    TEXT NOT NULL REFERENCES paciente(id),
  aplicacion_id  TEXT NOT NULL REFERENCES aplicacion(id),
  pregunta_id    TEXT NOT NULL REFERENCES pregunta(id),
  opcion_id      TEXT REFERENCES opcion_respuesta(id),
  valor_numerico REAL,
  valor_texto    TEXT,${comunes}
);

-- ============ Contenido y directorio ============

CREATE TABLE IF NOT EXISTS contenido (
  id                    TEXT PRIMARY KEY,
  tipo_contenido_codigo TEXT NOT NULL REFERENCES tipo_contenido(codigo),
  titulo                TEXT NOT NULL,
  resumen               TEXT,
  enlace                TEXT,
  fuente                TEXT,
  anio                  INTEGER,
  duracion_min          INTEGER,
  estado_publicacion    TEXT NOT NULL CHECK (estado_publicacion IN ('borrador', 'revisado', 'publicado')),
  revisado_por          TEXT,
  publicado_en          TEXT,${comunes}
);

CREATE TABLE IF NOT EXISTS contacto_directorio (
  id                 TEXT PRIMARY KEY,
  categoria_codigo   TEXT NOT NULL REFERENCES categoria_directorio(codigo),
  nombre             TEXT NOT NULL,
  descripcion        TEXT,
  telefono           TEXT,
  horario            TEXT,
  estado_codigo      TEXT REFERENCES estado(codigo),
  sitio_web          TEXT,
  verificado_en      TEXT,
  estado_publicacion TEXT NOT NULL CHECK (estado_publicacion IN ('borrador', 'revisado', 'publicado')),${comunes}
);

CREATE TABLE IF NOT EXISTS reporte_contacto (
  id          TEXT PRIMARY KEY,
  contacto_id TEXT NOT NULL REFERENCES contacto_directorio(id),
  usuario_id  TEXT REFERENCES usuario(id),
  comentario  TEXT,${comunes}
);

-- ============ Auditoría e investigación ============

CREATE TABLE IF NOT EXISTS bitacora_acceso (
  id          TEXT PRIMARY KEY,
  usuario_id  TEXT REFERENCES usuario(id),
  paciente_id TEXT REFERENCES paciente(id),
  accion      TEXT NOT NULL,
  tabla       TEXT NOT NULL,
  registro_id TEXT,
  ocurrido_en TEXT NOT NULL,${comunes}
);

CREATE TABLE IF NOT EXISTS exportacion_investigacion (
  id            TEXT PRIMARY KEY,
  fecha         TEXT NOT NULL,
  version       TEXT NOT NULL,
  participantes INTEGER NOT NULL,
  aprobado_por  TEXT,${comunes}
);

-- ============ Índices ============

CREATE INDEX IF NOT EXISTS ix_dosis_paciente_fecha ON dosis_programada (paciente_id, fecha_hora_programada);
CREATE INDEX IF NOT EXISTS ix_registro_dosis ON registro_toma (dosis_programada_id, creado_en);
CREATE INDEX IF NOT EXISTS ix_aplicacion_paciente ON aplicacion (paciente_id, instrumento_id, completado_en);
CREATE INDEX IF NOT EXISTS ix_vinculo_usuario ON vinculo_acompanante (usuario_id, estado_vinculo);
`;

/** Las 22 tablas del modelo (sin contar catálogos). Se usa en pruebas. */
export const TABLAS = [
  'usuario', 'paciente', 'vinculo_acompanante', 'invitacion', 'documento_legal', 'consentimiento',
  'medicamento', 'prescripcion', 'horario_toma', 'dosis_programada', 'registro_toma', 'cita',
  'instrumento', 'pregunta', 'opcion_respuesta', 'aplicacion', 'respuesta',
  'contenido', 'contacto_directorio', 'reporte_contacto',
  'bitacora_acceso', 'exportacion_investigacion',
] as const;
