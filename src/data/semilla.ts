import { aFecha, fechaHoraISO, fechaISO, sumarDias } from '@/lib/fechas';
import {
  idInstrumento,
  idOpcion,
  idPregunta,
  INSTRUMENTOS,
  InstrumentoConfig,
  puntajeSimple,
} from '@/features/cuestionarios/definicion';
import type { Db, Valor } from './db/tipos';

/**
 * DATOS FICTICIOS para la demo. Ningún dato corresponde a una persona real.
 * Se generan relativos a la fecha de hoy, para que la demo siempre se vea "al día".
 */

export async function insertar(db: Db, tabla: string, fila: Record<string, Valor | boolean | undefined>) {
  const columnas = Object.keys(fila).filter((c) => fila[c] !== undefined);
  const valores = columnas.map((c) => {
    const v = fila[c];
    return typeof v === 'boolean' ? (v ? 1 : 0) : (v as Valor);
  });
  await db.correr(
    `INSERT OR IGNORE INTO ${tabla} (${columnas.join(', ')}) VALUES (${columnas.map(() => '?').join(', ')})`,
    valores,
  );
}

/* ---------- Catálogos ---------- */

const CATALOGOS: Record<string, [string, string][]> = {
  parentesco: [
    ['hijo', 'Hijo'],
    ['hija', 'Hija'],
    ['pareja', 'Pareja'],
    ['hermano_a', 'Hermano o hermana'],
    ['otro_familiar', 'Otro familiar'],
    ['cuidador', 'Persona cuidadora'],
    ['amistad', 'Amistad'],
  ],
  permiso: [
    ['ver_registrar', 'Ver y registrar'],
    ['solo_ver', 'Solo ver'],
  ],
  estado_toma: [
    ['tomada', 'Tomada a tiempo'],
    ['tarde', 'Tomada tarde'],
    ['no_tomada', 'No tomada'],
  ],
  motivo_omision: [
    ['olvido', 'La olvidé'],
    ['efectos', 'Efectos secundarios'],
    ['se_acabo', 'Se me acabó'],
    ['otro', 'Otro motivo'],
  ],
  unidad_dosis: [
    ['tableta', 'tableta'],
    ['mg', 'mg'],
    ['ml', 'ml'],
    ['gotas', 'gotas'],
  ],
  especialidad: [
    ['neurologia', 'Neurología'],
    ['psicologia', 'Psicología'],
    ['psiquiatria', 'Psiquiatría'],
    ['rehabilitacion', 'Rehabilitación'],
    ['medicina_general', 'Medicina general'],
  ],
  tipo_consentimiento: [
    ['aviso_privacidad', 'Aviso de privacidad'],
    ['investigacion', 'Participación en investigación'],
  ],
  tipo_contenido: [
    ['video', 'Video'],
    ['articulo', 'Artículo'],
    ['novedad', 'Novedad'],
  ],
  categoria_directorio: [
    ['hospital', 'Hospitales'],
    ['salud_mental', 'Salud mental'],
    ['estancia', 'Estancias'],
    ['asociacion', 'Asociaciones'],
  ],
  tipo_instrumento: [
    ['animo', 'Estado de ánimo'],
    ['sintomas', 'Síntomas'],
    ['perfil', 'Perfil'],
    ['calidad_vida', 'Calidad de vida'],
  ],
  tipo_respuesta: [
    ['escala', 'Escala'],
    ['opcion', 'Opción'],
    ['numero', 'Número'],
    ['texto', 'Texto'],
  ],
  estado: [
    ['AGS', 'Aguascalientes'], ['BC', 'Baja California'], ['BCS', 'Baja California Sur'], ['CAMP', 'Campeche'],
    ['CHIS', 'Chiapas'], ['CHIH', 'Chihuahua'], ['CDMX', 'Ciudad de México'], ['COAH', 'Coahuila'],
    ['COL', 'Colima'], ['DGO', 'Durango'], ['MEX', 'Estado de México'], ['GTO', 'Guanajuato'],
    ['GRO', 'Guerrero'], ['HGO', 'Hidalgo'], ['JAL', 'Jalisco'], ['MICH', 'Michoacán'],
    ['MOR', 'Morelos'], ['NAY', 'Nayarit'], ['NL', 'Nuevo León'], ['OAX', 'Oaxaca'],
    ['PUE', 'Puebla'], ['QRO', 'Querétaro'], ['QROO', 'Quintana Roo'], ['SLP', 'San Luis Potosí'],
    ['SIN', 'Sinaloa'], ['SON', 'Sonora'], ['TAB', 'Tabasco'], ['TAMS', 'Tamaulipas'],
    ['TLAX', 'Tlaxcala'], ['VER', 'Veracruz'], ['YUC', 'Yucatán'], ['ZAC', 'Zacatecas'],
  ],
};

