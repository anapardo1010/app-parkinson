import { DosisConEstado, EstadoToma } from '@/features/adherencia/calculo';
import { puntajeSimple } from '@/features/cuestionarios/definicion';
import {
  AccesoDenegado,
  fuenteDeRegistro,
  PacienteRef,
  Permiso,
  puedeAdministrar,
  puedeRegistrar,
  puedeVer,
  VinculoRef,
} from '@/features/permisos/permisos';
import { fechaISO, sumarDias } from '@/lib/fechas';
import { huella, nuevoId } from '@/lib/id';
import type { Db } from './db/tipos';
import { ESQUEMA_V1 } from './esquema';
import { cargarInstrumentos, DEMO, insertar, sembrarDatosDemo, sembrarPrimerUso } from './semilla';

/**
 * Acceso a datos. Cada función que toca datos de salud verifica primero los permisos,
 * igual que lo harán las reglas por fila (Row Level Security) en Supabase.
 */

const AHORA_SQL = "strftime('%Y-%m-%dT%H:%M:%S', 'now', 'localtime')";

/* ============ Arranque ============ */

export async function prepararBase(db: Db) {
  const fila = await db.primero<{ user_version: number }>('PRAGMA user_version');
  if (!fila || fila.user_version < 1) {
    await db.ejecutar(ESQUEMA_V1);
    await db.transaccion(() => sembrarDatosDemo(db));
    await db.ejecutar('PRAGMA user_version = 1');
  } else {
    // Los cuestionarios se recargan siempre: si un especialista sube una versión nueva, entra sola.
    await db.transaccion(() => cargarInstrumentos(db));
  }
  const version = (await db.primero<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  if (version < 2) {
    // Versión 2: persona de "primer uso". Se agrega también a las bases que ya existían.
    await db.transaccion(() => sembrarPrimerUso(db));
    await db.ejecutar('PRAGMA user_version = 2');
  }
  const pacientes = await db.todos<{ id: string }>('SELECT id FROM paciente WHERE eliminado_en IS NULL');
  for (const p of pacientes) await asegurarDosis(db, p.id, new Date(), 2);
}

/* ============ Permisos (equivalente a puede_ver / puede_registrar) ============ */

async function cargarReglas(db: Db, pacienteId: string) {
  const p = await db.primero<{ id: string; usuario_id: string | null }>(
    'SELECT id, usuario_id FROM paciente WHERE id = ? AND eliminado_en IS NULL',
    [pacienteId],
  );
  if (!p) throw new AccesoDenegado('consultar este paciente');
  const vinculos = await db.todos<{ usuario_id: string; permiso_codigo: Permiso; estado_vinculo: VinculoRef['estado'] }>(
    'SELECT usuario_id, permiso_codigo, estado_vinculo FROM vinculo_acompanante WHERE paciente_id = ? AND eliminado_en IS NULL',
    [pacienteId],
  );
  const paciente: PacienteRef = { id: p.id, usuarioId: p.usuario_id };
  const refs: VinculoRef[] = vinculos.map((v) => ({
    pacienteId, usuarioId: v.usuario_id, permiso: v.permiso_codigo, estado: v.estado_vinculo,
  }));
  return { paciente, vinculos: refs };
}

async function exigir(db: Db, usuarioId: string, pacienteId: string, nivel: 'ver' | 'registrar' | 'administrar') {
  const { paciente, vinculos } = await cargarReglas(db, pacienteId);
  const ok =
    nivel === 'ver' ? puedeVer(usuarioId, paciente, vinculos)
      : nivel === 'registrar' ? puedeRegistrar(usuarioId, paciente, vinculos)
        : puedeAdministrar(usuarioId, paciente);
  if (!ok) throw new AccesoDenegado(nivel === 'ver' ? 'ver estos datos' : nivel === 'registrar' ? 'registrar datos de este paciente' : 'administrar a este paciente');
  return paciente;
}

async function bitacora(db: Db, usuarioId: string, pacienteId: string, accion: string, tabla: string, registroId: string) {
  await insertar(db, 'bitacora_acceso', {
    id: nuevoId(), usuario_id: usuarioId, paciente_id: pacienteId, accion, tabla, registro_id: registroId,
    ocurrido_en: new Date().toISOString(),
  });
}

/* ============ Sesión (demo) ============ */

export type AccesoPaciente = {
  pacienteId: string;
  nombre: string;
  rol: 'paciente' | 'acompanante';
  permiso: Permiso | 'propio';
  parentesco: string | null;
  puedeRegistrar: boolean;
  puedeAdministrar: boolean;
};

export type ContextoUsuario = { usuarioId: string; nombre: string; pacientes: AccesoPaciente[] };

export async function contextoDeUsuario(db: Db, usuarioId: string): Promise<ContextoUsuario> {
  const u = await db.primero<{ nombre: string }>('SELECT nombre FROM usuario WHERE id = ?', [usuarioId]);
  const propios = await db.todos<{ id: string; nombre_preferido: string }>(
    'SELECT id, nombre_preferido FROM paciente WHERE usuario_id = ? AND eliminado_en IS NULL',
    [usuarioId],
  );
  const acompanados = await db.todos<{ paciente_id: string; nombre_preferido: string; permiso_codigo: Permiso; parentesco: string | null }>(
    `SELECT v.paciente_id, p.nombre_preferido, v.permiso_codigo, pa.etiqueta AS parentesco
       FROM vinculo_acompanante v
       JOIN paciente p ON p.id = v.paciente_id
       LEFT JOIN parentesco pa ON pa.codigo = v.parentesco_codigo
      WHERE v.usuario_id = ? AND v.estado_vinculo = 'activo' AND v.eliminado_en IS NULL`,
    [usuarioId],
  );
  return {
    usuarioId,
    nombre: u?.nombre ?? '',
    pacientes: [
      ...propios.map<AccesoPaciente>((p) => ({
        pacienteId: p.id, nombre: p.nombre_preferido, rol: 'paciente', permiso: 'propio', parentesco: null,
        puedeRegistrar: true, puedeAdministrar: true,
      })),
      ...acompanados.map<AccesoPaciente>((a) => ({
        pacienteId: a.paciente_id, nombre: a.nombre_preferido, rol: 'acompanante', permiso: a.permiso_codigo,
        parentesco: a.parentesco, puedeRegistrar: a.permiso_codigo === 'ver_registrar', puedeAdministrar: false,
      })),
    ],
  };
}

export type UsuarioDemo = { id: string; nombre: string; descripcion: string; grupo: 'primer_uso' | 'con_historial'; esPaciente: boolean };

export async function usuariosDemo(db: Db): Promise<UsuarioDemo[]> {
  const usuarios = await db.todos<{ id: string; nombre: string }>('SELECT id, nombre FROM usuario WHERE eliminado_en IS NULL ORDER BY creado_en, id');
  const lista: UsuarioDemo[] = [];
  for (const u of usuarios) {
    const ctx = await contextoDeUsuario(db, u.id);
    const acceso = ctx.pacientes[0];
    const primerUso = u.id === DEMO.rosa;
    const descripcion = !acceso
      ? 'Sin pacientes vinculados'
      : acceso.rol === 'paciente'
        ? primerUso ? 'Persona con Parkinson · acaba de instalar la app' : 'Persona con Parkinson · 30 días de uso'
        : `Acompaña a ${acceso.nombre} · ${acceso.permiso === 'ver_registrar' ? 'ver y registrar' : 'solo ver'}`;
    lista.push({
      id: u.id, nombre: u.nombre, descripcion, grupo: primerUso ? 'primer_uso' : 'con_historial', esPaciente: acceso?.rol === 'paciente',
    });
  }
  return lista.sort((a, b) => Number(b.esPaciente) - Number(a.esPaciente));
}

/* ============ Consentimientos ============ */

export type EstadoConsentimiento = { aviso: boolean | null; investigacion: boolean | null };

export async function estadoConsentimiento(db: Db, usuarioId: string): Promise<EstadoConsentimiento> {
  const ultimo = async (tipo: string) => {
    const f = await db.primero<{ otorgado: number }>(
      `SELECT otorgado FROM consentimiento WHERE usuario_id = ? AND tipo_consentimiento_codigo = ? AND eliminado_en IS NULL
        ORDER BY registrado_en DESC, rowid DESC LIMIT 1`,
      [usuarioId, tipo],
    );
    return f ? f.otorgado === 1 : null;
  };
  return { aviso: await ultimo('aviso_privacidad'), investigacion: await ultimo('investigacion') };
}

/** Se agrega un registro nuevo cada vez: el historial de consentimientos nunca se sobrescribe. */
export async function registrarConsentimiento(
  db: Db, usuarioId: string, pacienteId: string | null, tipo: 'aviso_privacidad' | 'investigacion', otorgado: boolean,
) {
  if (tipo === 'investigacion' && pacienteId) await exigir(db, usuarioId, pacienteId, 'administrar');
  const doc = await db.primero<{ id: string }>(
    'SELECT id FROM documento_legal WHERE tipo_consentimiento_codigo = ? ORDER BY vigente_desde DESC LIMIT 1',
    [tipo],
  );
  await insertar(db, 'consentimiento', {
    id: nuevoId(), usuario_id: usuarioId, paciente_id: pacienteId, tipo_consentimiento_codigo: tipo,
    documento_legal_id: doc?.id ?? null, otorgado, registrado_en: new Date().toISOString(),
  });
}

/* ============ Dosis y adherencia ============ */

/** Crea las dosis programadas de los próximos días a partir de los horarios activos. */
export async function asegurarDosis(db: Db, pacienteId: string, desde: Date, dias: number) {
  const horarios = await db.todos<{ id: string; hora: string; dias_semana: string; fecha_inicio: string; fecha_fin: string | null }>(
    `SELECT h.id, h.hora, h.dias_semana, p.fecha_inicio, p.fecha_fin
       FROM horario_toma h JOIN prescripcion p ON p.id = h.prescripcion_id
      WHERE h.paciente_id = ? AND h.eliminado_en IS NULL AND p.eliminado_en IS NULL`,
    [pacienteId],
  );
  for (let i = 0; i < dias; i++) {
    const dia = sumarDias(desde, i);
    const fecha = fechaISO(dia);
    for (const h of horarios) {
      if (!h.dias_semana.includes(String(dia.getDay()))) continue;
      const programada = `${fecha}T${h.hora}`;
      // fecha_inicio puede traer hora: un tratamiento agregado a las 10:30 no genera la dosis de las 8:00 de ese día.
      if (programada < h.fecha_inicio || (h.fecha_fin && h.fecha_fin < fecha)) continue;
      await insertar(db, 'dosis_programada', {
        id: `dos-${h.id}-${fecha}`, paciente_id: pacienteId, horario_toma_id: h.id, fecha_hora_programada: programada,
      });
    }
  }
}

export type DosisDetalle = DosisConEstado & {
  medicamento: string;
  presentacion: string | null;
  cantidad: number;
  unidad: string;
  registradoPor: string | null;
  fuente: 'paciente' | 'observado' | null;
};

const SQL_DOSIS = `
  SELECT d.id, d.fecha_hora_programada AS programada,
         m.nombre_generico AS medicamento, m.presentacion, p.dosis_cantidad AS cantidad, p.unidad_codigo AS unidad,
         r.estado_toma_codigo AS estado, r.hora_real AS horaReal, r.motivo_omision_codigo AS motivo,
         u.nombre AS registradoPor, r.fuente
    FROM dosis_programada d
    JOIN horario_toma h ON h.id = d.horario_toma_id
    JOIN prescripcion p ON p.id = h.prescripcion_id
    JOIN medicamento m ON m.id = p.medicamento_id
    LEFT JOIN registro_toma r ON r.id = (
         SELECT r2.id FROM registro_toma r2
          WHERE r2.dosis_programada_id = d.id AND r2.eliminado_en IS NULL
          ORDER BY r2.creado_en DESC, r2.rowid DESC LIMIT 1)
    LEFT JOIN usuario u ON u.id = r.registrado_por
   WHERE d.paciente_id = ? AND d.eliminado_en IS NULL`;

export async function dosisEnRango(db: Db, usuarioId: string, pacienteId: string, desde: string, hasta: string) {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.todos<DosisDetalle>(
    `${SQL_DOSIS} AND d.fecha_hora_programada >= ? AND d.fecha_hora_programada < ?
     ORDER BY d.fecha_hora_programada, m.nombre_generico`,
    [pacienteId, desde, hasta],
  );
}

export async function obtenerDosis(db: Db, usuarioId: string, dosisId: string) {
  const fila = await db.primero<{ paciente_id: string }>('SELECT paciente_id FROM dosis_programada WHERE id = ?', [dosisId]);
  if (!fila) return null;
  await exigir(db, usuarioId, fila.paciente_id, 'ver');
  return db.primero<DosisDetalle & { pacienteId: string }>(`${SQL_DOSIS} AND d.id = ?`, [fila.paciente_id, dosisId]);
}

export async function registrarToma(
  db: Db, usuarioId: string, dosisId: string, estado: EstadoToma, motivo: string | null = null,
) {
  const dosis = await db.primero<{ paciente_id: string }>('SELECT paciente_id FROM dosis_programada WHERE id = ?', [dosisId]);
  if (!dosis) throw new Error('Dosis no encontrada');
  const paciente = await exigir(db, usuarioId, dosis.paciente_id, 'registrar');
  const id = nuevoId();
  await insertar(db, 'registro_toma', {
    id,
    paciente_id: dosis.paciente_id,
    dosis_programada_id: dosisId,
    estado_toma_codigo: estado,
    hora_real: estado === 'no_tomada' ? null : localAhora(),
    motivo_omision_codigo: estado === 'no_tomada' ? motivo : null,
    registrado_por: usuarioId, // en producción lo pone el servidor, no la app
    fuente: fuenteDeRegistro(usuarioId, paciente),
  });
  await bitacora(db, usuarioId, dosis.paciente_id, 'crear', 'registro_toma', id);
  return id;
}

/** Deshacer = marcar como eliminado el último registro. Nunca se borra físicamente. */
export async function deshacerRegistro(db: Db, usuarioId: string, dosisId: string) {
  const dosis = await db.primero<{ paciente_id: string }>('SELECT paciente_id FROM dosis_programada WHERE id = ?', [dosisId]);
  if (!dosis) return;
  await exigir(db, usuarioId, dosis.paciente_id, 'registrar');
  const ultimo = await db.primero<{ id: string }>(
    `SELECT id FROM registro_toma WHERE dosis_programada_id = ? AND eliminado_en IS NULL
      ORDER BY creado_en DESC, rowid DESC LIMIT 1`,
    [dosisId],
  );
  if (!ultimo) return;
  await db.correr(`UPDATE registro_toma SET eliminado_en = ${AHORA_SQL} WHERE id = ?`, [ultimo.id]);
  await bitacora(db, usuarioId, dosis.paciente_id, 'deshacer', 'registro_toma', ultimo.id);
}

export async function motivosOmision(db: Db) {
  return db.todos<{ codigo: string; etiqueta: string }>('SELECT codigo, etiqueta FROM motivo_omision WHERE activo = 1 ORDER BY orden');
}

/* ============ Tratamiento y citas ============ */

export type Tratamiento = { id: string; medicamentoId: string; medicamento: string; presentacion: string | null; cantidad: number; unidad: string; horas: string[] };

export async function tratamientoActual(db: Db, usuarioId: string, pacienteId: string): Promise<Tratamiento[]> {
  await exigir(db, usuarioId, pacienteId, 'ver');
  const hoy = fechaISO(new Date());
  const prescripciones = await db.todos<Omit<Tratamiento, 'horas'>>(
    `SELECT p.id, p.medicamento_id AS medicamentoId, m.nombre_generico AS medicamento, m.presentacion, p.dosis_cantidad AS cantidad, p.unidad_codigo AS unidad
       FROM prescripcion p JOIN medicamento m ON m.id = p.medicamento_id
      WHERE p.paciente_id = ? AND p.eliminado_en IS NULL AND (p.fecha_fin IS NULL OR p.fecha_fin >= ?)
      ORDER BY m.nombre_generico`,
    [pacienteId, hoy],
  );
  const horarios = await db.todos<{ prescripcion_id: string; hora: string }>(
    'SELECT prescripcion_id, hora FROM horario_toma WHERE paciente_id = ? AND eliminado_en IS NULL ORDER BY hora',
    [pacienteId],
  );
  return prescripciones.map((p) => ({ ...p, horas: horarios.filter((h) => h.prescripcion_id === p.id).map((h) => h.hora) }));
}

export type Cita = { id: string; especialidadCodigo: string | null; especialidad: string; medico: string | null; lugar: string | null; fecha_hora: string };

export async function citasProximas(db: Db, usuarioId: string, pacienteId: string): Promise<Cita[]> {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.todos<Cita>(
    `SELECT c.id, c.especialidad_codigo AS especialidadCodigo, e.etiqueta AS especialidad, c.medico, c.lugar, c.fecha_hora
       FROM cita c LEFT JOIN especialidad e ON e.codigo = c.especialidad_codigo
      WHERE c.paciente_id = ? AND c.eliminado_en IS NULL AND c.fecha_hora >= ?
      ORDER BY c.fecha_hora`,
    [pacienteId, fechaISO(new Date())],
  );
}

export type Opcion = { codigo: string; etiqueta: string };
export type MedicamentoCatalogo = { id: string; nombre: string; presentacion: string | null };

export async function catalogoMedicamentos(db: Db) {
  return db.todos<MedicamentoCatalogo>(
    'SELECT id, nombre_generico AS nombre, presentacion FROM medicamento WHERE eliminado_en IS NULL ORDER BY nombre_generico',
  );
}

export async function opcionesDe(db: Db, catalogo: 'unidad_dosis' | 'especialidad') {
  return db.todos<Opcion>(`SELECT codigo, etiqueta FROM ${catalogo} WHERE activo = 1 ORDER BY orden`);
}

export type PrescripcionNueva = { medicamentoId: string; cantidad: number; unidad: string; horas: string[] };

/** Agrega un medicamento con sus horarios. Las dosis empiezan a contar desde este momento. */
export async function agregarPrescripcion(db: Db, usuarioId: string, pacienteId: string, p: PrescripcionNueva) {
  await exigir(db, usuarioId, pacienteId, 'registrar');
  if (!p.horas.length) throw new Error('Elija al menos un horario');
  const id = nuevoId();
  await db.transaccion(async () => {
    await insertar(db, 'prescripcion', {
      id, paciente_id: pacienteId, medicamento_id: p.medicamentoId, dosis_cantidad: p.cantidad, unidad_codigo: p.unidad,
      fecha_inicio: localAhora(), registrado_por: usuarioId,
    });
    for (const hora of Array.from(new Set(p.horas)).sort()) {
      await insertar(db, 'horario_toma', { id: nuevoId(), paciente_id: pacienteId, prescripcion_id: id, hora });
    }
    await bitacora(db, usuarioId, pacienteId, 'crear', 'prescripcion', id);
  });
  await asegurarDosis(db, pacienteId, new Date(), 2);
  return id;
}

export type CitaNueva = { especialidad: string; fechaHora: string; medico: string | null; lugar: string | null };

export async function agregarCita(db: Db, usuarioId: string, pacienteId: string, c: CitaNueva) {
  await exigir(db, usuarioId, pacienteId, 'registrar');
  const id = nuevoId();
  await insertar(db, 'cita', {
    id, paciente_id: pacienteId, especialidad_codigo: c.especialidad, medico: c.medico || null, lugar: c.lugar || null,
    fecha_hora: c.fechaHora, recordatorio_minutos: 1440, registrado_por: usuarioId,
  });
  await bitacora(db, usuarioId, pacienteId, 'crear', 'cita', id);
  return id;
}

export type PrimerosPasos = { perfil: boolean; medicamentos: boolean; cita: boolean };

/** Lo que falta para que la app le sea útil a una persona que acaba de instalarla. */
export async function primerosPasos(db: Db, usuarioId: string, pacienteId: string): Promise<PrimerosPasos> {
  await exigir(db, usuarioId, pacienteId, 'ver');
  const cuenta = async (sql: string) => ((await db.primero<{ n: number }>(sql, [pacienteId]))?.n ?? 0) > 0;
  return {
    perfil: await cuenta(
      `SELECT COUNT(*) AS n FROM aplicacion a JOIN instrumento i ON i.id = a.instrumento_id
        WHERE a.paciente_id = ? AND i.codigo = 'perfil-inicial' AND a.eliminado_en IS NULL`,
    ),
    medicamentos: await cuenta('SELECT COUNT(*) AS n FROM prescripcion WHERE paciente_id = ? AND eliminado_en IS NULL'),
    cita: await cuenta('SELECT COUNT(*) AS n FROM cita WHERE paciente_id = ? AND eliminado_en IS NULL'),
  };
}

/* ============ Cuestionarios ============ */

export type PreguntaBD = {
  id: string; orden: number; texto: string; tipo: 'escala' | 'opcion' | 'numero' | 'texto';
  minimo: number | null; maximo: number | null; etiqueta_minimo: string | null; etiqueta_maximo: string | null;
  opciones: { id: string; etiqueta: string; valor: number | null }[];
};
export type InstrumentoBD = { id: string; codigo: string; nombre: string; version: number; provisional: number; preguntas: PreguntaBD[] };

export async function instrumentoActivo(db: Db, codigo: string): Promise<InstrumentoBD | null> {
  const inst = await db.primero<Omit<InstrumentoBD, 'preguntas'>>(
    `SELECT id, codigo, nombre, version, provisional FROM instrumento
      WHERE codigo = ? AND activo = 1 AND eliminado_en IS NULL ORDER BY version DESC LIMIT 1`,
    [codigo],
  );
  if (!inst) return null;
  const preguntas = await db.todos<Omit<PreguntaBD, 'opciones'>>(
    `SELECT id, orden, texto, tipo_respuesta_codigo AS tipo, minimo, maximo, etiqueta_minimo, etiqueta_maximo
       FROM pregunta WHERE instrumento_id = ? AND eliminado_en IS NULL ORDER BY orden`,
    [inst.id],
  );
  const opciones = await db.todos<{ id: string; pregunta_id: string; etiqueta: string; valor: number | null }>(
    `SELECT o.id, o.pregunta_id, o.etiqueta, o.valor FROM opcion_respuesta o
       JOIN pregunta p ON p.id = o.pregunta_id WHERE p.instrumento_id = ? AND o.eliminado_en IS NULL ORDER BY o.orden`,
    [inst.id],
  );
  return { ...inst, preguntas: preguntas.map((p) => ({ ...p, opciones: opciones.filter((o) => o.pregunta_id === p.id) })) };
}

export type RespuestaNueva = { preguntaId: string; opcionId?: string | null; valor?: number | null; texto?: string | null };

export async function guardarAplicacion(
  db: Db, usuarioId: string, pacienteId: string, instrumentoId: string, respuestas: RespuestaNueva[],
) {
  const paciente = await exigir(db, usuarioId, pacienteId, 'registrar');
  const aplicacionId = nuevoId();
  await db.transaccion(async () => {
    await insertar(db, 'aplicacion', {
      id: aplicacionId, instrumento_id: instrumentoId, paciente_id: pacienteId, registrado_por: usuarioId,
      fuente: fuenteDeRegistro(usuarioId, paciente), completado_en: localAhora(),
      puntaje: puntajeSimple(respuestas.map((r) => r.valor ?? null)),
    });
    for (const r of respuestas) {
      await insertar(db, 'respuesta', {
        id: nuevoId(), paciente_id: pacienteId, aplicacion_id: aplicacionId, pregunta_id: r.preguntaId,
        opcion_id: r.opcionId ?? null, valor_numerico: r.valor ?? null, valor_texto: r.texto ?? null,
      });
    }
    await bitacora(db, usuarioId, pacienteId, 'crear', 'aplicacion', aplicacionId);
  });
  return aplicacionId;
}

/** Última aplicación de un instrumento en una fecha, separada por fuente (paciente u observado). */
export async function aplicacionDelDia(
  db: Db, usuarioId: string, pacienteId: string, codigo: string, fecha: string, fuente: 'paciente' | 'observado',
) {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.primero<{ id: string; puntaje: number | null; completado_en: string }>(
    `SELECT a.id, a.puntaje, a.completado_en FROM aplicacion a JOIN instrumento i ON i.id = a.instrumento_id
      WHERE a.paciente_id = ? AND i.codigo = ? AND a.fuente = ? AND a.eliminado_en IS NULL AND substr(a.completado_en, 1, 10) = ?
      ORDER BY a.completado_en DESC, a.rowid DESC LIMIT 1`,
    [pacienteId, codigo, fuente, fecha],
  );
}

export async function ultimaAplicacion(db: Db, usuarioId: string, pacienteId: string, codigo: string) {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.primero<{ id: string; puntaje: number | null; completado_en: string; fuente: string }>(
    `SELECT a.id, a.puntaje, a.completado_en, a.fuente FROM aplicacion a JOIN instrumento i ON i.id = a.instrumento_id
      WHERE a.paciente_id = ? AND i.codigo = ? AND a.eliminado_en IS NULL ORDER BY a.completado_en DESC LIMIT 1`,
    [pacienteId, codigo],
  );
}

/** Serie diaria del ánimo reportado por el propio paciente (el observado se analiza aparte). */
export async function serieAnimo(db: Db, usuarioId: string, pacienteId: string, desde: string, hasta: string) {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.todos<{ fecha: string; valor: number }>(
    `SELECT substr(a.completado_en, 1, 10) AS fecha, AVG(a.puntaje) AS valor
       FROM aplicacion a JOIN instrumento i ON i.id = a.instrumento_id
      WHERE a.paciente_id = ? AND i.codigo = 'animo-diario' AND a.fuente = 'paciente' AND a.eliminado_en IS NULL
        AND a.completado_en >= ? AND a.completado_en < ?
      GROUP BY fecha ORDER BY fecha`,
    [pacienteId, desde, hasta],
  );
}

/* ============ Acompañantes ============ */

export type Acompanante = { id: string; nombre: string; parentesco: string | null; permiso: string; estado: string };

export async function acompanantesDe(db: Db, usuarioId: string, pacienteId: string): Promise<Acompanante[]> {
  await exigir(db, usuarioId, pacienteId, 'ver');
  return db.todos<Acompanante>(
    `SELECT v.id, u.nombre, pa.etiqueta AS parentesco, pe.etiqueta AS permiso, v.estado_vinculo AS estado
       FROM vinculo_acompanante v JOIN usuario u ON u.id = v.usuario_id
       LEFT JOIN parentesco pa ON pa.codigo = v.parentesco_codigo
       JOIN permiso pe ON pe.codigo = v.permiso_codigo
      WHERE v.paciente_id = ? AND v.eliminado_en IS NULL AND v.estado_vinculo = 'activo'
      ORDER BY u.nombre`,
    [pacienteId],
  );
}

const ALFABETO = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sin O/0 ni I/1

export async function crearInvitacion(db: Db, usuarioId: string, pacienteId: string, permiso: Permiso) {
  await exigir(db, usuarioId, pacienteId, 'administrar');
  const codigo = Array.from({ length: 6 }, () => ALFABETO[Math.floor(Math.random() * ALFABETO.length)]).join('');
  const expira = new Date(Date.now() + 48 * 3600 * 1000).toISOString();
  await insertar(db, 'invitacion', {
    id: nuevoId(), paciente_id: pacienteId, codigo_hash: await huella(codigo), permiso_codigo: permiso, expira_en: expira,
  });
  return { codigo: `${codigo.slice(0, 3)} ${codigo.slice(3)}`, expira };
}

export async function retirarAcompanante(db: Db, usuarioId: string, pacienteId: string, vinculoId: string) {
  await exigir(db, usuarioId, pacienteId, 'administrar');
  await db.correr(
    `UPDATE vinculo_acompanante SET estado_vinculo = 'retirado', revocado_en = ${AHORA_SQL}, actualizado_en = ${AHORA_SQL}
      WHERE id = ? AND paciente_id = ?`,
    [vinculoId, pacienteId],
  );
  await bitacora(db, usuarioId, pacienteId, 'retirar', 'vinculo_acompanante', vinculoId);
}

/* ============ Contenido y directorio (públicos) ============ */

export type Contenido = { id: string; tipo: string; titulo: string; resumen: string | null; fuente: string | null; duracion_min: number | null };

export async function contenidoPublicado(db: Db) {
  return db.todos<Contenido>(
    `SELECT id, tipo_contenido_codigo AS tipo, titulo, resumen, fuente, duracion_min FROM contenido
      WHERE estado_publicacion = 'publicado' AND eliminado_en IS NULL ORDER BY publicado_en DESC, id`,
  );
}

export type Contacto = {
  id: string; categoria: string; categoriaEtiqueta: string; nombre: string; telefono: string | null;
  horario: string | null; estado: string | null; verificado_en: string | null;
};

export async function contactosDirectorio(db: Db) {
  return db.todos<Contacto>(
    `SELECT c.id, c.categoria_codigo AS categoria, cd.etiqueta AS categoriaEtiqueta, c.nombre, c.telefono, c.horario,
            e.etiqueta AS estado, c.verificado_en
       FROM contacto_directorio c JOIN categoria_directorio cd ON cd.codigo = c.categoria_codigo
       LEFT JOIN estado e ON e.codigo = c.estado_codigo
      WHERE c.estado_publicacion = 'publicado' AND c.eliminado_en IS NULL ORDER BY cd.orden, c.nombre`,
  );
}

export async function categoriasDirectorio(db: Db) {
  return db.todos<{ codigo: string; etiqueta: string }>('SELECT codigo, etiqueta FROM categoria_directorio WHERE activo = 1 ORDER BY orden');
}

/* ============ Utilidades ============ */

function localAhora() {
  const d = new Date();
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${fechaISO(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}
