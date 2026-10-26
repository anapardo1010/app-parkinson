import { minutosEntre } from '@/lib/fechas';

/**
 * Cálculo de adherencia al tratamiento. DEFINIDO (ver "Cómo se mide" en la definición del proyecto).
 *
 *  - Adherencia  = dosis tomadas (a tiempo o tarde) / dosis programadas que ya debieron tomarse.
 *  - Puntualidad = dosis tomadas dentro de ±VENTANA minutos / dosis programadas.
 *  - Clasificación: 80% o más buena; 50 a 79% parcial; menos de 50% baja.
 *  - Una dosis pasada sin registro cuenta como no tomada.
 *
 * Funciones puras: no tocan la base de datos, así se pueden probar fácilmente.
 */

export const VENTANA_PUNTUALIDAD_MIN = 30;

export type EstadoToma = 'tomada' | 'tarde' | 'no_tomada';

export type DosisConEstado = {
  id: string;
  programada: string; // 'YYYY-MM-DDTHH:MM'
  estado: EstadoToma | null; // null = sin registro
  horaReal: string | null;
  motivo?: string | null;
};

export type Clasificacion = 'buena' | 'parcial' | 'baja' | 'sin_datos';

export type ResumenAdherencia = {
  programadas: number;
  tomadas: number;
  puntuales: number;
  porcentaje: number | null;
  puntualidad: number | null;
  clasificacion: Clasificacion;
};

export function yaDebioTomarse(dosis: DosisConEstado, ahora: string): boolean {
  return dosis.programada <= ahora;
}

export function fueTomada(dosis: DosisConEstado): boolean {
  return dosis.estado === 'tomada' || dosis.estado === 'tarde';
}

export function fuePuntual(dosis: DosisConEstado, ventana = VENTANA_PUNTUALIDAD_MIN): boolean {
  if (dosis.estado !== 'tomada') return false;
  if (!dosis.horaReal) return true;
  return Math.abs(minutosEntre(dosis.programada, dosis.horaReal)) <= ventana;
}

export function clasificar(porcentaje: number | null): Clasificacion {
  if (porcentaje === null) return 'sin_datos';
  if (porcentaje >= 80) return 'buena';
  if (porcentaje >= 50) return 'parcial';
  return 'baja';
}

export const ETIQUETA_CLASIFICACION: Record<Clasificacion, string> = {
  buena: 'Buena adherencia',
  parcial: 'Adherencia parcial',
  baja: 'Adherencia baja',
  sin_datos: 'Sin datos todavía',
};

export function calcularAdherencia(
  dosis: DosisConEstado[],
  ahora: string,
  ventana = VENTANA_PUNTUALIDAD_MIN,
): ResumenAdherencia {
  const pasadas = dosis.filter((d) => yaDebioTomarse(d, ahora));
  const tomadas = pasadas.filter(fueTomada).length;
  const puntuales = pasadas.filter((d) => fuePuntual(d, ventana)).length;
  const programadas = pasadas.length;
  const porcentaje = programadas ? Math.round((tomadas / programadas) * 100) : null;
  const puntualidad = programadas ? Math.round((puntuales / programadas) * 100) : null;
  return { programadas, tomadas, puntuales, porcentaje, puntualidad, clasificacion: clasificar(porcentaje) };
}

/** Estado de un día en el calendario. Siempre se muestra con color, ícono y texto. */
export type EstadoDia = 'completo' | 'parcial' | 'omitido' | 'sin_datos';

export function estadoDelDia(dosisDelDia: DosisConEstado[], ahora: string): EstadoDia {
  const pasadas = dosisDelDia.filter((d) => yaDebioTomarse(d, ahora));
  if (pasadas.length === 0) return 'sin_datos';
  const tomadas = pasadas.filter(fueTomada);
  if (tomadas.length === 0) return 'omitido';
  const todasATiempo = pasadas.every((d) => d.estado === 'tomada');
  return todasATiempo ? 'completo' : 'parcial';
}

/** Cuenta los motivos de omisión (para el reporte al médico). */
export function contarMotivos(dosis: DosisConEstado[]): Record<string, number> {
  const conteo: Record<string, number> = {};
  for (const d of dosis) {
    if (d.estado === 'no_tomada' && d.motivo) conteo[d.motivo] = (conteo[d.motivo] ?? 0) + 1;
  }
  return conteo;
}