async function sembrarCatalogos(db: Db) {
  for (const [tabla, filas] of Object.entries(CATALOGOS)) {
    for (const [i, [codigo, etiqueta]] of filas.entries()) {
      await insertar(db, tabla, { codigo, etiqueta, orden: i });
    }
  }
}

/* ---------- Instrumentos (desde src/config/cuestionarios) ---------- */

export async function cargarInstrumento(db: Db, inst: InstrumentoConfig) {
  const id = idInstrumento(inst.codigo, inst.version);
  // Una versión nueva desactiva las anteriores; las respuestas viejas siguen ligadas a su versión.
  await db.correr('UPDATE instrumento SET activo = 0 WHERE codigo = ? AND version < ?', [inst.codigo, inst.version]);
  await insertar(db, 'instrumento', {
    id,
    codigo: inst.codigo,
    nombre: inst.nombre,
    version: inst.version,
    tipo_instrumento_codigo: inst.tipo,
    frecuencia: inst.frecuencia,
    quien_responde: inst.quienResponde,
    licencia: inst.licencia,
    provisional: inst.provisional,
    activo: true,
  });
  for (const [i, p] of inst.preguntas.entries()) {
    const preguntaId = idPregunta(id, i + 1);
    await insertar(db, 'pregunta', {
      id: preguntaId,
      instrumento_id: id,
      orden: i + 1,
      texto: p.texto,
      tipo_respuesta_codigo: p.tipoRespuesta,
      minimo: p.minimo ?? null,
      maximo: p.maximo ?? null,
      etiqueta_minimo: p.etiquetaMinimo ?? null,
      etiqueta_maximo: p.etiquetaMaximo ?? null,
      obligatoria: p.obligatoria ?? true,
    });
    for (const [j, o] of (p.opciones ?? []).entries()) {
      await insertar(db, 'opcion_respuesta', {
        id: idOpcion(preguntaId, j + 1),
        pregunta_id: preguntaId,
        orden: j + 1,
        etiqueta: o.etiqueta,
        valor: o.valor,
      });
    }
  }
}

export async function cargarInstrumentos(db: Db) {
  for (const inst of INSTRUMENTOS) await cargarInstrumento(db, inst);
}

/* ---------- Generador pseudoaleatorio con semilla fija (la demo siempre se ve igual) ---------- */

