import animoDiario from '@/config/cuestionarios/animo-diario.json';
import perfilInicial from '@/config/cuestionarios/perfil-inicial.json';
import sintomasSemanal from '@/config/cuestionarios/sintomas-semanal.json';

/**
 * Forma de un archivo de cuestionario en src/config/cuestionarios/.
 *
 * Cuando el neurólogo o el psicólogo definan un instrumento, se crea o reemplaza
 * el archivo JSON (subiendo "version") y se marca "provisional": false. La app no se reprograma:
 * al iniciar, carga los instrumentos en las tablas instrumento / pregunta / opcion_respuesta.
 */
export type OpcionConfig = { etiqueta: string; valor: number | null };

export type PreguntaConfig = {
  texto: string;
  tipoRespuesta: 'escala' | 'opcion' | 'numero' | 'texto';
  minimo?: number;
  maximo?: number;
  etiquetaMinimo?: string;
  etiquetaMaximo?: string;
  obligatoria?: boolean;
  opciones?: OpcionConfig[];
};

export type InstrumentoConfig = {
  codigo: string;
  nombre: string;
  version: number;
  tipo: 'animo' | 'sintomas' | 'perfil' | 'calidad_vida';
  frecuencia: string;
  quienResponde: string;
  licencia: string | null;
  provisional: boolean;
  nota?: string;
  preguntas: PreguntaConfig[];
};

export const INSTRUMENTOS: InstrumentoConfig[] = [
  animoDiario as InstrumentoConfig,
  sintomasSemanal as InstrumentoConfig,
  perfilInicial as InstrumentoConfig,
];

export const idInstrumento = (codigo: string, version: number) => `${codigo}-v${version}`;
export const idPregunta = (instrumentoId: string, orden: number) => `${instrumentoId}-p${orden}`;
export const idOpcion = (preguntaId: string, orden: number) => `${preguntaId}-o${orden}`;

/** Puntaje simple provisional: suma de los valores numéricos. Los especialistas definirán el real. */
export function puntajeSimple(valores: (number | null)[]): number | null {
  const numeros = valores.filter((v): v is number => typeof v === 'number');
  return numeros.length ? numeros.reduce((a, b) => a + b, 0) : null;
}
