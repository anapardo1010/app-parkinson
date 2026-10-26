import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { InsigniaQuien } from '@/components/Encabezado';
import { Icono } from '@/components/Icono';
import { BarraProgreso } from '@/components/graficas';
import { Boton, Cuerpo, Enlace, Etiqueta, Pantalla, Secundario, Titulo } from '@/components/ui';
import {
  aplicacionDelDia,
  citasProximas,
  deshacerRegistro,
  dosisEnRango,
  guardarAplicacion,
  instrumentoActivo,
  primerosPasos,
  PrimerosPasos,
  registrarToma,
} from '@/data/repositorio';
import { fueTomada } from '@/features/adherencia/calculo';
import { aFecha, fechaHoraISO, fechaISO, fechaLarga, horaLegible, saludo, sumarDias } from '@/lib/fechas';
import { useDatos, useSesion } from '@/session/Sesion';
import { colores, espacio, fuentes } from '@/theme';

export default function Hoy() {
  const { db, contexto, acceso, refrescar } = useSesion();
  const [deshacer, setDeshacer] = useState<{ dosisId: string; texto: string } | null>(null);
  const ahora = new Date();
  const hoy = fechaISO(ahora);
  const fuente = acceso?.rol === 'paciente' ? 'paciente' : 'observado';

  const datos = useDatos(async (db, usuarioId, pacienteId) => {
    const [dosis, animo, cita, pasos] = await Promise.all([
      dosisEnRango(db, usuarioId, pacienteId, hoy, fechaISO(sumarDias(ahora, 2))),
      instrumentoActivo(db, 'animo-diario'),
      citasProximas(db, usuarioId, pacienteId),
      primerosPasos(db, usuarioId, pacienteId),
    ]);
    const animoHoy = await aplicacionDelDia(db, usuarioId, pacienteId, 'animo-diario', hoy, fuente);
    return { dosis, animo, animoHoy, cita: cita[0] ?? null, pasos };
  }, [fuente]);

  useEffect(() => {
    if (!deshacer) return;
    const t = setTimeout(() => setDeshacer(null), 8000);
    return () => clearTimeout(t);
  }, [deshacer]);

  if (!contexto || !acceso) return null;

  const todas = datos?.dosis ?? [];
  const dosis = todas.filter((d) => d.programada.startsWith(hoy));
  const pendientes = dosis.filter((d) => !d.estado);
  const proxima = pendientes[0] ?? null;
  // Si ya no quedan dosis hoy (o el tratamiento se agregó tarde), se muestra la primera de mañana.
  const deManana = proxima ? null : todas.find((d) => !d.programada.startsWith(hoy) && !d.estado) ?? null;
  const pasos = datos?.pasos;
  const sinTratamiento = pasos ? !pasos.medicamentos : false;
  const mostrarPasos = !!pasos && acceso.puedeRegistrar && !(pasos.perfil && pasos.medicamentos && pasos.cita);
  const mismaHora = proxima ? pendientes.filter((d) => d.programada === proxima.programada).length - 1 : 0;
  const tomadas = dosis.filter(fueTomada).length;
  const atrasada = proxima ? proxima.programada < fechaHoraISO(ahora) : false;

  const yaLaTome = async () => {
    if (!db || !proxima) return;
    await registrarToma(db, contexto.usuarioId, proxima.id, 'tomada');
    setDeshacer({ dosisId: proxima.id, texto: `${proxima.medicamento} registrada como tomada` });
    refrescar();
  };

  const elegirAnimo = async (valor: number) => {
    if (!db || !datos?.animo || !acceso.puedeRegistrar) return;
    await guardarAplicacion(db, contexto.usuarioId, acceso.pacienteId, datos.animo.id, [
      { preguntaId: datos.animo.preguntas[0].id, valor },
    ]);
    refrescar();
  };

  const preguntaAnimo = datos?.animo?.preguntas[0];
  const minimo = preguntaAnimo?.minimo ?? 1;
  const maximo = preguntaAnimo?.maximo ?? 5;
  const valoresAnimo = Array.from({ length: maximo - minimo + 1 }, (_, i) => minimo + i);
  const nombre = contexto.nombre.split(' ')[0];

  return (
    <View style={{ flex: 1 }}>
    <Pantalla>
      <View style={{ gap: espacio.xxl }}>
        <View style={{ gap: 8 }}>
          <InsigniaQuien />
          <Etiqueta style={{ marginTop: 8 }}>{fechaLarga(ahora)}</Etiqueta>
          <Titulo>{`${saludo(ahora)}, ${nombre}`}</Titulo>
        </View>

        {mostrarPasos && pasos && <ListaPrimerosPasos pasos={pasos} esPaciente={acceso.rol === 'paciente'} />}

        {/* Próxima dosis */}
        {!sinTratamiento && (
        <View style={{ gap: 6 }}>
          <Etiqueta>{proxima ? (atrasada ? 'Dosis pendiente' : 'Próxima dosis') : deManana ? 'Próxima dosis' : 'Dosis de hoy'}</Etiqueta>
          {proxima ? (
            <>
              <Text style={{ fontFamily: fuentes.tituloMedio, fontSize: 28, color: colores.texto, letterSpacing: -0.3 }}>
                {proxima.medicamento}
              </Text>
              <Cuerpo style={{ color: colores.textoSecundario }}>
                {`${proxima.cantidad} ${proxima.unidad}${proxima.presentacion ? ` · ${proxima.presentacion}` : ''} · ${horaLegible(proxima.programada)}`}
              </Cuerpo>
              {mismaHora > 0 && <Secundario>{`Y ${mismaHora} más a la misma hora`}</Secundario>}
              <View style={{ marginTop: 14, gap: 4 }}>
                {acceso.puedeRegistrar ? (
                  <>
                    <Boton texto="Ya la tomé" icono="check" onPress={yaLaTome} />
                    <View style={{ alignItems: 'center' }}>
                      <Enlace texto="Otras opciones" onPress={() => router.push(`/dosis/${proxima.id}`)} />
                    </View>
                  </>
                ) : (
                  <Secundario>Usted puede ver el tratamiento, pero no registrar dosis.</Secundario>
                )}
              </View>
            </>
          ) : deManana ? (
            <>
              <Text style={{ fontFamily: fuentes.tituloMedio, fontSize: 28, color: colores.texto, letterSpacing: -0.3 }}>
                {deManana.medicamento}
              </Text>
              <Cuerpo style={{ color: colores.textoSecundario }}>{`Mañana a las ${horaLegible(deManana.programada)}`}</Cuerpo>
              {dosis.length === 0 && <Secundario>Hoy ya no hay dosis. Le recordaremos a la hora.</Secundario>}
            </>
          ) : (
            <Cuerpo>No quedan dosis pendientes por hoy.</Cuerpo>
          )}
        </View>
        )}

        {/* Ánimo del día: lo define el instrumento configurable animo-diario */}
        {preguntaAnimo && (
          <View style={{ gap: 14 }}>
            <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 20, color: colores.texto }}>
              {fuente === 'paciente' ? preguntaAnimo.texto : acceso.puedeRegistrar ? `¿Cómo ve hoy a ${acceso.nombre}?` : `Ánimo de hoy`}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              {valoresAnimo.map((v) => {
                const activo = datos?.animoHoy?.puntaje === v;
                return (
                  <Pressable
                    key={v}
                    accessibilityRole="button"
                    accessibilityLabel={`Ánimo ${v} de ${maximo}`}
                    accessibilityState={{ selected: activo, disabled: !acceso.puedeRegistrar }}
                    disabled={!acceso.puedeRegistrar}
                    onPress={() => elegirAnimo(v)}
                    style={{
                      width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1.5,
                      borderColor: activo ? colores.coralBoton : '#CFC9C0',
                      backgroundColor: activo ? colores.coralBoton : 'transparent',
                      opacity: acceso.puedeRegistrar ? 1 : 0.45,
                    }}
                  >
                    <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: activo ? colores.blanco : colores.texto }}>{v}</Text>
                  </Pressable>
                );
              })}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Secundario style={{ fontSize: 14 }}>{preguntaAnimo.etiqueta_minimo}</Secundario>
              <Secundario style={{ fontSize: 14 }}>{preguntaAnimo.etiqueta_maximo}</Secundario>
            </View>
            {datos?.animo?.provisional ? (
              <Secundario style={{ fontSize: 13 }}>Pregunta provisional: la definirán el neurólogo y el psicólogo.</Secundario>
            ) : null}
          </View>
        )}

        {datos?.cita && (
          <View style={{ gap: 4 }}>
            <Etiqueta>Próxima cita</Etiqueta>
            <Cuerpo>{`${datos.cita.especialidad} · ${fechaLarga(aFecha(datos.cita.fecha_hora))}, ${horaLegible(datos.cita.fecha_hora)}`}</Cuerpo>
          </View>
        )}
      </View>

      {/* Avance del día */}
      {dosis.length > 0 && (
      <View style={{ marginTop: 'auto', paddingTop: espacio.xl, gap: 10 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Cuerpo style={{ fontSize: 17 }}>
            <Text style={{ fontFamily: fuentes.textoFuerte }}>{`${tomadas} de ${dosis.length}`}</Text> dosis tomadas hoy
          </Cuerpo>
          <Enlace texto="Ver mes" onPress={() => router.push('/calendario')} />
        </View>
        <BarraProgreso fraccion={dosis.length ? tomadas / dosis.length : 0} />
      </View>
      )}

    </Pantalla>
      {deshacer && (
        <View
          accessibilityLiveRegion="polite"
          style={{
            position: 'absolute', left: espacio.l, right: espacio.l, bottom: espacio.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            backgroundColor: colores.texto, borderRadius: 14, paddingLeft: 16, paddingRight: 6, minHeight: 56,
          }}
        >
          <Text style={{ flex: 1, fontFamily: fuentes.texto, fontSize: 15, color: colores.blanco }}>{deshacer.texto}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              if (db) await deshacerRegistro(db, contexto.usuarioId, deshacer.dosisId);
              setDeshacer(null);
              refrescar();
            }}
            style={{ minHeight: 48, paddingHorizontal: 14, justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fuentes.textoFuerte, fontSize: 16, color: '#FFB4AE' }}>Deshacer</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

/** Lista de primeros pasos para quien acaba de instalar la app. Desaparece al completarla. */
function ListaPrimerosPasos({ pasos, esPaciente }: { pasos: PrimerosPasos; esPaciente: boolean }) {
  const elementos = [
    { listo: pasos.perfil, titulo: 'Conocerle mejor', detalle: 'Tres preguntas sobre usted', ruta: '/cuestionario/perfil-inicial' },
    { listo: pasos.medicamentos, titulo: esPaciente ? 'Agregar sus medicamentos' : 'Agregar medicamentos', detalle: 'Para recibir recordatorios', ruta: '/medicamento/nuevo' },
    { listo: pasos.cita, titulo: esPaciente ? 'Agregar su próxima cita' : 'Agregar la próxima cita', detalle: 'Para tenerla a la mano', ruta: '/cita/nueva' },
  ];
  const hechos = elementos.filter((e) => e.listo).length;
  return (
    <View style={{ gap: 6 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Etiqueta>Primeros pasos</Etiqueta>
        <Secundario style={{ fontSize: 15 }}>{`${hechos} de ${elementos.length} listos`}</Secundario>
      </View>
      <Text style={{ fontFamily: fuentes.tituloMedio, fontSize: 24, color: colores.texto, letterSpacing: -0.3, marginBottom: 6 }}>
        {pasos.medicamentos ? 'Ya casi termina' : 'Empecemos por su tratamiento'}
      </Text>
      <View style={{ borderTopWidth: 1, borderColor: colores.borde }}>
        {elementos.map((e) => (
          <Pressable
            key={e.ruta}
            accessibilityRole="button"
            accessibilityLabel={`${e.titulo}. ${e.listo ? 'Listo' : 'Pendiente'}`}
            disabled={e.listo}
            onPress={() => router.push(e.ruta as never)}
            style={({ pressed }) => ({
              minHeight: 72, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 14,
              borderBottomWidth: 1, borderColor: colores.borde, opacity: pressed ? 0.7 : 1,
            })}
          >
            <View
              style={{
                width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                borderWidth: e.listo ? 0 : 1.5, borderColor: colores.bordeFuerte, backgroundColor: e.listo ? colores.verde : 'transparent',
              }}
            >
              {e.listo && <Icono nombre="check" tamano={18} color={colores.blanco} grosor={2.4} />}
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ fontFamily: fuentes.textoMedio, fontSize: 18, color: e.listo ? colores.textoSecundario : colores.texto }}>{e.titulo}</Text>
              <Secundario style={{ fontSize: 15 }}>{e.listo ? 'Listo' : e.detalle}</Secundario>
            </View>
            {!e.listo && <Icono nombre="adelante" tamano={20} color={colores.coralTexto} />}
          </Pressable>
        ))}
      </View>
    </View>
  );
}
