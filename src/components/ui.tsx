import { ReactNode } from 'react';
import {
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextProps,
  View,
  ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colores, espacio, fuentes, radio, tamanos, TOQUE_MINIMO } from '@/theme';
import { Icono, NombreIcono } from './Icono';

/* ---------- Texto ---------- */

export function Titulo({ style, ...props }: TextProps) {
  return <Text accessibilityRole="header" style={[estilos.titulo, style]} {...props} />;
}

export function Subtitulo({ style, ...props }: TextProps) {
  return <Text style={[estilos.subtitulo, style]} {...props} />;
}

export function Cuerpo({ style, ...props }: TextProps) {
  return <Text style={[estilos.cuerpo, style]} {...props} />;
}

export function Secundario({ style, ...props }: TextProps) {
  return <Text style={[estilos.secundario, style]} {...props} />;
}

export function Etiqueta({ style, ...props }: TextProps) {
  return <Text style={[estilos.etiqueta, style]} {...props} />;
}

/* ---------- Contenedores ---------- */

type PantallaProps = {
  children: ReactNode;
  desplazable?: boolean;
  fondo?: string;
  style?: StyleProp<ViewStyle>;
  sinPestanas?: boolean;
};

/** Contenedor estándar de pantalla: márgenes de 24, área segura y desplazamiento. */
export function Pantalla({ children, desplazable = true, fondo = colores.fondo, style, sinPestanas }: PantallaProps) {
  const insets = useSafeAreaInsets();
  const relleno = {
    paddingTop: insets.top + espacio.l,
    paddingBottom: (sinPestanas ? insets.bottom : 0) + espacio.l,
    paddingHorizontal: espacio.l,
  };
  if (!desplazable) {
    return <View style={[{ flex: 1, backgroundColor: fondo }, relleno, style]}>{children}</View>;
  }
  return (
    <ScrollView style={{ flex: 1, backgroundColor: fondo }} contentContainerStyle={[relleno, { flexGrow: 1 }, style]}>
      {children}
    </ScrollView>
  );
}

export function Separador() {
  return <View style={{ height: 1, backgroundColor: colores.borde }} />;
}

/* ---------- Botones ---------- */

type BotonProps = {
  texto: string;
  onPress: () => void;
  variante?: 'principal' | 'contorno' | 'texto';
  icono?: NombreIcono;
  deshabilitado?: boolean;
  etiquetaAccesible?: string;
};

export function Boton({ texto, onPress, variante = 'principal', icono, deshabilitado, etiquetaAccesible }: BotonProps) {
  const color =
    variante === 'principal' ? colores.blanco : variante === 'contorno' ? colores.coralTexto : colores.texto;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiquetaAccesible ?? texto}
      accessibilityState={{ disabled: !!deshabilitado }}
      disabled={deshabilitado}
      onPress={onPress}
      style={({ pressed }) => [
        estilos.boton,
        variante === 'principal' && { backgroundColor: colores.coralBoton },
        variante === 'contorno' && { borderWidth: 1.5, borderColor: colores.coralTexto },
        deshabilitado && { opacity: 0.4 },
        pressed && { opacity: 0.8 },
      ]}
    >
      {icono && <Icono nombre={icono} tamano={22} color={color} grosor={1.8} />}
      <Text style={[estilos.botonTexto, { color }]}>{texto}</Text>
    </Pressable>
  );
}

export function Enlace({ texto, onPress, icono }: { texto: string; onPress: () => void; icono?: NombreIcono }) {
  return (
    <Pressable
      accessibilityRole="link"
      onPress={onPress}
      hitSlop={10}
      style={{ minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}
    >
      {icono && <Icono nombre={icono} tamano={22} color={colores.coralTexto} />}
      <Text style={estilos.enlace}>{texto}</Text>
    </Pressable>
  );
}

/* ---------- Selección ---------- */

export function Pastilla({ texto, activa, onPress }: { texto: string; activa: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: activa }}
      onPress={onPress}
      style={[
        estilos.pastilla,
        activa ? { backgroundColor: colores.texto, borderColor: colores.texto } : { borderColor: colores.bordeFuerte },
      ]}
    >
      <Text style={[estilos.pastillaTexto, { color: activa ? colores.blanco : colores.texto }, activa && { fontFamily: fuentes.textoFuerte }]}>
        {texto}
      </Text>
    </Pressable>
  );
}