function crearAzar(semilla: number) {
  let s = semilla;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/* ---------- Personas, tratamiento y registros ficticios ---------- */

export const DEMO = {
  maria: 'usr-maria',
  juan: 'usr-juan',
  laura: 'usr-laura',
  paciente: 'pac-maria',
} as const;

const HORARIOS: { prescripcion: string; horas: string[] }[] = [
  { prescripcion: 'presc-levodopa', horas: ['08:00', '14:00', '20:00'] },
  { prescripcion: 'presc-pramipexol', horas: ['08:00', '20:00'] },
  { prescripcion: 'presc-rasagilina', horas: ['08:00'] },
];

export async function sembrarDatosDemo(db: Db, hoy = new Date()) {
  const azar = crearAzar(42);
  const hace = (dias: number) => sumarDias(hoy, -dias);

  await sembrarCatalogos(db);
  await cargarInstrumentos(db);

  // Personas
  await insertar(db, 'usuario', { id: DEMO.maria, auth_id: 'demo-maria', nombre: 'María López', correo: 'maria@ejemplo.demo' });
  await insertar(db, 'usuario', { id: DEMO.juan, auth_id: 'demo-juan', nombre: 'Juan López', correo: 'juan@ejemplo.demo' });
  await insertar(db, 'usuario', { id: DEMO.laura, auth_id: 'demo-laura', nombre: 'Laura López', correo: 'laura@ejemplo.demo' });
  await insertar(db, 'paciente', {
    id: DEMO.paciente,
    usuario_id: DEMO.maria,
    nombre_preferido: 'María',
    anio_nacimiento: 1956,
    sexo: 'F',
    estado_codigo: 'CDMX',
    anio_diagnostico: 2021,
  });
  await insertar(db, 'vinculo_acompanante', {
    id: 'vin-juan', paciente_id: DEMO.paciente, usuario_id: DEMO.juan,
    parentesco_codigo: 'hijo', permiso_codigo: 'ver_registrar', estado_vinculo: 'activo',
  });
  await insertar(db, 'vinculo_acompanante', {
    id: 'vin-laura', paciente_id: DEMO.paciente, usuario_id: DEMO.laura,
    parentesco_codigo: 'hija', permiso_codigo: 'solo_ver', estado_vinculo: 'activo',
  });

  // Documentos legales (textos reales los redactará el asesor legal)
  const vigente = fechaISO(hace(60));
  await insertar(db, 'documento_legal', { id: 'doc-aviso-v1', tipo_consentimiento_codigo: 'aviso_privacidad', version: '1', vigente_desde: vigente, resumen: '[Texto del aviso de privacidad pendiente del asesor legal]' });
  await insertar(db, 'documento_legal', { id: 'doc-investigacion-v1', tipo_consentimiento_codigo: 'investigacion', version: '1', vigente_desde: vigente, resumen: '[Texto del consentimiento de investigación pendiente del comité de ética]' });

  // Catálogo de medicamentos (ejemplo)
  const meds: [string, string, string][] = [
    ['med-levodopa', 'Levodopa / Carbidopa', '100/25 mg'],
    ['med-pramipexol', 'Pramipexol', '0.25 mg'],
    ['med-rasagilina', 'Rasagilina', '1 mg'],
    ['med-amantadina', 'Amantadina', '100 mg'],
    ['med-ropinirol', 'Ropinirol', '1 mg'],
    ['med-entacapona', 'Entacapona', '200 mg'],
  ];
  for (const [id, nombre, presentacion] of meds) {
    await insertar(db, 'medicamento', { id, nombre_generico: nombre, presentacion });
  }

  // Prescripciones y horarios
  const inicio = fechaISO(hace(90));
  for (const { prescripcion, horas } of HORARIOS) {
    await insertar(db, 'prescripcion', {
      id: prescripcion,
      paciente_id: DEMO.paciente,
      medicamento_id: prescripcion.replace('presc-', 'med-'),
      dosis_cantidad: 1,
      unidad_codigo: 'tableta',
      fecha_inicio: inicio,
      registrado_por: DEMO.maria,
    });
    for (const hora of horas) {
      await insertar(db, 'horario_toma', {
        id: `hor-${prescripcion.replace('presc-', '')}-${hora.replace(':', '')}`,
        paciente_id: DEMO.paciente,
        prescripcion_id: prescripcion,
        hora,
      });
    }
  }

  // Dosis y registros de los últimos 30 días (más lo que va de hoy)
  const ahora = fechaHoraISO(hoy);
  for (let d = 30; d >= 0; d--) {
    const dia = fechaISO(hace(d));
    for (const { prescripcion, horas } of HORARIOS) {
      for (const hora of horas) {
        const horarioId = `hor-${prescripcion.replace('presc-', '')}-${hora.replace(':', '')}`;
        const programada = `${dia}T${hora}`;
        const dosisId = `dos-${horarioId}-${dia}`;
        await insertar(db, 'dosis_programada', {
          id: dosisId, paciente_id: DEMO.paciente, horario_toma_id: horarioId, fecha_hora_programada: programada,
        });
        if (programada > ahora) continue;
        // Las dosis de la última hora quedan pendientes para poder registrarlas en la demo.
        const base = aFecha(programada);
        if (d === 0 && hoy.getTime() - base.getTime() < 60 * 60000) continue;

        const r = azar();
        const quien = azar() < 0.2 ? DEMO.juan : DEMO.maria;
        const fuente = quien === DEMO.maria ? 'paciente' : 'observado';
        const minutos = (m: number) => fechaHoraISO(new Date(base.getTime() + m * 60000));
        let fila: Record<string, Valor> | null = null;
        if (r < 0.92) fila = { estado_toma_codigo: 'tomada', hora_real: minutos(Math.round(azar() * 30 - 10)) };
        else if (r < 0.955) fila = { estado_toma_codigo: 'tarde', hora_real: minutos(45 + Math.round(azar() * 75)) };
        else if (r < 0.99) {
          const m = azar();
          const motivo = m < 0.6 ? 'olvido' : m < 0.8 ? 'efectos' : m < 0.9 ? 'se_acabo' : 'otro';
          fila = { estado_toma_codigo: 'no_tomada', motivo_omision_codigo: motivo, hora_real: null };
        }
        if (fila) {
          await insertar(db, 'registro_toma', {
            id: `reg-${dosisId}`, paciente_id: DEMO.paciente, dosis_programada_id: dosisId,
            registrado_por: quien, fuente, ...fila,
          });
        }
      }
    }
  }

  // Ánimo diario: tendencia que mejora en las últimas dos semanas
  const animo = idInstrumento('animo-diario', 1);
  for (let d = 30; d >= 1; d--) {
    if (azar() < 0.1) continue;
    const tendencia = d > 14 ? 3 : 3.6 + (14 - d) * 0.04;
    const valor = Math.max(1, Math.min(5, Math.round(tendencia + (azar() - 0.5) * 1.6)));
    const aplicacionId = `apl-animo-${d}`;
    const momento = `${fechaISO(hace(d))}T21:00`;
    await insertar(db, 'aplicacion', {
      id: aplicacionId, instrumento_id: animo, paciente_id: DEMO.paciente,
      registrado_por: DEMO.maria, fuente: 'paciente', completado_en: momento, puntaje: valor,
    });
    await insertar(db, 'respuesta', {
      id: `${aplicacionId}-r1`, paciente_id: DEMO.paciente, aplicacion_id: aplicacionId,
      pregunta_id: idPregunta(animo, 1), valor_numerico: valor,
    });
  }

  // Síntomas semanales (provisional)
  const sintomas = idInstrumento('sintomas-semanal', 1);
  for (const [n, d] of [28, 21, 14, 7].entries()) {
    const aplicacionId = `apl-sintomas-${d}`;
    const valores = [2, 2, 1 + (n < 2 ? 1 : 0), 1].map((v) => Math.max(0, v - (azar() < 0.3 ? 1 : 0)));
    await insertar(db, 'aplicacion', {
      id: aplicacionId, instrumento_id: sintomas, paciente_id: DEMO.paciente,
      registrado_por: n % 2 ? DEMO.juan : DEMO.maria, fuente: n % 2 ? 'observado' : 'paciente',
      completado_en: `${fechaISO(hace(d))}T18:00`, puntaje: puntajeSimple(valores),
    });
    for (const [i, v] of valores.entries()) {
      await insertar(db, 'respuesta', {
        id: `${aplicacionId}-r${i + 1}`, paciente_id: DEMO.paciente, aplicacion_id: aplicacionId,
        pregunta_id: idPregunta(sintomas, i + 1), valor_numerico: v,
      });
    }
    const caida = idPregunta(sintomas, 5);
    await insertar(db, 'respuesta', {
      id: `${aplicacionId}-r5`, paciente_id: DEMO.paciente, aplicacion_id: aplicacionId,
      pregunta_id: caida, opcion_id: idOpcion(caida, 1), valor_numerico: 0,
    });
  }

  // Citas
  await insertar(db, 'cita', {
    id: 'cita-neuro', paciente_id: DEMO.paciente, especialidad_codigo: 'neurologia',
    medico: '[Nombre del médico]', lugar: '[Hospital o clínica]', fecha_hora: `${fechaISO(sumarDias(hoy, 3))}T10:00`,
    recordatorio_minutos: 1440, registrado_por: DEMO.juan,
  });
  await insertar(db, 'cita', {
    id: 'cita-psico', paciente_id: DEMO.paciente, especialidad_codigo: 'psicologia',
    medico: '[Nombre del especialista]', lugar: '[Consultorio]', fecha_hora: `${fechaISO(sumarDias(hoy, 12))}T17:00`,
    recordatorio_minutos: 1440, registrado_por: DEMO.maria,
  });

  // Contenido de ejemplo (títulos ilustrativos; el contenido real lo produce y revisa el equipo)
  const contenido: [string, string, string, string | null, string | null][] = [
    ['cont-video-1', 'video', '¿Qué es el Parkinson?', 'Explicación breve de la enfermedad y su tratamiento.', null],
    ['cont-art-1', 'articulo', 'Ejercicio y síntomas motores: lo que dice la investigación', 'Resumen en palabras simples de un artículo científico.', '[Revista, año]'],
    ['cont-art-2', 'articulo', 'Sueño y Parkinson: por qué cambia y qué ayuda', 'Resumen en palabras simples de un artículo científico.', '[Revista, año]'],
    ['cont-nov-1', 'novedad', '11 de abril, Día Mundial del Parkinson', 'Actividades y campañas de concientización.', '[Fuente]'],
  ];
  for (const [id, tipo, titulo, resumen, fuente] of contenido) {
    await insertar(db, 'contenido', {
      id, tipo_contenido_codigo: tipo, titulo, resumen, fuente, estado_publicacion: 'publicado',
      revisado_por: '[Especialista]', publicado_en: fechaISO(hace(5)),
    });
  }

  // Directorio con espacios para que el equipo capture los contactos oficiales
  const contactos: [string, string, string, string][] = [
    ['dir-1', 'hospital', '[Instituto o clínica de neurología]', 'Citas lun a vie'],
    ['dir-2', 'salud_mental', '[Línea de apoyo psicológico]', '24 horas'],
    ['dir-3', 'estancia', '[Estancia de día para adultos mayores]', 'Lun a vie'],
    ['dir-4', 'asociacion', '[Asociación de pacientes con Parkinson]', 'Grupos de apoyo'],
  ];
  for (const [id, categoria, nombre, horario] of contactos) {
    await insertar(db, 'contacto_directorio', {
      id, categoria_codigo: categoria, nombre, horario, telefono: null, estado_codigo: 'CDMX',
      verificado_en: null, estado_publicacion: 'publicado',
    });
  }
}
