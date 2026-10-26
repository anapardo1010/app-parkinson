import {
  agregarCita,
  agregarPrescripcion,
  citasProximas,
  dosisEnRango,
  prepararBase,
  primerosPasos,
  tratamientoActual,
} from '@/data/repositorio';
import { fechaHoraISO, fechaISO, sumarDias } from '@/lib/fechas';
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

describe('primer uso (Rosa)', () => {
  let db: Db;
  const hoy = fechaISO(new Date());
  const pasado = fechaISO(sumarDias(new Date(), 2));
  const levodopa = { medicamentoId: 'med-levodopa', cantidad: 1, unidad: 'tableta', horas: ['00:00', '08:00', '14:00', '20:00', '23:59'] };

  beforeEach(async () => {
    db = await crearDbPrueba();
    await prepararBase(db);
  });

  it('empieza sin tratamiento, sin citas y con todos los pasos pendientes', async () => {
    expect(await tratamientoActual(db, 'usr-rosa', 'pac-rosa')).toHaveLength(0);
    expect(await citasProximas(db, 'usr-rosa', 'pac-rosa')).toHaveLength(0);
    expect(await primerosPasos(db, 'usr-rosa', 'pac-rosa')).toEqual({ perfil: false, medicamentos: false, cita: false });
  });

  it('María ya tiene sus primeros pasos completos', async () => {
    expect(await primerosPasos(db, 'usr-maria', 'pac-maria')).toEqual({ perfil: true, medicamentos: true, cita: true });
  });

  it('un medicamento nuevo no genera dosis anteriores al momento en que se agregó', async () => {
    await agregarPrescripcion(db, 'usr-rosa', 'pac-rosa', levodopa);
    const ahora = fechaHoraISO(new Date());
    const dosis = await dosisEnRango(db, 'usr-rosa', 'pac-rosa', hoy, pasado);
    const deHoy = dosis.filter((d) => d.programada.startsWith(hoy));
    expect(deHoy.every((d) => d.programada >= ahora)).toBe(true);
    expect(dosis.filter((d) => !d.programada.startsWith(hoy))).toHaveLength(5); // mañana completas
    expect((await primerosPasos(db, 'usr-rosa', 'pac-rosa')).medicamentos).toBe(true);
  });

  it('agregar una cita completa los primeros pasos', async () => {
    await agregarCita(db, 'usr-rosa', 'pac-rosa', {
      especialidad: 'neurologia', fechaHora: `${fechaISO(sumarDias(new Date(), 3))}T10:00`, medico: 'Dra. Ana Ruiz', lugar: null,
    });
    const [cita] = await citasProximas(db, 'usr-rosa', 'pac-rosa');
    expect(cita.especialidad).toBe('Neurología');
    expect((await primerosPasos(db, 'usr-rosa', 'pac-rosa')).cita).toBe(true);
  });

  it('nadie más puede agregar tratamiento a Rosa', async () => {
    await expect(agregarPrescripcion(db, 'usr-juan', 'pac-rosa', levodopa)).rejects.toThrow('No tiene permiso');
    await expect(agregarPrescripcion(db, 'usr-laura', 'pac-maria', levodopa)).rejects.toThrow('No tiene permiso');
  });
});
