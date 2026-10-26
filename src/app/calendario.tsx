import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import Svg, { Circle, Path } from 'react-native-svg';
import { Icono } from '@/components/Icono';
import { Enlace, Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import { DosisDetalle, dosisEnRango } from '@/data/repositorio';
import { calcularAdherencia, ETIQUETA_CLASIFICACION, EstadoDia, estadoDelDia } from '@/features/adherencia/calculo';
import { fechaHoraISO, fechaISO, horaLegible, nombreMesCapital } from '@/lib/fechas';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

const ETIQUETA_DIA: Record<EstadoDia, string> = {
  completo: 'todas tomadas',
  parcial: 'parcial o tarde',
  omitido: 'dosis omitidas',
  sin_datos: 'sin datos',
};

function Marca({ estado }: { estado: EstadoDia }) {
  if (estado === 'completo') return <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colores.verde }} />;
  if (estado === 'parcial')
    return (
      <Svg width={10} height={10}>
        <Circle cx={5} cy={5} r={3.8} stroke={colores.naranja} strokeWidth={1.6} fill="none" />
      </Svg>
    );
  if (estado === 'omitido')
    return (
      <Svg width={10} height={10} viewBox="0 0 10 10">
        <Path d="M2 2l6 6M8 2l-6 6" stroke={colores.textoSecundario} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    );
  return <View style={{ width: 8, height: 8 }} />;
}

const ESTADO_DOSIS: Record<string, string> = { tomada: 'Tomada', tarde: 'Tomada tarde', no_tomada: 'No tomada' };

export default function Calendario() {
  const { acceso } = useSesion();
  const hoy = new Date();
  const [mes, setMes] = useState({ anio: hoy.getFullYear(), mes: hoy.getMonth() });
  const [elegido, setElegido] = useState<string>(fechaISO(hoy));

  const primero = new Date(mes.anio, mes.mes, 1);
  const siguiente = new Date(mes.anio, mes.mes + 1, 1);
  const dosis = useDatos((db, u, p) => dosisEnRango(db, u, p, fechaISO(primero), fechaISO(siguiente)), [mes.anio, mes.mes]);
  if (!acceso) return null;

  const ahora = fechaHoraISO(hoy);
  const porDia = new Map<string, DosisDetalle[]>();
  for (const d of dosis ?? []) porDia.set(d.programada.slice(0, 10), [...(porDia.get(d.programada.slice(0, 10)) ?? []), d]);
  const resumen = calcularAdherencia(dosis ?? [], ahora);

  const diasMes = new Date(mes.anio, mes.mes + 1, 0).getDate();
  const desfase = (primero.getDay() + 6) % 7; // semana inicia en lunes
  const celdas: (number | null)[] = [...Array(desfase).fill(null), ...Array.from({ length: diasMes }, (_, i) => i + 1)];
  const delDia = porDia.get(elegido) ?? [];

  const cambiarMes = (delta: number) => setMes(({ anio, mes: m }) => {
    const d = new Date(anio, m + delta, 1);
    return { anio: d.getFullYear(), mes: d.getMonth() };
  });

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Atrás" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 4, marginTop: espacio.s, marginBottom: espacio.l }}>
        <Etiqueta>Adherencia al tratamiento</Etiqueta>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Titulo>
            {nombreMesCapital(mes.mes)} <Text style={{ fontFamily: fuentes.tituloMedio, color: colores.textoSecundario }}>{mes.anio}</Text>
          </Titulo>
          <View style={{ flexDirection: 'row' }}>
            <Pressable accessibilityRole="button" accessibilityLabel="Mes anterior" onPress={() => cambiarMes(-1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icono nombre="atras" color={colores.texto} />
            </Pressable>
            <Pressable accessibilityRole="button" accessibilityLabel="Mes siguiente" onPress={() => cambiarMes(1)} style={{ width: 48, height: 48, alignItems: 'center', justifyContent: 'center' }}>
              <Icono nombre="adelante" color={colores.texto} />
            </Pressable>
          </View>
        </View>
      </View>

      <View style={{ flexDirection: 'row' }}>
        {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((d, i) => (
          <Text key={i} style={{ flex: 1, textAlign: 'center', fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.textoSecundario }}>{d}</Text>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 }}>
        {celdas.map((dia, i) => {
          if (dia === null) return <View key={`v${i}`} style={{ width: `${100 / 7}%`, height: 52 }} />;
          const fecha = fechaISO(new Date(mes.anio, mes.mes, dia));
          const estado = estadoDelDia(porDia.get(fecha) ?? [], ahora);
          const esHoy = fecha === fechaISO(hoy);
          const activo = fecha === elegido;
          return (
            <Pressable
              key={fecha}
              accessibilityRole="button"
              accessibilityLabel={`${dia}: ${ETIQUETA_DIA[estado]}`}
              accessibilityState={{ selected: activo }}
              onPress={() => setElegido(fecha)}
              style={{ width: `${100 / 7}%`, height: 52, alignItems: 'center', gap: 3 }}
            >
              <View
                style={{
                  width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center',
                  borderWidth: esHoy ? 1.5 : 0, borderColor: colores.coralTexto,
                  backgroundColor: activo ? colores.segmento : 'transparent',
                }}
              >
                <Text style={{ fontFamily: esHoy ? fuentes.textoFuerte : fuentes.texto, fontSize: 16, color: fecha <= fechaISO(hoy) ? colores.texto : colores.textoSecundario }}>{dia}</Text>
              </View>
              <Marca estado={estado} />
            </Pressable>
          );
        })}
      </View>

      <View style={{ borderTopWidth: 1, borderColor: colores.borde, marginTop: espacio.m, paddingTop: espacio.m, gap: 2 }}>
        <Text style={{ fontFamily: fuentes.titulo, fontSize: 44, color: colores.texto, letterSpacing: -1 }}>
          {resumen.porcentaje != null ? `${resumen.porcentaje}%` : '—'}
        </Text>
        <Secundario style={{ fontSize: 17 }}>
          de dosis tomadas este mes · <Text style={{ color: colores.texto, fontFamily: fuentes.textoMedio }}>{ETIQUETA_CLASIFICACION[resumen.clasificacion]}</Text>
        </Secundario>
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: espacio.m }}>
        {(['completo', 'parcial', 'omitido'] as EstadoDia[]).map((e) => (
          <View key={e} style={{ flexDirection: 'row', alignItems: 'center', gap: 7 }}>
            <Marca estado={e} />
            <Secundario style={{ fontSize: 14 }}>{ETIQUETA_DIA[e][0].toUpperCase() + ETIQUETA_DIA[e].slice(1)}</Secundario>
          </View>
        ))}
      </View>

      <View style={{ marginTop: espacio.l, gap: 4 }}>
        <Etiqueta>{`Dosis del ${Number(elegido.slice(8))} de ${nombreMesCapital(Number(elegido.slice(5, 7)) - 1).toLowerCase()}`}</Etiqueta>
        {delDia.length === 0 && <Secundario>Sin dosis programadas.</Secundario>}
        {delDia.map((d) => (
          <View key={d.id} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderColor: colores.borde, gap: 8 }}>
            <Text style={{ flex: 1, fontFamily: fuentes.texto, fontSize: 16, color: colores.texto }}>{`${horaLegible(d.programada)} · ${d.medicamento}`}</Text>
            <Secundario style={{ fontSize: 15 }}>{d.estado ? ESTADO_DOSIS[d.estado] : d.programada > ahora ? 'Pendiente' : 'Sin registro'}</Secundario>
          </View>
        ))}
      </View>
    </Pantalla>
  );
}
