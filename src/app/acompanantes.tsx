import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Boton, Enlace, Etiqueta, Pantalla, Secundario, Segmentos, Titulo } from '@/components/ui';
import { acompanantesDe, crearInvitacion, retirarAcompanante } from '@/data/repositorio';
import { Permiso } from '@/features/permisos/permisos';
import { confirmar } from '@/lib/avisar';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

export default function Acompanantes() {
  const { db, contexto, acceso, refrescar } = useSesion();
  const [permiso, setPermiso] = useState<Permiso>('solo_ver');
  const [invitacion, setInvitacion] = useState<{ codigo: string } | null>(null);
  const lista = useDatos((db, u, p) => acompanantesDe(db, u, p)) ?? [];
  if (!contexto || !acceso) return null;
  const administra = acceso.puedeAdministrar;

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Perfil" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 6, marginTop: espacio.s, marginBottom: espacio.l }}>
        <Titulo>Acompañantes</Titulo>
        <Secundario style={{ fontSize: 17 }}>
          {administra ? 'Personas que le ayudan a llevar su seguimiento.' : `Personas que acompañan a ${acceso.nombre}. Solo ${acceso.nombre} puede cambiarlas.`}
        </Secundario>
      </View>

      <View style={{ borderTopWidth: 1, borderColor: colores.borde }}>
        {lista.map((a) => (
          <View key={a.id} style={{ minHeight: 72, paddingVertical: 10, borderBottomWidth: 1, borderColor: colores.borde, flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colores.coralTenue, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 17, color: colores.coralTexto }}>{a.nombre[0]}</Text>
            </View>
            <View style={{ flex: 1, gap: 3 }}>
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: colores.texto }}>{a.nombre}</Text>
              <Secundario style={{ fontSize: 15 }}>{`${a.parentesco ?? ''} · ${a.permiso}`}</Secundario>
            </View>
            {administra && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Retirar a ${a.nombre}`}
                onPress={() =>
                  confirmar('Retirar acompañante', `${a.nombre} dejará de ver y registrar sus datos de inmediato. Lo que ya registró se conserva.`, 'Retirar', async () => {
                    if (db) await retirarAcompanante(db, contexto.usuarioId, acceso.pacienteId, a.id);
                    refrescar();
                  })
                }
                style={{ minHeight: 48, paddingHorizontal: 8, justifyContent: 'center' }}
              >
                <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 16, color: colores.coralTexto }}>Retirar</Text>
              </Pressable>
            )}
          </View>
        ))}
        {lista.length === 0 && <Secundario style={{ paddingVertical: espacio.m }}>Todavía no hay acompañantes.</Secundario>}
      </View>

      {administra && (
        <View style={{ marginTop: espacio.xl, gap: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Etiqueta>Invitar a alguien</Etiqueta>
            <Secundario style={{ fontSize: 14 }}>{`${lista.length} de 3`}</Secundario>
          </View>
          <Segmentos
            opciones={[
              { valor: 'ver_registrar', texto: 'Ver y registrar' },
              { valor: 'solo_ver', texto: 'Solo ver' },
            ]}
            valor={permiso}
            onCambio={setPermiso}
          />
          {invitacion ? (
            <View style={{ gap: 4 }}>
              <Text accessibilityLabel={`Código ${invitacion.codigo.split('').join(' ')}`} style={{ fontFamily: fuentes.titulo, fontSize: 40, letterSpacing: 6, color: colores.texto }}>
                {invitacion.codigo}
              </Text>
              <Secundario style={{ fontSize: 15 }}>Válido por 48 horas · un solo uso</Secundario>
            </View>
          ) : null}
          <Boton
            texto={invitacion ? 'Generar otro código' : 'Generar código de invitación'}
            deshabilitado={lista.length >= 3}
            onPress={async () => {
              if (db) setInvitacion(await crearInvitacion(db, contexto.usuarioId, acceso.pacienteId, permiso));
            }}
          />
        </View>
      )}

      <Secundario style={{ marginTop: 'auto', paddingTop: espacio.xl, fontSize: 15 }}>
        Lo que registra un acompañante se guarda como “observado”, aparte de lo que reporta el paciente.
      </Secundario>
    </Pantalla>
  );
}
