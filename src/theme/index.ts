/**
 * Tema visual de la app. Fuente única de colores, tipografía y espacios.
 * Ver "Criterios de diseño" en el documento de definición del proyecto.
 */

export const colores = {
  fondo: '#F9F5EB',
  fondoAlterno: '#F2EBDD',
  superficie: '#FFFDF8',
  blanco: '#FFFFFF',
  texto: '#2D4059',
  textoSecundario: '#5C6B7E',
  textoSuave: '#3E4F66',
  azulProfundo: '#002B5B',
  coral: '#EA5455', // marca: logotipo, ilustraciones
  coralBoton: '#D63F45', // botones con texto blanco
  coralTexto: '#C9383E', // enlaces y texto de acento
  coralTenue: '#FBE4E1',
  naranja: '#F07B3F', // solo formas, nunca texto
  naranjaTenue: '#FDE9DC',
  verde: '#4C8C6A',
  verdeTexto: '#3F7A5A',
  borde: '#E8E4DE',
  bordeFuerte: '#D9D0BF',
  segmento: '#ECE8E2',
} as const;

/** Colores de estado de una dosis o de un día. Siempre acompañados de ícono y texto. */
export const coloresEstado = {
  completo: colores.verde,
  parcial: colores.naranja,
  omitido: colores.textoSecundario,
  sin_datos: 'transparent',
} as const;

export const fuentes = {
  titulo: 'Fraunces_600SemiBold',
  tituloMedio: 'Fraunces_500Medium',
  texto: 'Inter_400Regular',
  textoMedio: 'Inter_500Medium',
  textoFuerte: 'Inter_600SemiBold',
  textoLigero: 'Inter_300Light',
} as const;

export const tamanos = {
  tituloGrande: 32,
  titulo: 28,
  subtitulo: 21,
  cuerpo: 18,
  cuerpoChico: 16,
  etiqueta: 15,
  nota: 14,
} as const;

export const espacio = {
  xs: 4,
  s: 8,
  m: 16,
  l: 24,
  xl: 32,
  xxl: 44,
} as const;

/** Tamaño mínimo de cualquier zona táctil, por accesibilidad (personas con temblor). */
export const TOQUE_MINIMO = 56;

export const radio = {
  boton: 14,
  tarjeta: 16,
  pastilla: 999,
} as const;
