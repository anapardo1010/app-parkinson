import { prepararBase, registrarToma, dosisEnRango, contextoDeUsuario, retirarAcompanante, guardarAplicacion, instrumentoActivo, crearInvitacion, registrarConsentimiento } from '@/data/repositorio';
import { TABLAS } from '@/data/esquema';
import { fuenteDeRegistro, puedeRegistrar, puedeVer, VinculoRef } from '@/features/permisos/permisos';
import { fechaISO, sumarDias } from '@/lib/fechas';
import type { Db } from '@/data/db/tipos';
import { crearDbPrueba } from './dbPrueba';

jest.mock('expo-crypto', () => {
  const nodeCrypto = jest.requireActual('crypto');
  return {
    randomUUID: () => nodeCrypto.randomUUID(),
    CryptoDigestAlgorithm: { SHA256: 'SHA-256' },
    digestStringAsync: async (_alg: string, texto: string) => nodeCrypto.createHash('sha256').update(texto).digest('hex'),
  };
});

describe('reglas puras', () => {
  const paciente = { id: 'p1', usuarioId: 'u-paciente' };
  const vinculos: VinculoRef[] = [
    { pacienteId: 'p1', usuarioId: 'u-registra', permiso: 'ver_registrar', estado: 'activo' },
    { pacienteId: 'p1', usuarioId: 'u-lee', permiso: 'solo_ver', estado: 'activo' },
    { pacienteId: 'p1', usuarioId: 'u-retirado', permiso: 'ver_registrar', estado: 'retirado' },
  ];

  it('el paciente ve y registra lo suyo', () => {
    expect(puedeVer('u-paciente', paciente, vinculos)).toBe(true);
    expect(puedeRegistrar('u-paciente', paciente, vinculos)).toBe(true);
    expect(fuenteDeRegistro('u-paciente', paciente)).toBe('paciente');
  });
  it('un acompañante de solo lectura ve pero no registra', () => {
    expect(puedeVer('u-lee', paciente, vinculos)).toBe(true);
    expect(puedeRegistrar('u-lee', paciente, vinculos)).toBe(false);
  });
  it('lo que registra un acompañante queda como observado', () => {
    expect(fuenteDeRegistro('u-registra', paciente)).toBe('observado');
  });
  it('un vínculo retirado pierde el acceso', () => {
    expect(puedeVer('u-retirado', paciente, vinculos)).toBe(false);
  });
  it('un desconocido no ve nada', () => {
    expect(puedeVer('u-extrano', paciente, vinculos)).toBe(false);
  });
});

describe('base de datos con datos ficticios', () => {
  let db: Db;
  const hoy = fechaISO(new Date());
  const desde = fechaISO(sumarDias(new Date(), -30));
  const manana = fechaISO(sumarDias(new Date(), 2)); // incluye las dosis de mañana

  beforeEach(async () => {
    db = await crearDbPrueba();
    await prepararBase(db);
  });

  it('crea las 22 tablas del modelo', async () => {
    const filas = await db.todos<{ name: string }>("SELECT name FROM sqlite_master WHERE type = 'table'");
    const nombres = filas.map((f) => f.name);
    for (const t of TABLAS) expect(nombres).toContain(t);
  });

  it('la semilla deja una adherencia realista', async () => {
    const dosis = await dosisEnRango(db, 'usr-maria', 'pac-maria', desde, hoy);
    expect(dosis.length).toBeGreaterThan(150);
    const tomadas = dosis.filter((d) => d.estado === 'tomada' || d.estado === 'tarde').length;
    expect(tomadas / dosis.length).toBeGreaterThan(0.8);
  });

  it('el usuario A no puede leer datos del paciente B', async () => {
    await db.correr("INSERT INTO usuario (id, nombre) VALUES ('usr-extrano', 'Persona ajena')");
    await expect(dosisEnRango(db, 'usr-extrano', 'pac-maria', desde, manana)).rejects.toThrow('No tiene permiso');
  });

  it('un acompañante de solo lectura no puede registrar dosis', async () => {
    const [dosis] = await dosisEnRango(db, 'usr-laura', 'pac-maria', hoy, manana);
    await expect(registrarToma(db, 'usr-laura', dosis.id, 'tomada')).rejects.toThrow('No tiene permiso');
  });

  it('lo que registra Juan queda como observado y con su autoría', async () => {
    const pendientes = (await dosisEnRango(db, 'usr-juan', 'pac-maria', hoy, manana)).filter((d) => !d.estado);
    await registrarToma(db, 'usr-juan', pendientes[0].id, 'tomada');
    const fila = await db.primero<{ fuente: string; registrado_por: string }>(
      'SELECT fuente, registrado_por FROM registro_toma WHERE dosis_programada_id = ? AND eliminado_en IS NULL',
      [pendientes[0].id],
    );
    expect(fila).toEqual({ fuente: 'observado', registrado_por: 'usr-juan' });
  });

  it('al retirar a un acompañante pierde el acceso en ese momento', async () => {
    await retirarAcompanante(db, 'usr-maria', 'pac-maria', 'vin-laura');
    const ctx = await contextoDeUsuario(db, 'usr-laura');
    expect(ctx.pacientes).toHaveLength(0);
    await expect(dosisEnRango(db, 'usr-laura', 'pac-maria', hoy, manana)).rejects.toThrow('No tiene permiso');
  });

  it('solo el paciente puede invitar acompañantes o decidir sobre la investigación', async () => {
    await expect(crearInvitacion(db, 'usr-juan', 'pac-maria', 'solo_ver')).rejects.toThrow('No tiene permiso');
    await expect(registrarConsentimiento(db, 'usr-juan', 'pac-maria', 'investigacion', true)).rejects.toThrow('No tiene permiso');
    const inv = await crearInvitacion(db, 'usr-maria', 'pac-maria', 'solo_ver');
    expect(inv.codigo).toMatch(/^[A-Z2-9]{3} [A-Z2-9]{3}$/);
  });

  it('los cuestionarios se guardan como datos, ligados a su versión', async () => {
    const inst = await instrumentoActivo(db, 'animo-diario');
    expect(inst?.version).toBe(1);
    await guardarAplicacion(db, 'usr-maria', 'pac-maria', inst!.id, [{ preguntaId: inst!.preguntas[0].id, valor: 4 }]);
    const r = await db.primero<{ instrumento_id: string; puntaje: number }>(
      "SELECT instrumento_id, puntaje FROM aplicacion WHERE paciente_id = 'pac-maria' ORDER BY rowid DESC LIMIT 1",
    );
    expect(r).toEqual({ instrumento_id: 'animo-diario-v1', puntaje: 4 });
  });
});
