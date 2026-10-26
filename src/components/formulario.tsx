import { ReactNode } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import { colores, espacio, fuentes, radio, TOQUE_MINIMO } from '@/theme';
import { Icono } from './Icono';

/** Bloque de formulario con su título. */
export function Seccion({ titulo, nota, children }: { titulo: string; nota?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 12, marginTop: espacio.xl }}>
      <View style={{ gap: 2 }}>
        <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 18, color: colores.texto }}>{titulo}</Text>
        {nota && <Text style={{ fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSecundario }}>{nota}</Text>}
      </View>
      {children}
    </View>
  );
}

/** Opción de una lista vertical (una sola elegida). */
export function FilaOpcion({ titulo, detalle, elegida, onPress }: { titulo: string; detalle?: string | null; elegida: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: elegida }}
      onPress={onPress}
      style={{
        minHeight: 64, borderRadius: radio.boton, borderWidth: 1.5, paddingHorizontal: 16, paddingVertical: 10,
        flexDirection: 'row', alignItems: 'center', gap: 12,
        borderColor: elegida ? colores.texto : colores.bordeFuerte, backgroundColor: elegida ? colores.texto : colores.blanco,
      }}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: elegida ? colores.blanco : colores.texto }}>{titulo}</Text>
        {detalle ? (
          <Text style={{ fontFamily: fuentes.texto, fontSize: 15, color: elegida ? '#DCE3E8' : colores.textoSecundario }}>{detalle}</Text>
        ) : null}
      </View>
      {elegida && <Icono nombre="check" tamano={22} color={colores.blanco} grosor={2} />}
    </Pressable>
  );
}

/** Botones grandes en cuadrícula (horas, especialidades). Se pueden elegir uno o varios. */
export function Cuadricula({
  opciones,
  elegidas,
  onCambio,
  columnas = 3,
  varias = false,
}: {
  opciones: { valor: string; texto: string }[];
  elegidas: string[];
  onCambio: (valores: string[]) => void;
  columnas?: number;
  varias?: boolean;
}) {
  const tocar = (v: string) => {
    if (!varias) return onCambio([v]);
    onCambio(elegidas.includes(v) ? elegidas.filter((e) => e !== v) : [...elegidas, v]);
  };
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -5 }}>
      {opciones.map((o) => {
        const activa = elegidas.includes(o.valor);
        return (
          <View key={o.valor} style={{ width: `${100 / columnas}%`, padding: 5 }}>
            <Pressable
              accessibilityRole={varias ? 'checkbox' : 'radio'}
              accessibilityState={{ checked: activa }}
              onPress={() => tocar(o.valor)}
              style={{
                minHeight: TOQUE_MINIMO, borderRadius: radio.boton, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center',
                flexDirection: 'row', gap: 6, paddingHorizontal: 6,
                borderColor: activa ? colores.texto : colores.bordeFuerte, backgroundColor: activa ? colores.texto : colores.blanco,
              }}
            >
              {activa && varias && <Icono nombre="check" tamano={16} color={colores.blanco} grosor={2.2} />}
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                style={{ fontFamily: activa ? fuentes.textoFuerte : fuentes.textoMedio, fontSize: 16, color: activa ? colores.blanco : colores.texto }}
              >
                {o.texto}
              </Text>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

function BotonRedondo({ etiqueta, icono, onPress, deshabilitado }: { etiqueta: string; icono: 'mas' | 'menos' | 'atras' | 'adelante'; onPress: () => void; deshabilitado?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      accessibilityState={{ disabled: !!deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={{
        width: TOQUE_MINIMO, height: TOQUE_MINIMO, borderRadius: TOQUE_MINIMO / 2, borderWidth: 1.5, borderColor: colores.bordeFuerte,
        backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center', opacity: deshabilitado ? 0.35 : 1,
      }}
    >
      {icono === 'menos' ? (
        <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: colores.texto }} />
      ) : (
        <Icono nombre={icono} tamano={22} color={colores.texto} grosor={1.8} />
      )}
    </Pressable>
  );
}

/** Valor con botones a los lados: "−  1 tableta  +" o "‹  Jueves 29 de octubre  ›". */
export function Selector({
  texto,
  etiquetaMenos,
  etiquetaMas,
  onMenos,
  onMas,
  sinMenos,
  flechas,
}: {
  texto: string;
  etiquetaMenos: string;
  etiquetaMas: string;
  onMenos: () => void;
  onMas: () => void;
  sinMenos?: boolean;
  flechas?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <BotonRedondo etiqueta={etiquetaMenos} icono={flechas ? 'atras' : 'menos'} onPress={onMenos} deshabilitado={sinMenos} />
      <Text accessibilityLiveRegion="polite" style={{ flex: 1, textAlign: 'center', fontFamily: fuentes.textoMedio, fontSize: 19, color: colores.texto }}>
        {texto}
      </Text>
      <BotonRedondo etiqueta={etiquetaMas} icono={flechas ? 'adelante' : 'mas'} onPress={onMas} />
    </View>
  );
}

/** Campo de texto con etiqueta visible. */
export function Campo({ etiqueta, valor, onCambio, opcional }: { etiqueta: string; valor: string; onCambio: (t: string) => void; opcional?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 16, color: colores.textoSecundario }}>
        {etiqueta}
        {opcional ? ' (opcional)' : ''}
      </Text>
      <TextInput
        accessibilityLabel={etiqueta}
        value={valor}
        onChangeText={onCambio}
        style={{
          minHeight: TOQUE_MINIMO, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: radio.boton, backgroundColor: colores.blanco,
          paddingHorizontal: 16, fontFamily: fuentes.texto, fontSize: 18, color: colores.texto,
        }}
      />
    </View>
  );
}
