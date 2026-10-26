import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { InsigniaQuien } from '@/components/Encabezado';
import { Tendencia } from '@/components/graficas';
import { Boton, Cuerpo, Enlace, Etiqueta, Pantalla, Secundario, Segmentos, Titulo } from '@/components/ui';
import { DosisDetalle, dosisEnRango, serieAnimo, ultimaAplicacion } from '@/data/repositorio';
import { calcularAdherencia, ETIQUETA_CLASIFICACION } from '@/features/adherencia/calculo';
import { avisar } from '@/lib/avisar';
import { aFecha, fechaCorta, fechaHoraISO, fechaISO, sumarDias } from '@/lib/fechas';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

type Periodo = 'semana' | 'mes';
const DIAS: Record<Periodo, number> = { semana: 7, mes: 30 };

function promedio(v: number[]) {
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}

export default function Evolucion() {
  const { acceso } = useSesion();
  const [periodo, setPeriodo] = useState<Periodo>('mes');
  const ahora = new Date();
  const desde = fechaISO(sumarDias(ahora, -(DIAS[periodo] - 1)));
  const hasta = fechaISO(sumarDias(ahora, 1));

  const datos = useDatos(
    async (db, u, p) => ({
      dosis: await dosisEnRango(db, u, p, desde, hasta),
      animo: await serieAnimo(db, u, p, desde, hasta),
      sintomas: await ultimaAplicacion(db, u, p, 'sintomas-semanal'),
    }),
    [periodo],
  );
  if (!acceso) return null;

  const ahoraISO = fechaHoraISO(ahora);
  const resumen = datos ? calcularAdherencia(datos.dosis, ahoraISO) : null;

  // Adherencia por día para la línea de tendencia
  const porDia = new Map<string, DosisDetalle[]>();
  for (const d of datos?.dosis ?? []) {
    const dia = d.programada.slice(0, 10);
    porDia.set(dia, [...(porDia.get(dia) ?? []), d]);
  }
  const serieAdherencia = Array.from(porDia.values())
    .map((ds) => calcularAdherencia(ds, ahoraISO).porcentaje)
    .filter((v): v is number => v !== null);

  const valoresAnimo = (datos?.animo ?? []).map((a) => a.valor);
  const mitad = Math.floor(valoresAnimo.length / 2);
  const antes = promedio(valoresAnimo.slice(0, mitad));
  const despues = promedio(valoresAnimo.slice(mitad));
  const animoProm = promedio(valoresAnimo);
  const sujeto = acceso.rol === 'paciente' ? 'Su ánimo' : `El ánimo de ${acceso.nombre}`;
  const fraseAnimo =
    antes === null || despues === null
      ? 'Todavía no hay suficientes registros.'
      : despues - antes > 0.2
        ? `${sujeto} mejoró en los últimos días.`
        : antes - despues > 0.2
          ? `${sujeto} bajó en los últimos días. Puede comentarlo con su médico.`
          : `${sujeto} se ha mantenido estable.`;

  const fraseAdherencia =
    resumen?.porcentaje == null
      ? 'Todavía no hay dosis registradas.'
      : resumen.porcentaje >= 80
        ? 'Ha tomado casi todas sus dosis.'
        : resumen.porcentaje >= 50
          ? 'Se han omitido algunas dosis.'
          : 'Se han omitido muchas dosis. Puede comentarlo con su médico.';

  const inicio = fechaCorta(aFecha(desde));
  const fin = fechaCorta(ahora);

  return (
    <Pantalla>
      <View style={{ gap: 8, marginBottom: espacio.l }}>
        <InsigniaQuien />
        <Titulo style={{ marginTop: 8 }}>{acceso.rol === 'paciente' ? 'Mi evolución' : `Evolución de ${acceso.nombre}`}</Titulo>
      </View>
      <Segmentos
        opciones={[
          { valor: 'semana', texto: 'Semana' },
          { valor: 'mes', texto: 'Mes' },
        ]}
        valor={periodo}
        onCambio={setPeriodo}
      />

      <View style={{ gap: 6, marginTop: espacio.l }}>
        <Etiqueta>Ánimo</Etiqueta>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: fuentes.titulo, fontSize: 38, color: colores.texto }}>{animoProm ? animoProm.toFixed(1) : '—'}</Text>
          <Secundario>de 5 en promedio</Secundario>
        </View>
        <Cuerpo style={{ fontSize: 17, marginBottom: 6 }}>{fraseAnimo}</Cuerpo>
        <Tendencia valores={valoresAnimo} minimo={1} maximo={5} etiqueta={`Tendencia del ánimo entre ${inicio} y ${fin}`} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Secundario style={{ fontSize: 13 }}>{inicio}</Secundario>
          <Secundario style={{ fontSize: 13 }}>{fin}</Secundario>
        </View>
      </View>

      <View style={{ gap: 6, marginTop: espacio.l, paddingTop: espacio.l, borderTopWidth: 1, borderColor: colores.borde }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Etiqueta>Adherencia</Etiqueta>
          <Enlace texto="Ver calendario" onPress={() => router.push('/calendario')} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text style={{ fontFamily: fuentes.titulo, fontSize: 38, color: colores.texto }}>
            {resumen?.porcentaje != null ? `${resumen.porcentaje}%` : '—'}
          </Text>
          <Secundario>{resumen ? ETIQUETA_CLASIFICACION[resumen.clasificacion].toLowerCase() : ''}</Secundario>
        </View>
        <Cuerpo style={{ fontSize: 17 }}>{fraseAdherencia}</Cuerpo>
        {resumen?.puntualidad != null && (
          <Secundario style={{ marginBottom: 6 }}>{`${resumen.puntualidad}% a tiempo (±30 minutos)`}</Secundario>
        )}
        <Tendencia valores={serieAdherencia} minimo={0} maximo={100} etiqueta={`Adherencia diaria entre ${inicio} y ${fin}`} />
      </View>

      <View style={{ gap: 6, marginTop: espacio.l, paddingTop: espacio.l, borderTopWidth: 1, borderColor: colores.borde }}>
        <Etiqueta>Síntomas · provisional</Etiqueta>
        <Secundario>
          {datos?.sintomas
            ? `Último registro: ${fechaCorta(aFecha(datos.sintomas.completado_en))}. Qué se registra lo definirá el neurólogo.`
            : 'Qué se registra lo definirá el neurólogo.'}
        </Secundario>
        {acceso.puedeRegistrar && (
          <Enlace texto="Registrar los síntomas de esta semana" onPress={() => router.push('/cuestionario/sintomas-semanal')} />
        )}
      </View>

      <View style={{ marginTop: espacio.xl }}>
        <Boton
          texto="Generar reporte para mi médico"
          onPress={() => avisar('Reporte para el médico', 'Próximamente: un PDF con adherencia, ánimo, síntomas y motivos de omisión. Su contenido se definirá con el neurólogo.')}
        />
      </View>
    </Pantalla>
  );
}
