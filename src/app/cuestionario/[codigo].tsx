import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Aviso, Boton, Enlace, Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import { guardarAplicacion, instrumentoActivo, InstrumentoBD, RespuestaNueva } from '@/data/repositorio';
import { useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

/**
 * Pantalla GENÉRICA de cuestionarios: dibuja cualquier instrumento de src/config/cuestionarios.
 * Una pregunta por pantalla. Cuando los especialistas definan sus escalas, esta pantalla no cambia.
 */
export default function Cuestionario() {
  const { codigo } = useLocalSearchParams<{ codigo: string }>();
  const { db, contexto, acceso, refrescar } = useSesion();
  const [inst, setInst] = useState<InstrumentoBD | null>(null);
  const [indice, setIndice] = useState(0);
  const [respuestas, setRespuestas] = useState<Record<string, RespuestaNueva>>({});

  useEffect(() => {
    if (db && codigo) instrumentoActivo(db, codigo).then(setInst);
  }, [db, codigo]);

  if (!inst || !contexto || !acceso) return <Pantalla sinPestanas>{null}</Pantalla>;
  const pregunta = inst.preguntas[indice];
  const elegida = respuestas[pregunta.id];
  const ultima = indice === inst.preguntas.length - 1;

  const responder = (r: RespuestaNueva) => setRespuestas({ ...respuestas, [pregunta.id]: r });

  const terminar = async () => {
    if (!db) return;
    await guardarAplicacion(db, contexto.usuarioId, acceso.pacienteId, inst.id, Object.values(respuestas));
    refrescar();
    router.back();
  };

  const valoresEscala =
    pregunta.tipo === 'escala' && pregunta.minimo != null && pregunta.maximo != null
      ? Array.from({ length: pregunta.maximo - pregunta.minimo + 1 }, (_, i) => pregunta.minimo! + i)
      : [];

  return (
    <Pantalla sinPestanas>
      <Enlace texto={indice === 0 ? 'Salir' : 'Atrás'} icono="atras" onPress={() => (indice === 0 ? router.back() : setIndice(indice - 1))} />
      <View style={{ gap: 10, marginTop: espacio.s }}>
        <Etiqueta>{`${inst.nombre} · pregunta ${indice + 1} de ${inst.preguntas.length}`}</Etiqueta>
        <View style={{ height: 4, borderRadius: 2, backgroundColor: colores.borde }}>
          <View style={{ height: 4, borderRadius: 2, width: `${((indice + 1) / inst.preguntas.length) * 100}%`, backgroundColor: colores.coralBoton }} />
        </View>
        <Titulo style={{ marginTop: espacio.m }}>{pregunta.texto}</Titulo>
      </View>

      {pregunta.tipo === 'escala' && (
        <View style={{ marginTop: espacio.xl, gap: 10 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            {valoresEscala.map((v) => {
              const activo = elegida?.valor === v;
              return (
                <Pressable
                  key={v}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: activo }}
                  accessibilityLabel={`${v}`}
                  onPress={() => responder({ preguntaId: pregunta.id, valor: v })}
                  style={{
                    width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                    borderColor: activo ? colores.coralBoton : '#CFC9C0', backgroundColor: activo ? colores.coralBoton : 'transparent',
                  }}
                >
                  <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: activo ? colores.blanco : colores.texto }}>{v}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Secundario style={{ fontSize: 14 }}>{pregunta.etiqueta_minimo}</Secundario>
            <Secundario style={{ fontSize: 14 }}>{pregunta.etiqueta_maximo}</Secundario>
          </View>
        </View>
      )}

      {pregunta.tipo === 'opcion' && (
        <View style={{ marginTop: espacio.xl, gap: 10 }}>
          {pregunta.opciones.map((o) => {
            const activo = elegida?.opcionId === o.id;
            return (
              <Pressable
                key={o.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: activo }}
                onPress={() => responder({ preguntaId: pregunta.id, opcionId: o.id, valor: o.valor })}
                style={{
                  minHeight: 56, borderRadius: 14, paddingHorizontal: 18, justifyContent: 'center', borderWidth: 1.5,
                  borderColor: activo ? colores.texto : colores.bordeFuerte, backgroundColor: activo ? colores.texto : colores.blanco,
                }}
              >
                <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: activo ? colores.blanco : colores.texto }}>{o.etiqueta}</Text>
              </Pressable>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: 'auto', paddingTop: espacio.xl, gap: 12 }}>
        {inst.provisional ? <Aviso>Preguntas provisionales de ejemplo. Las definitivas las definirán los especialistas.</Aviso> : null}
        <Boton
          texto={ultima ? 'Guardar' : 'Siguiente'}
          deshabilitado={!elegida}
          onPress={() => (ultima ? terminar() : setIndice(indice + 1))}
        />
      </View>
    </Pantalla>
  );
}
