import { useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Enlace, Pantalla, Pastilla, Secundario, Titulo } from '@/components/ui';
import { categoriasDirectorio, contactosDirectorio } from '@/data/repositorio';
import { avisar } from '@/lib/avisar';
import { useDatos } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

const COLOR_CATEGORIA: Record<string, string> = {
  hospital: colores.coralTexto,
  salud_mental: colores.verdeTexto,
  estancia: '#B8551F',
  asociacion: colores.textoSecundario,
};

export default function Directorio() {
  const [categoria, setCategoria] = useState('todas');
  const datos = useDatos(async (db) => ({ contactos: await contactosDirectorio(db), categorias: await categoriasDirectorio(db) }));
  const contactos = (datos?.contactos ?? []).filter((c) => categoria === 'todas' || c.categoria === categoria);

  const llamar = (telefono: string | null, nombre: string) => {
    if (!telefono) return avisar(nombre, 'El teléfono lo capturará el equipo con los contactos oficiales.');
    Linking.openURL(`tel:${telefono.replace(/\s/g, '')}`);
  };

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Aprende" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 4, marginTop: espacio.s }}>
        <Titulo style={{ fontSize: 30 }}>Directorio de apoyo</Titulo>
        <Secundario>Contactos verificados por el equipo.</Secundario>
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Emergencias: llamar al 911"
        onPress={() => Linking.openURL('tel:911')}
        style={{ marginTop: espacio.m, borderRadius: 14, backgroundColor: colores.texto, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 12 }}
      >
        <Text style={{ flex: 1, fontFamily: fuentes.texto, fontSize: 16, lineHeight: 22, color: colores.blanco }}>
          En una emergencia, llame primero al número de emergencias.
        </Text>
        <Text style={{ fontFamily: fuentes.titulo, fontSize: 24, color: colores.blanco }}>911</Text>
      </Pressable>

      <View style={{ marginTop: espacio.m, minHeight: 48, borderWidth: 1.5, borderColor: colores.bordeFuerte, borderRadius: 12, backgroundColor: colores.blanco, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fuentes.texto, fontSize: 16, color: colores.texto }}>
          Estado: <Text style={{ fontFamily: fuentes.textoFuerte }}>Ciudad de México</Text>
        </Text>
        <Icono nombre="abajo" tamano={18} color={colores.texto} />
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: espacio.m }}>
        <Pastilla texto="Todos" activa={categoria === 'todas'} onPress={() => setCategoria('todas')} />
        {datos?.categorias.map((c) => (
          <Pastilla key={c.codigo} texto={c.etiqueta} activa={categoria === c.codigo} onPress={() => setCategoria(c.codigo)} />
        ))}
      </View>

      <View style={{ marginTop: espacio.m }}>
        {contactos.map((c) => (
          <View key={c.id} style={{ borderTopWidth: 1, borderColor: colores.borde, minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 13, letterSpacing: 0.5, color: COLOR_CATEGORIA[c.categoria] ?? colores.textoSecundario }}>
                {c.categoriaEtiqueta.toUpperCase()}
              </Text>
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 17, lineHeight: 22, color: colores.texto }}>{c.nombre}</Text>
              <Secundario style={{ fontSize: 14 }}>{`${c.telefono ?? '[Teléfono]'} · ${c.horario ?? ''}`}</Secundario>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Llamar a ${c.nombre}`}
              onPress={() => llamar(c.telefono, c.nombre)}
              style={{ width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: colores.coralTexto, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icono nombre="telefono" tamano={20} color={colores.coralTexto} />
            </Pressable>
          </View>
        ))}
      </View>

      <Secundario style={{ marginTop: 'auto', paddingTop: espacio.l, fontSize: 14 }}>
        Última verificación: [fecha] · Reportar un dato incorrecto
      </Secundario>
    </Pantalla>
  );
}
