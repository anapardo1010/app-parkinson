import { useState } from 'react';
import { Pressable, Switch, Text, View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Boton, Cuerpo, Enlace, Pantalla, Secundario, Titulo } from '@/components/ui';
import { primerosPasos, registrarConsentimiento } from '@/data/repositorio';
import { useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

export default function Consentimiento() {
  const { db, contexto, acceso } = useSesion();
  const [acepta, setAcepta] = useState(false);
  const [investigacion, setInvestigacion] = useState(false);

  if (!contexto) return <Redirect href="/bienvenida" />;
  const esPaciente = acceso?.rol === 'paciente';

  const continuar = async () => {
    if (!db) return;
    await registrarConsentimiento(db, contexto.usuarioId, null, 'aviso_privacidad', true);
    // La participación en investigación la decide solo el paciente, y siempre por separado.
    if (esPaciente && acceso) await registrarConsentimiento(db, contexto.usuarioId, acceso.pacienteId, 'investigacion', investigacion);
    // Primer uso: antes de entrar, el cuestionario para conocer a la persona (se puede omitir).
    if (esPaciente && acceso && !(await primerosPasos(db, contexto.usuarioId, acceso.pacienteId)).perfil) {
      router.replace('/cuestionario/perfil-inicial?inicio=1');
      return;
    }
    router.replace('/hoy');
  };

  return (
    <Pantalla sinPestanas>
      <View style={{ gap: 12, marginTop: espacio.l }}>
        <Titulo>Su privacidad es primero</Titulo>
        <Cuerpo style={{ color: colores.textoSecundario }}>
          Sus datos de salud son suyos. Los usamos para mostrarle su evolución y, solo si usted lo decide, para investigación.
        </Cuerpo>
      </View>

      <View style={{ borderTopWidth: 1, borderColor: colores.borde, marginTop: espacio.xl, paddingTop: espacio.l, gap: 14 }}>
        <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 18, color: colores.texto }}>Aviso de privacidad</Text>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: acepta }}
          onPress={() => setAcepta(!acepta)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 56 }}
        >
          <View
            style={{
              width: 28, height: 28, borderRadius: 7, borderWidth: 2,
              borderColor: acepta ? colores.coralBoton : colores.bordeFuerte,
              backgroundColor: acepta ? colores.coralBoton : colores.blanco,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {acepta && <Icono nombre="check" tamano={20} color={colores.blanco} grosor={2.4} />}
          </View>
          <Cuerpo style={{ flex: 1 }}>Acepto el aviso de privacidad para usar la app</Cuerpo>
        </Pressable>
        <Enlace texto="Leer aviso completo" onPress={() => {}} />
      </View>

      {esPaciente && (
        <View style={{ borderTopWidth: 1, borderColor: colores.borde, marginTop: espacio.l, paddingTop: espacio.l, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 18, color: colores.texto }}>Participar en investigación</Text>
            <Secundario style={{ fontSize: 14 }}>Opcional</Secundario>
          </View>
          <Secundario style={{ fontSize: 17, lineHeight: 25 }}>
            Sus datos, sin nombre ni datos de contacto, ayudan a entender mejor el Parkinson en México. Puede cambiar esta decisión cuando quiera.
          </Secundario>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 56 }}>
            <Cuerpo>Donar mis datos sin nombre</Cuerpo>
            <Switch
              accessibilityLabel="Donar mis datos sin nombre"
              value={investigacion}
              onValueChange={setInvestigacion}
              trackColor={{ true: colores.coralTexto, false: '#A8A29A' }}
              thumbColor={colores.blanco}
              {...({ activeThumbColor: colores.blanco } as object)}
            />
          </View>
          <Secundario style={{ fontSize: 15 }}>La app funciona igual si decide no participar.</Secundario>
        </View>
      )}

      {!esPaciente && (
        <View style={{ marginTop: espacio.l }}>
          <Secundario style={{ fontSize: 15 }}>
            Usted entra como acompañante. La participación en investigación la decide la persona a quien acompaña.
          </Secundario>
        </View>
      )}

      <View style={{ marginTop: 'auto', paddingTop: espacio.xl }}>
        <Boton texto="Continuar" onPress={continuar} deshabilitado={!acepta} />
      </View>
    </Pantalla>
  );
}