export function Segmentos<T extends string>({
  opciones,
  valor,
  onCambio,
}: {
  opciones: { valor: T; texto: string }[];
  valor: T;
  onCambio: (v: T) => void;
}) {
  return (
    <View accessibilityRole="tablist" style={estilos.segmentos}>
      {opciones.map((o) => {
        const activo = o.valor === valor;
        return (
          <Pressable
            key={o.valor}
            accessibilityRole="tab"
            accessibilityState={{ selected: activo }}
            onPress={() => onCambio(o.valor)}
            style={[estilos.segmento, activo && { backgroundColor: colores.blanco }]}
          >
            <Text style={[estilos.segmentoTexto, activo && { color: colores.texto, fontFamily: fuentes.textoFuerte }]}>{o.texto}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/* ---------- Avisos ---------- */

/** Indica en cada pantalla quién está registrando, como pide el diseño. */
export function Insignia({ texto }: { texto: string }) {
  return (
    <View style={estilos.insignia} accessibilityRole="text">
      <Text style={estilos.insigniaTexto}>{texto}</Text>
    </View>
  );
}

export function Aviso({ children }: { children: ReactNode }) {
  return (
    <View style={estilos.aviso}>
      <Text style={estilos.avisoTexto}>{children}</Text>
    </View>
  );
}

export const estilos = StyleSheet.create({
  titulo: { fontFamily: fuentes.titulo, fontSize: tamanos.tituloGrande, color: colores.texto, letterSpacing: -0.5, lineHeight: 38 },
  subtitulo: { fontFamily: fuentes.tituloMedio, fontSize: tamanos.subtitulo, color: colores.texto, lineHeight: 28 },
  cuerpo: { fontFamily: fuentes.texto, fontSize: tamanos.cuerpo, color: colores.texto, lineHeight: 26 },
  secundario: { fontFamily: fuentes.texto, fontSize: tamanos.cuerpoChico, color: colores.textoSecundario, lineHeight: 23 },
  etiqueta: { fontFamily: fuentes.textoMedio, fontSize: tamanos.etiqueta, color: colores.textoSecundario },
  boton: {
    minHeight: TOQUE_MINIMO,
    borderRadius: radio.boton,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: espacio.m,
  },
  botonTexto: { fontFamily: fuentes.textoMedio, fontSize: tamanos.cuerpo },
  enlace: { fontFamily: fuentes.textoMedio, fontSize: 17, color: colores.coralTexto },
  pastilla: { minHeight: 40, paddingHorizontal: 13, borderRadius: radio.pastilla, borderWidth: 1.5, justifyContent: 'center' },
  pastillaTexto: { fontFamily: fuentes.textoMedio, fontSize: 14 },
  segmentos: { flexDirection: 'row', backgroundColor: colores.segmento, borderRadius: 12, padding: 4, gap: 4 },
  segmento: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  segmentoTexto: { fontFamily: fuentes.textoMedio, fontSize: tamanos.etiqueta, color: colores.textoSecundario },
  insignia: { alignSelf: 'flex-start', backgroundColor: colores.segmento, borderRadius: radio.pastilla, paddingHorizontal: 12, paddingVertical: 5 },
  insigniaTexto: { fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.textoSuave },
  aviso: { backgroundColor: colores.superficie, borderWidth: 1, borderColor: colores.borde, borderRadius: radio.tarjeta, padding: espacio.m },
  avisoTexto: { fontFamily: fuentes.texto, fontSize: tamanos.cuerpoChico, color: colores.textoSecundario, lineHeight: 23 },
});
