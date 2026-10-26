/**
 * Valores de EJEMPLO para prellenar los formularios de la demo, para que en una presentación
 * baste con tocar "Guardar". En la app real los formularios empiezan vacíos.
 * No son recomendaciones de tratamiento.
 */

export type EjemploMedicamento = { medicamentoId: string; cantidad: number; unidad: string; horas: string[] };

export const EJEMPLOS_MEDICAMENTO: EjemploMedicamento[] = [
  { medicamentoId: 'med-levodopa', cantidad: 1, unidad: 'tableta', horas: ['08:00', '14:00', '20:00'] },
  { medicamentoId: 'med-pramipexol', cantidad: 1, unidad: 'tableta', horas: ['08:00', '20:00'] },
  { medicamentoId: 'med-rasagilina', cantidad: 1, unidad: 'tableta', horas: ['08:00'] },
];

export type EjemploCita = { especialidad: string; enDias: number; hora: string; medico: string; lugar: string };

export const EJEMPLOS_CITA: EjemploCita[] = [
  { especialidad: 'neurologia', enDias: 3, hora: '10:00', medico: 'Dra. Ana Ruiz', lugar: 'Consultorio 204' },
  { especialidad: 'psicologia', enDias: 12, hora: '17:00', medico: 'Psic. Carlos Vega', lugar: 'Consultorio 12' },
];

/** Horas que se ofrecen en el formulario de medicamento (cada 2 horas, de 6:00 a 22:00). */
export const HORAS_MEDICAMENTO = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];

/** Horas que se ofrecen en el formulario de cita. */
export const HORAS_CITA = ['08:00', '09:00', '10:00', '11:00', '12:00', '16:00', '17:00', '18:00'];
