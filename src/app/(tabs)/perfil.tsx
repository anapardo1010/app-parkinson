import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import { estadoConsentimiento, registrarConsentimiento, tratamientoActual, ultimaAplicacion } from '@/data/repositorio';
import { avisar, confirmar } from '@/lib/avisar';
import { notificacionesDisponibles, programarRecordatorios } from '@/notifications/recordatorios';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

function Fila({ titulo, detalle, onPress }: { titulo: string; detalle?: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderColor: colores.borde,
        flexDirection: 'row', alignItems: 'center', gap: 12, opacity: pressed ? 0.7 : 1,
      })}
    >
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>{titulo}</Text>
        {detalle && <Secundario style={{ fontSize: 15 }}>{detalle}</Secundario>}
      </View>
      <Icono nombre="adelante" tamano={20} color={colores.textoSecundario} />
    </Pressable>
  );
}

export default function Perfil() {
  const { db, contexto, acceso, salir, reiniciarDemo, refrescar } = useSesion();
  const [recordatorios, setRecordatorios] = useState(false);
  const datos = useDatos(async (db, u, p) => ({
    consentimiento: await estadoConsentimiento(db, u),
    perfil: await ultimaAplicacion(db, u, p, 'perfil-inicial'),
  }));
  if (!contexto || !acceso) return null;
  const esPaciente = acceso.rol === 'paciente';

  const activarRecordatorios = async () => {
    if (!db) return;
    if (!notificacionesDisponibles) {
      return avisar('Recordatorios', 'Los recordatorios funcionan en el celular. En la vista web solo se muestran las pantallas.');
    }
    const horas = (await tratamientoActual(db, contexto.usuarioId, acceso.pacienteId)).flatMap((t) => t.horas);
    const ok = await programarRecordatorios(acceso.pacienteId, horas);
    setRecordatorios(ok);
    avisar('Recordatorios', ok ? 'Listo: recibirá un aviso a cada hora de medicamento.' : 'Para recibir avisos, permita las notificaciones en la configuración del celular.');
  };

  return (
    <Pantalla>
      <View style={{ gap: 4, marginBottom: espacio.l }}>
        <Titulo>{contexto.nombre}</Titulo>
        <Secundario>
          {esPaciente ? 'Persona con Parkinson' : `${acceso.parentesco ?? 'Acompañante'} de ${acceso.nombre} · ${acceso.puedeRegistrar ? 'ver y registrar' : 'solo ver'}`}
        </Secundario>
      </View>

      <View style={{ borderTopWidth: 1, borderColor: colores.borde }}>
        <Fila titulo="Acompañantes" detalle={esPaciente ? 'Quién le ayuda con su seguimiento' : `Quién acompaña a ${acceso.nombre}`} onPress={() => router.push('/acompanantes')} />
        <Fila
          titulo="Conocerle mejor"
          detalle={datos?.perfil ? 'Cuestionario inicial contestado' : 'Cuestionario inicial pendiente'}
          onPress={() => (acceso.puedeRegistrar ? router.push('/cuestionario/perfil-inicial') : avisar('Conocerle mejor', 'Solo quien puede registrar contesta este cuestionario.'))}
        />
        <View style={{ minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderColor: colores.borde, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>Recordatorios de medicamento</Text>
            <Secundario style={{ fontSize: 15 }}>Sin mostrar el nombre del medicamento</Secundario>
          </View>
          <Switch
            accessibilityLabel="Recordatorios de medicamento"
            value={recordatorios}
            onValueChange={(v) => (v ? activarRecordatorios() : setRecordatorios(false))}
            trackColor={{ true: colores.coralTexto, false: '#A8A29A' }}
            thumbColor={colores.blanco}
              {...({ activeThumbColor: colores.blanco } as object)}
          />
        </View>
        <View style={{ minHeight: 64, paddingVertical: 10, borderBottomWidth: 1, borderColor: colores.borde, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>Participar en investigación</Text>
            <Secundario style={{ fontSize: 15 }}>
              {esPaciente ? 'Donar datos sin nombre; puede cambiarlo cuando quiera' : `Lo decide ${acceso.nombre}`}
            </Secundario>
          </View>
          {esPaciente && (
            <Switch
              accessibilityLabel="Participar en investigación"
              value={!!datos?.consentimiento.investigacion}
              onValueChange={async (v) => {
                if (!db) return;
                await registrarConsentimiento(db, contexto.usuarioId, acceso.pacienteId, 'investigacion', v);
                refrescar();
              }}
              trackColor={{ true: colores.coralTexto, false: '#A8A29A' }}
              thumbColor={colores.blanco}
              {...({ activeThumbColor: colores.blanco } as object)}
            />
          )}
        </View>
      </View>

      <View style={{ marginTop: espacio.xl, gap: 4 }}>
        <Etiqueta>Demo</Etiqueta>
        <View style={{ borderTopWidth: 1, borderColor: colores.borde }}>
          <Fila titulo="Entrar como otra persona" detalle="Rosa, María, Juan o Laura" onPress={() => { salir(); router.replace('/entrar'); }} />
          <Fila
            titulo="Reiniciar la demo"
            detalle="Vuelve a cargar los datos ficticios; Rosa vuelve a estar recién instalada"
            onPress={() =>
              confirmar('Reiniciar la demo', 'Se borrarán los registros hechos en este dispositivo y se cargarán de nuevo los datos ficticios.', 'Reiniciar', async () => {
                await reiniciarDemo();
                router.replace('/bienvenida');
              })
            }
          />
        </View>
      </View>
    </Pantalla>
  );
}
