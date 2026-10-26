import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Aviso, Enlace, Etiqueta, Pantalla, Titulo } from '@/components/ui';
import { estadoConsentimiento, usuariosDemo, UsuarioDemo } from '@/data/repositorio';
import { useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

/** Selector de la demo. En la app real: correo + código de 6 dígitos (Supabase Auth). */
export default function Entrar() {
  const { db, entrar } = useSesion();
  const [usuarios, setUsuarios] = useState<UsuarioDemo[]>([]);

  useEffect(() => {
    if (db) usuariosDemo(db).then(setUsuarios);
  }, [db]);

  const elegir = async (id: string) => {
    if (!db) return;
    await entrar(id);
    const c = await estadoConsentimiento(db, id);
    router.replace(c.aviso ? '/hoy' : '/consentimiento');
  };

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Atrás" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 8, marginTop: espacio.m, marginBottom: espacio.l }}>
        <Titulo>Entrar a la demo</Titulo>
        <Etiqueta style={{ fontSize: 16, lineHeight: 23 }}>
          Elija con quién quiere ver la app. Cada persona tiene permisos distintos.
        </Etiqueta>
      </View>
      <View style={{ borderTopWidth: 1, borderColor: colores.borde }}>
        {usuarios.map((u) => (
          <Pressable
            key={u.id}
            accessibilityRole="button"
            accessibilityLabel={`Entrar como ${u.nombre}. ${u.descripcion}`}
            onPress={() => elegir(u.id)}
            style={({ pressed }) => ({
              minHeight: 80, flexDirection: 'row', alignItems: 'center', gap: 14,
              borderBottomWidth: 1, borderColor: colores.borde, opacity: pressed ? 0.7 : 1,
            })}
          >
            <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: colores.coralTenue, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fuentes.titulo, fontSize: 20, color: colores.coralTexto }}>{u.nombre[0]}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>{u.nombre}</Text>
              <Text style={{ fontFamily: fuentes.texto, fontSize: 15, color: colores.textoSecundario }}>{u.descripcion}</Text>
            </View>
            <Icono nombre="adelante" tamano={20} color={colores.textoSecundario} />
          </Pressable>
        ))}
      </View>
      <View style={{ marginTop: 'auto', paddingTop: espacio.l }}>
        <Aviso>En la app real se entra con el correo y un código de 6 dígitos, sin contraseña. Después, con huella o rostro.</Aviso>
      </View>
    </Pantalla>
  );
}
