import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { Boton, Cuerpo, Enlace, Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import { DEMO } from '@/data/semilla';
import { estadoConsentimiento } from '@/data/repositorio';
import { useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

/**
 * Unirse como acompañante con un código de invitación.
 * DEMO: el código no se valida contra la base; al aceptar, se entra como Juan.
 * En producción, una función del servidor valida la huella del código, su vigencia (48 h) y que no se haya usado.
 */
export default function Unirse() {
  const { db, entrar } = useSesion();
  const [paso, setPaso] = useState<'codigo' | 'confirmar'>('codigo');
  const [codigo, setCodigo] = useState('');

  const aceptar = async () => {
    if (!db) return;
    await entrar(DEMO.juan);
    const c = await estadoConsentimiento(db, DEMO.juan);
    router.replace(c.aviso ? '/hoy' : '/consentimiento');
  };

  if (paso === 'confirmar') {
    return (
      <Pantalla sinPestanas>
        <Enlace texto="Atrás" icono="atras" onPress={() => setPaso('codigo')} />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 }}>
          <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colores.coralTenue, alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <Text style={{ fontFamily: fuentes.titulo, fontSize: 36, color: colores.coralTexto }}>M</Text>
          </View>
          <Etiqueta>Le invitó como acompañante</Etiqueta>
          <Titulo style={{ fontSize: 34 }}>María López</Titulo>
          <Cuerpo style={{ textAlign: 'center', color: colores.textoSecundario, maxWidth: 310 }}>
            Podrá ver su evolución y registrar dosis, síntomas y citas. María puede cambiar estos permisos cuando quiera.
          </Cuerpo>
        </View>
        <View style={{ gap: espacio.s }}>
          <Boton texto="Aceptar y continuar" onPress={aceptar} />
          <Boton texto="No soy yo" variante="texto" onPress={() => setPaso('codigo')} />
        </View>
      </Pantalla>
    );
  }

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Atrás" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 10, marginTop: espacio.l }}>
        <Titulo>Únase como acompañante</Titulo>
        <Cuerpo style={{ color: colores.textoSecundario }}>
          Pida a la persona que acompaña el código que aparece en su app, en Perfil › Acompañantes.
        </Cuerpo>
      </View>
      <View style={{ gap: 8, marginTop: espacio.xl }}>
        <Etiqueta nativeID="etiqueta-codigo">Código de invitación</Etiqueta>
        <TextInput
          accessibilityLabelledBy="etiqueta-codigo"
          value={codigo}
          onChangeText={(t) => setCodigo(t.toUpperCase())}
          placeholder="ABC 234"
          placeholderTextColor="#A8A29A"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={7}
          style={{
            height: 64, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 14, backgroundColor: colores.blanco,
            paddingHorizontal: 18, fontFamily: fuentes.textoFuerte, fontSize: 26, letterSpacing: 6, color: colores.texto,
          }}
        />
        <Secundario style={{ fontSize: 14 }}>En la demo cualquier código de 6 caracteres funciona.</Secundario>
      </View>
      <View style={{ marginTop: 'auto', paddingTop: espacio.xl }}>
        <Boton texto="Continuar" onPress={() => setPaso('confirmar')} deshabilitado={codigo.replace(' ', '').length < 6} />
      </View>
    </Pantalla>
  );
}
