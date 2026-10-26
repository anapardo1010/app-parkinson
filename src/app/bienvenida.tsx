import { View } from 'react-native';
import { router } from 'expo-router';
import { Tulipan } from '@/components/Icono';
import { Boton, Cuerpo, Enlace, Pantalla, Secundario, Titulo } from '@/components/ui';
import { espacio } from '@/theme';

export default function Bienvenida() {
  return (
    <Pantalla desplazable={false} sinPestanas>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <Tulipan tamano={72} />
        <Titulo style={{ textAlign: 'center', fontSize: 34 }}>[Nombre de la app]</Titulo>
        <Cuerpo style={{ textAlign: 'center', maxWidth: 290, color: '#5C6B7E' }}>
          Le acompañamos en el seguimiento de su día a día.
        </Cuerpo>
      </View>
      <View style={{ gap: espacio.s }}>
        <Boton texto="Comenzar" onPress={() => router.push('/entrar')} />
        <View style={{ alignItems: 'center' }}>
          <Enlace texto="Tengo un código de acompañante" onPress={() => router.push('/unirse')} />
        </View>
        <Secundario style={{ textAlign: 'center', fontSize: 13 }}>Versión de demostración con datos ficticios</Secundario>
      </View>
    </Pantalla>
  );
}
