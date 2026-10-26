import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Campo, Cuadricula, Seccion, Selector } from '@/components/formulario';
import { Aviso, Boton, Enlace, Pantalla, Secundario, Titulo } from '@/components/ui';
import { agregarCita, citasProximas, Opcion, opcionesDe } from '@/data/repositorio';
import { EJEMPLOS_CITA, HORAS_CITA } from '@/features/tratamiento/ejemplos';
import { avisar } from '@/lib/avisar';
import { fechaISO, fechaLarga, horaLegible, sumarDias } from '@/lib/fechas';
import { useSesion } from '@/session/Sesion';
import { espacio } from '@/theme';

/** Agregar una cita médica. En la DEMO viene prellenada con un ejemplo; basta con tocar "Guardar". */
export default function NuevaCita() {
  const { db, contexto, acceso, refrescar } = useSesion();
  const [especialidades, setEspecialidades] = useState<Opcion[]>([]);
  const [especialidad, setEspecialidad] = useState('neurologia');
  const [enDias, setEnDias] = useState(3);
  const [hora, setHora] = useState('10:00');
  const [medico, setMedico] = useState('');
  const [lugar, setLugar] = useState('');
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!db || !contexto || !acceso) return;
    (async () => {
      const [esp, citas] = await Promise.all([opcionesDe(db, 'especialidad'), citasProximas(db, contexto.usuarioId, acceso.pacienteId)]);
      setEspecialidades(esp);
      // El ejemplo es la primera especialidad que todavía no tiene cita.
      const conCita = new Set(citas.map((c) => c.especialidadCodigo));
      const ejemplo = EJEMPLOS_CITA.find((e) => !conCita.has(e.especialidad)) ?? EJEMPLOS_CITA[0];
      setEspecialidad(ejemplo.especialidad);
      setEnDias(ejemplo.enDias);
      setHora(ejemplo.hora);
      setMedico(ejemplo.medico);
      setLugar(ejemplo.lugar);
    })();
  }, [db, contexto, acceso]);

  if (!contexto || !acceso) return <Pantalla sinPestanas>{null}</Pantalla>;

  const dia = sumarDias(new Date(), enDias);
  const textoDia = enDias === 0 ? 'Hoy' : enDias === 1 ? 'Mañana' : fechaLarga(dia);

  const guardar = async () => {
    if (!db) return;
    setGuardando(true);
    try {
      await agregarCita(db, contexto.usuarioId, acceso.pacienteId, {
        especialidad, fechaHora: `${fechaISO(dia)}T${hora}`, medico: medico.trim(), lugar: lugar.trim(),
      });
      refrescar();
      router.back();
    } catch (e) {
      setGuardando(false);
      avisar('No se pudo guardar', e instanceof Error ? e.message : String(e));
    }
  };

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Cancelar" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 8, marginTop: espacio.s }}>
        <Titulo>Agregar cita</Titulo>
        <Secundario>La verá en "Hoy" y en su tratamiento, para tenerla a la mano.</Secundario>
      </View>

      <Seccion titulo="Especialidad">
        <Cuadricula
          columnas={2}
          opciones={especialidades.map((e) => ({ valor: e.codigo, texto: e.etiqueta }))}
          elegidas={[especialidad]}
          onCambio={([e]) => setEspecialidad(e)}
        />
      </Seccion>

      <Seccion titulo="Día">
        <Selector
          flechas
          texto={textoDia}
          etiquetaMenos="Día anterior"
          etiquetaMas="Día siguiente"
          sinMenos={enDias <= 0}
          onMenos={() => setEnDias(Math.max(0, enDias - 1))}
          onMas={() => setEnDias(enDias + 1)}
        />
      </Seccion>

      <Seccion titulo="Hora">
        <Cuadricula columnas={4} opciones={HORAS_CITA.map((h) => ({ valor: h, texto: horaLegible(h).replace(':00', '') }))} elegidas={[hora]} onCambio={([h]) => setHora(h)} />
      </Seccion>

      <Seccion titulo="Detalles">
        <Campo etiqueta="Médico o especialista" valor={medico} onCambio={setMedico} opcional />
        <Campo etiqueta="Lugar" valor={lugar} onCambio={setLugar} opcional />
      </Seccion>

      <View style={{ marginTop: 'auto', paddingTop: espacio.xl, gap: 12 }}>
        <Aviso>Demo: el formulario viene prellenado con un ejemplo ficticio para la presentación. Puede cambiar cualquier dato.</Aviso>
        <Boton texto="Guardar" icono="check" onPress={guardar} deshabilitado={guardando} />
      </View>
    </Pantalla>
  );
}
