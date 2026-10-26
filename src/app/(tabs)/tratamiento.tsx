import { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { InsigniaQuien } from '@/components/Encabezado';
import { Boton, Pantalla, Secundario, Segmentos, Titulo } from '@/components/ui';
import { citasProximas, tratamientoActual } from '@/data/repositorio';
import { aFecha, fechaLarga, horaLegible } from '@/lib/fechas';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

export default function Tratamiento() {
  const { acceso } = useSesion();
  const [seccion, setSeccion] = useState<'medicamentos' | 'citas'>('medicamentos');
  const datos = useDatos(async (db, u, p) => ({
    tratamiento: await tratamientoActual(db, u, p),
    citas: await citasProximas(db, u, p),
  }));

  return (
    <Pantalla>
      <View style={{ gap: 8, marginBottom: espacio.l }}>
        <InsigniaQuien />
        <Titulo style={{ marginTop: 8 }}>Tratamiento</Titulo>
      </View>
      <Segmentos
        opciones={[
          { valor: 'medicamentos', texto: 'Medicamentos' },
          { valor: 'citas', texto: 'Citas' },
        ]}
        valor={seccion}
        onCambio={setSeccion}
      />

      <View style={{ marginTop: espacio.l, borderTopWidth: 1, borderColor: colores.borde }}>
        {seccion === 'medicamentos' &&
          datos?.tratamiento.map((t) => (
            <View key={t.id} style={{ minHeight: 76, paddingVertical: 12, borderBottomWidth: 1, borderColor: colores.borde, gap: 4 }}>
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>{t.medicamento}</Text>
              <Secundario>{`${t.cantidad} ${t.unidad}${t.presentacion ? ` · ${t.presentacion}` : ''}`}</Secundario>
              <Secundario>{t.horas.map((h) => horaLegible(h)).join(' · ')}</Secundario>
            </View>
          ))}
        {seccion === 'citas' &&
          datos?.citas.map((c) => (
            <View key={c.id} style={{ minHeight: 76, paddingVertical: 12, borderBottomWidth: 1, borderColor: colores.borde, gap: 4 }}>
              <Text style={{ fontFamily: fuentes.tituloMedio, fontSize: 21, color: colores.texto }}>{c.especialidad}</Text>
              <Text style={{ fontFamily: fuentes.texto, fontSize: 17, color: colores.texto }}>
                {`${fechaLarga(aFecha(c.fecha_hora))} · ${horaLegible(c.fecha_hora)}`}
              </Text>
              <Secundario>{[c.medico, c.lugar].filter(Boolean).join(' · ')}</Secundario>
            </View>
          ))}
        {seccion === 'medicamentos' && datos?.tratamiento.length === 0 && (
          <Secundario style={{ paddingVertical: espacio.m }}>Aún no hay medicamentos. Agréguelos para recibir recordatorios.</Secundario>
        )}
        {seccion === 'citas' && datos?.citas.length === 0 && (
          <Secundario style={{ paddingVertical: espacio.m }}>No hay citas próximas.</Secundario>
        )}
      </View>

      {acceso?.puedeRegistrar && (
        <View style={{ marginTop: espacio.l }}>
          {seccion === 'medicamentos' ? (
            <Boton variante="contorno" icono="mas" texto="Agregar medicamento" onPress={() => router.push('/medicamento/nuevo')} />
          ) : (
            <Boton variante="contorno" icono="mas" texto="Agregar cita" onPress={() => router.push('/cita/nueva')} />
          )}
        </View>
      )}

      <Secundario style={{ marginTop: 'auto', paddingTop: espacio.xl, fontSize: 15 }}>
        Los cambios en su tratamiento los indica su médico.
      </Secundario>
    </Pantalla>
  );
}
