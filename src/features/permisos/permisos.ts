/**
 * Reglas de acceso a los datos de un paciente.
 *
 * Son las mismas reglas que en producción vivirán en la base de datos como
 * funciones puede_ver(paciente_id) y puede_registrar(paciente_id) con Row Level Security.
 * En la demo se aplican aquí, antes de cada lectura o escritura.
 * Ver "Inicio de sesión y pertenencia de los datos" en la definición técnica.
 */

export type Permiso = 'ver_registrar' | 'solo_ver';

export type PacienteRef = { id: string; usuarioId: string | null };

export type VinculoRef = {
  pacienteId: string;
  usuarioId: string;
  permiso: Permiso;
  estado: 'pendiente' | 'activo' | 'retirado';
};

function vinculoActivo(usuarioId: string, paciente: PacienteRef, vinculos: VinculoRef[]) {
  return vinculos.find((v) => v.pacienteId === paciente.id && v.usuarioId === usuarioId && v.estado === 'activo');
}

export function esElPaciente(usuarioId: string, paciente: PacienteRef): boolean {
  return paciente.usuarioId !== null && paciente.usuarioId === usuarioId;
}

export function puedeVer(usuarioId: string, paciente: PacienteRef, vinculos: VinculoRef[]): boolean {
  return esElPaciente(usuarioId, paciente) || !!vinculoActivo(usuarioId, paciente, vinculos);
}

export function puedeRegistrar(usuarioId: string, paciente: PacienteRef, vinculos: VinculoRef[]): boolean {
  if (esElPaciente(usuarioId, paciente)) return true;
  return vinculoActivo(usuarioId, paciente, vinculos)?.permiso === 'ver_registrar';
}

/** Solo el paciente administra a sus acompañantes y su participación en investigación. */
export function puedeAdministrar(usuarioId: string, paciente: PacienteRef): boolean {
  return esElPaciente(usuarioId, paciente);
}

/** Lo decide el servidor, nunca la app: el dato es del paciente u observado por un acompañante. */
export function fuenteDeRegistro(usuarioId: string, paciente: PacienteRef): 'paciente' | 'observado' {
  return esElPaciente(usuarioId, paciente) ? 'paciente' : 'observado';
}

export class AccesoDenegado extends Error {
  constructor(accion: string) {
    super(`No tiene permiso para ${accion}.`);
    this.name = 'AccesoDenegado';
  }
}
