/**
 * Fechas en hora local, como texto ISO sin zona: 'YYYY-MM-DD' y 'YYYY-MM-DDTHH:MM'.
 * Así se guardan en la base para que una dosis de las 8:00 siga siendo de las 8:00.
 */

const dos = (n: number) => String(n).padStart(2, '0');

export function fechaISO(d: Date): string {
  return `${d.getFullYear()}-${dos(d.getMonth() + 1)}-${dos(d.getDate())}`;
}

export function fechaHoraISO(d: Date): string {
  return `${fechaISO(d)}T${dos(d.getHours())}:${dos(d.getMinutes())}`;
}

/** Convierte 'YYYY-MM-DD' o 'YYYY-MM-DDTHH:MM[:SS]' a Date en hora local. */
export function aFecha(iso: string): Date {
  const [fecha, hora = '00:00'] = iso.split('T');
  const [a, m, d] = fecha.split('-').map(Number);
  const [h, min] = hora.split(':').map(Number);
  return new Date(a, m - 1, d, h || 0, min || 0);
}

export function sumarDias(d: Date, dias: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + dias);
  return r;
}

export function minutosEntre(a: string, b: string): number {
  return Math.round((aFecha(b).getTime() - aFecha(a).getTime()) / 60000);
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

export const nombreMes = (m: number) => MESES[m];
export const nombreMesCapital = (m: number) => MESES[m][0].toUpperCase() + MESES[m].slice(1);

/** "Viernes 17 de octubre" */
export function fechaLarga(d: Date): string {
  return `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`;
}

/** "17 oct" */
export function fechaCorta(d: Date): string {
  return `${d.getDate()} ${MESES[d.getMonth()].slice(0, 3)}`;
}

/** "8:00 a.m." */
export function horaLegible(iso: string): string {
  const d = aFecha(iso.includes('T') ? iso : `2000-01-01T${iso}`);
  const h = d.getHours();
  const sufijo = h < 12 ? 'a.m.' : 'p.m.';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${dos(d.getMinutes())} ${sufijo}`;
}

export function saludo(d: Date): string {
  const h = d.getHours();
  if (h < 12) return 'Buenos días';
  if (h < 19) return 'Buenas tardes';
  return 'Buenas noches';
}
