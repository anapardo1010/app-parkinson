import Svg, { Circle, Path } from 'react-native-svg';

export type NombreIcono =
  | 'hoy'
  | 'tratamiento'
  | 'evolucion'
  | 'aprende'
  | 'perfil'
  | 'check'
  | 'reloj'
  | 'cerrar'
  | 'atras'
  | 'adelante'
  | 'abajo'
  | 'mas'
  | 'play'
  | 'telefono'
  | 'documento'
  | 'equis';

type Props = { nombre: NombreIcono; tamano?: number; color?: string; grosor?: number };

/** Íconos de línea delgada, dibujados a mano para no depender de librerías externas. */
export function Icono({ nombre, tamano = 24, color = 'currentColor', grosor = 1.6 }: Props) {
  const comun = {
    fill: 'none' as const,
    stroke: color,
    strokeWidth: grosor,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 24 24" accessibilityElementsHidden importantForAccessibility="no">
      {nombre === 'hoy' && (
        <>
          <Circle cx={12} cy={12} r={4} {...comun} />
          <Path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" {...comun} />
        </>
      )}
      {nombre === 'tratamiento' && (
        <>
          <Path d="M10.5 20.5a4.95 4.95 0 0 1-7-7l6-6a4.95 4.95 0 0 1 7 7z" {...comun} />
          <Path d="M8.5 8.5l7 7" {...comun} />
        </>
      )}
      {nombre === 'evolucion' && (
        <>
          <Path d="M3 3v18h18" {...comun} />
          <Path d="M7 15l4-4 3 3 5-6" {...comun} />
        </>
      )}
      {nombre === 'aprende' && (
        <>
          <Path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5z" {...comun} />
          <Path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5" {...comun} />
        </>
      )}
      {nombre === 'perfil' && (
        <>
          <Circle cx={12} cy={8} r={4} {...comun} />
          <Path d="M4 21c0-4 3.6-7 8-7s8 3 8 7" {...comun} />
        </>
      )}
      {nombre === 'check' && <Path d="M5 12.5l4.5 4.5L19 7.5" {...comun} />}
      {nombre === 'reloj' && (
        <>
          <Circle cx={12} cy={12} r={8.5} {...comun} />
          <Path d="M12 7.5V12l3 2" {...comun} />
        </>
      )}
      {nombre === 'cerrar' && <Path d="M6 6l12 12M18 6L6 18" {...comun} />}
      {nombre === 'equis' && <Path d="M7 7l10 10M17 7L7 17" {...comun} />}
      {nombre === 'atras' && <Path d="M15 5l-7 7 7 7" {...comun} />}
      {nombre === 'adelante' && <Path d="M9 5l7 7-7 7" {...comun} />}
      {nombre === 'abajo' && <Path d="M6 9l6 6 6-6" {...comun} />}
      {nombre === 'mas' && <Path d="M12 5v14M5 12h14" {...comun} />}
      {nombre === 'play' && <Path d="M8 5.5v13l11-6.5z" fill={color} stroke="none" />}
      {nombre === 'telefono' && (
        <Path
          d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"
          {...comun}
        />
      )}
      {nombre === 'documento' && (
        <>
          <Path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" {...comun} />
          <Path d="M14 3v5h5M9 13h6M9 17h4" {...comun} />
        </>
      )}
    </Svg>
  );
}

/** Tulipán, símbolo internacional del Parkinson. */
export function Tulipan({ tamano = 72 }: { tamano?: number }) {
  return (
    <Svg width={tamano} height={tamano} viewBox="0 0 64 64" accessibilityElementsHidden importantForAccessibility="no">
      <Path d="M20 12c0 13 4 21 12 21s12-8 12-21l-6 5-6-10-6 10z" fill="none" stroke="#EA5455" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M32 33v25" fill="none" stroke="#4C8C6A" strokeWidth={2} strokeLinecap="round" />
      <Path d="M32 50c-7-1-12-6-13-13 7 0 12 5 13 13z" fill="none" stroke="#4C8C6A" strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}
