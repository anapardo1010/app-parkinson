import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Icono } from '@/components/Icono';
import { Boton, Cuerpo, Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import { deshacerRegistro, DosisDetalle, motivosOmision, obtenerDosis, registrarToma } from '@/data/repositorio';
import { EstadoToma } from '@/features/adherencia/calculo';
import { horaLegible } from '@/lib/fechas';
import { useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

const ETIQUETA_ESTADO: Record<EstadoToma, string> = {
  tomada: 'Tomada a tiempo',
  tarde: 'Tomada tarde',
  no_tomada: 'No tomada',
};

export default function Dosis() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { db, contexto, acceso, refrescar } = useSesion();
  const [dosis, setDosis] = useState<DosisDetalle | null>(null);
  const [motivos, setMotivos] = useState<{ codigo: string; etiqueta: string }[]>([]);
  const [eligiendoMotivo, setEligiendoMotivo] = useState(false);

  useEffect(() => {
    if (!db || !contexto || !id) return;
    obtenerDosis(db, contexto.usuarioId, id).then(setDosis);
    motivosOmision(db).then(setMotivos);
  }, [db, contexto, id]);

  if (!contexto || !acceso || !dosis) return <Pantalla sinPestanas>{null}</Pantalla>;

  const registrar = async (estado: EstadoToma, motivo: string | null = null) => {
    if (!db) return;
    await registrarToma(db, contexto.usuarioId, dosis.id, estado, motivo);
    refrescar();
    router.back();
  };

  return (
    <Pantalla sinPestanas>
      <Pressable accessibilityRole="button" accessibilityLabel="Cerrar" onPress={() => router.back()} style={{ width: 48, height: 48, marginLeft: -10, alignItems: 'center', justifyContent: 'center' }}>
        <Icono nombre="cerrar" color={colores.texto} />
      </Pressable>

      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: espacio.xl }}>
        <View style={{ width: 88, height: 88, borderRadius: 44, backgroundColor: colores.coralTenue, alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          <Icono nombre="tratamiento" tamano={36} color={colores.coralTexto} grosor={1.5} />
        </View>
        <Etiqueta>{eligiendoMotivo ? '¿Por qué no la tomó? (opcional)' : 'Es hora de su medicamento'}</Etiqueta>
        <Titulo style={{ fontSize: 34, textAlign: 'center' }}>{dosis.medicamento}</Titulo>
        <Cuerpo style={{ color: colores.textoSecundario }}>
          {`${dosis.cantidad} ${dosis.unidad}${dosis.presentacion ? ` · ${dosis.presentacion}` : ''} · ${horaLegible(dosis.programada)}`}
        </Cuerpo>
        {dosis.estado && (
          <Secundario style={{ textAlign: 'center', marginTop: 8 }}>
            {`Registrada: ${ETIQUETA_ESTADO[dosis.estado]}${dosis.registradoPor ? ` · por ${dosis.registradoPor}` : ''}${dosis.fuente === 'observado' ? ' (acompañante)' : ''}`}
          </Secundario>
        )}
      </View>

      {!acceso.puedeRegistrar ? (
        <Secundario style={{ textAlign: 'center' }}>Usted puede ver esta dosis, pero no registrarla.</Secundario>
      ) : eligiendoMotivo ? (
        <View style={{ gap: 10 }}>
          {motivos.map((m) => (
            <Boton key={m.codigo} texto={m.etiqueta} variante="contorno" onPress={() => registrar('no_tomada', m.codigo)} />
          ))}
          <Boton texto="Omitir" variante="texto" onPress={() => registrar('no_tomada')} />
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <Boton texto="Tomada" icono="check" onPress={() => registrar('tomada')} />
          <Boton texto="Tomada tarde" icono="reloj" variante="contorno" onPress={() => registrar('tarde')} />
          <Boton texto="No la tomé" variante="texto" onPress={() => setEligiendoMotivo(true)} />
          {dosis.estado ? (
            <Pressable
              accessibilityRole="button"
              onPress={async () => {
                if (db) await deshacerRegistro(db, contexto.usuarioId, dosis.id);
                refrescar();
                router.back();
              }}
              style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 16, color: colores.coralTexto }}>Deshacer el último registro</Text>
            </Pressable>
          ) : (
            <Secundario style={{ textAlign: 'center', fontSize: 14 }}>Podrá deshacerlo después.</Secundario>
          )}
        </View>
      )}
    </Pantalla>
  );
}
