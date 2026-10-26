import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Polyline } from 'react-native-svg';
import { colores } from '@/theme';

/** Línea de tendencia mínima: sin cuadrícula, con el último punto marcado. */
export function Tendencia({
  valores,
  minimo,
  maximo,
  alto = 44,
  etiqueta,
}: {
  valores: number[];
  minimo: number;
  maximo: number;
  alto?: number;
  etiqueta: string;
}) {
  const [ancho, setAncho] = useState(0);
  const pad = 4;
  const puntos = valores.map((v, i) => {
    const x = valores.length === 1 ? ancho / 2 : pad + (i / (valores.length - 1)) * (ancho - pad * 2);
    const y = pad + (1 - (v - minimo) / (maximo - minimo || 1)) * (alto - pad * 2);
    return { x, y };
  });
  const ultimo = puntos[puntos.length - 1];
  return (
    <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)} style={{ height: alto }} accessible accessibilityLabel={etiqueta}>
      {ancho > 0 && puntos.length > 0 && (
        <Svg width={ancho} height={alto}>
          <Polyline
            points={puntos.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke={colores.coralTexto}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />
          {ultimo && <Circle cx={ultimo.x} cy={ultimo.y} r={3.5} fill={colores.coralTexto} />}
        </Svg>
      )}
    </View>
  );
}

export function BarraProgreso({ fraccion }: { fraccion: number }) {
  return (
    <View style={{ height: 4, borderRadius: 2, backgroundColor: colores.borde, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.max(0, Math.min(1, fraccion)) * 100)}%`, height: 4, backgroundColor: colores.coralBoton }} />
    </View>
  );
}
