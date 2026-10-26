import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Pantalla, Pastilla, Secundario, Titulo } from '@/components/ui';
import { Contenido, contenidoPublicado } from '@/data/repositorio';
import { avisar } from '@/lib/avisar';
import { useDatos } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

type Filtro = 'todo' | 'video' | 'articulo' | 'novedad';
const FILTROS: { valor: Filtro; texto: string }[] = [
  { valor: 'todo', texto: 'Todo' },
  { valor: 'video', texto: 'Videos' },
  { valor: 'articulo', texto: 'Artículos' },
  { valor: 'novedad', texto: 'Novedades' },
];

function abrir(c: Contenido) {
  avisar(c.titulo, `${c.resumen ?? ''}\n\nContenido de ejemplo: el texto real lo produce y revisa el equipo.`);
}

export default function Aprende() {
  const [filtro, setFiltro] = useState<Filtro>('todo');
  const contenido = useDatos((db) => contenidoPublicado(db)) ?? [];
  const ver = (t: Filtro) => filtro === 'todo' || filtro === t;
  const videos = contenido.filter((c) => c.tipo === 'video');
  const articulos = contenido.filter((c) => c.tipo === 'articulo');
  const novedades = contenido.filter((c) => c.tipo === 'novedad');

  return (
    <Pantalla>
      <View style={{ gap: 4 }}>
        <Titulo>Aprende</Titulo>
        <Secundario>Información confiable, revisada por especialistas.</Secundario>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: espacio.m, flexGrow: 0 }} contentContainerStyle={{ gap: 6 }}>
        {FILTROS.map((f) => (
          <Pastilla key={f.valor} texto={f.texto} activa={filtro === f.valor} onPress={() => setFiltro(f.valor)} />
        ))}
      </ScrollView>

      {ver('video') && videos.map((v) => (
        <Pressable key={v.id} accessibilityRole="button" accessibilityLabel={`Video: ${v.titulo}`} onPress={() => abrir(v)} style={{ marginTop: espacio.l, gap: 10 }}>
          <View style={{ height: 160, borderRadius: 16, backgroundColor: colores.naranjaTenue, alignItems: 'center', justifyContent: 'center' }}>
            <View style={{ width: 58, height: 58, borderRadius: 29, backgroundColor: colores.blanco, alignItems: 'center', justifyContent: 'center' }}>
              <Icono nombre="play" tamano={22} color={colores.naranja} />
            </View>
            <Text style={{ position: 'absolute', right: 12, bottom: 10, backgroundColor: colores.blanco, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, fontFamily: fuentes.textoMedio, fontSize: 13, color: colores.texto }}>
              {v.duracion_min ? `${v.duracion_min} min` : '[Duración]'}
            </Text>
          </View>
          <View style={{ gap: 2 }}>
            <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 13, letterSpacing: 1, color: colores.textoSecundario }}>VIDEO</Text>
            <Text style={{ fontFamily: fuentes.tituloMedio, fontSize: 21, color: colores.texto }}>{v.titulo}</Text>
          </View>
        </Pressable>
      ))}

      {ver('articulo') && articulos.length > 0 && (
        <Seccion titulo="Ciencia explicada en palabras simples" elementos={articulos} />
      )}
      {ver('novedad') && novedades.length > 0 && <Seccion titulo="Novedades" elementos={novedades} />}

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/directorio')}
        style={{
          marginTop: espacio.xl, minHeight: 56, paddingHorizontal: 16, borderRadius: 14, borderWidth: 1.5, borderColor: colores.coralTexto,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8,
        }}
      >
        <Text style={{ flex: 1, fontFamily: fuentes.textoMedio, fontSize: 17, color: colores.coralTexto }}>Directorio de apoyo: hospitales, estancias y más</Text>
        <Icono nombre="adelante" tamano={20} color={colores.coralTexto} />
      </Pressable>
    </Pantalla>
  );
}

function Seccion({ titulo, elementos }: { titulo: string; elementos: Contenido[] }) {
  return (
    <View style={{ marginTop: espacio.l }}>
      <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 15, color: colores.textoSecundario, marginBottom: 4 }}>{titulo}</Text>
      {elementos.map((c) => (
        <Pressable
          key={c.id}
          accessibilityRole="button"
          onPress={() => abrir(c)}
          style={{ minHeight: 76, paddingVertical: 10, borderTopWidth: 1, borderColor: colores.borde, flexDirection: 'row', alignItems: 'center', gap: 12 }}
        >
          <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colores.coralTenue, alignItems: 'center', justifyContent: 'center' }}>
            <Icono nombre="documento" tamano={20} color={colores.coralTexto} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 17, lineHeight: 22, color: colores.texto }}>{c.titulo}</Text>
            {c.fuente && <Secundario style={{ fontSize: 14 }}>{c.fuente}</Secundario>}
          </View>
        </Pressable>
      ))}
    </View>
  );
}
