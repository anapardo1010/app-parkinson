import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Cuadricula, FilaOpcion, Seccion, Selector } from '@/components/formulario';
import { Aviso, Boton, Enlace, Pantalla, Secundario, Titulo } from '@/components/ui';
import {
  agregarPrescripcion,
  catalogoMedicamentos,
  MedicamentoCatalogo,
  Opcion,
  opcionesDe,
  tratamientoActual,
} from '@/data/repositorio';
import { EJEMPLOS_MEDICAMENTO, HORAS_MEDICAMENTO } from '@/features/tratamiento/ejemplos';
import { avisar } from '@/lib/avisar';
import { horaLegible } from '@/lib/fechas';
import { notificacionesDisponibles, programarRecordatorios } from '@/notifications/recordatorios';
import { useSesion } from '@/session/Sesion';
import { espacio } from '@/theme';

/** Agregar un medicamento. En la DEMO viene prellenado con un ejemplo; basta con tocar "Guardar". */
export default function NuevoMedicamento() {
  const { db, contexto, acceso, refrescar } = useSesion();
  const [medicamentos, setMedicamentos] = useState<MedicamentoCatalogo[]>([]);
  const [unidades, setUnidades] = useState<Opcion[]>([]);
  const [medicamentoId, setMedicamentoId] = useState<string | null>(null);
  const [cantidad, setCantidad] = useState(1);
  const [unidad, setUnidad] = useState('tableta');
  const [horas, setHoras] = useState<string[]>([]);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    if (!db || !contexto || !acceso) return;
    (async () => {
      const [catalogo, uds, actual] = await Promise.all([
        catalogoMedicamentos(db),
        opcionesDe(db, 'unidad_dosis'),
        tratamientoActual(db, contexto.usuarioId, acceso.pacienteId),
      ]);
      // No se ofrecen los que ya toma; el ejemplo es el primero que todavía no tiene.
      const yaToma = new Set(actual.map((t) => t.medicamentoId));
      const disponibles = catalogo.filter((m) => !yaToma.has(m.id));
      setMedicamentos(disponibles);
      setUnidades(uds);
      const ejemplo = EJEMPLOS_MEDICAMENTO.find((e) => !yaToma.has(e.medicamentoId));
      if (ejemplo) {
        setMedicamentoId(ejemplo.medicamentoId);
        setCantidad(ejemplo.cantidad);
        setUnidad(ejemplo.unidad);
        setHoras(ejemplo.horas);
      } else {
        setMedicamentoId(disponibles[0]?.id ?? null);
        setHoras(['08:00']);
      }
    })();
  }, [db, contexto, acceso]);

  if (!contexto || !acceso) return <Pantalla sinPestanas>{null}</Pantalla>;

  const guardar = async () => {
    if (!db || !medicamentoId || !horas.length) return;
    setGuardando(true);
    try {
      await agregarPrescripcion(db, contexto.usuarioId, acceso.pacienteId, { medicamentoId, cantidad, unidad, horas });
      refrescar();
      // En el celular se programan los recordatorios con todas las horas del tratamiento.
      if (notificacionesDisponibles) {
        const todas = (await tratamientoActual(db, contexto.usuarioId, acceso.pacienteId)).flatMap((t) => t.horas);
        await programarRecordatorios(acceso.pacienteId, todas);
      }
      router.back();
    } catch (e) {
      setGuardando(false);
      avisar('No se pudo guardar', e instanceof Error ? e.message : String(e));
    }
  };

  const unidadTexto = unidades.find((u) => u.codigo === unidad)?.etiqueta ?? unidad;
  const plural = cantidad > 1 && unidad === 'tableta' ? `${unidadTexto}s` : unidadTexto;
  const cantidadTexto = String(cantidad).replace('.5', '½').replace(/^0½$/, '½');

  return (
    <Pantalla sinPestanas>
      <Enlace texto="Cancelar" icono="atras" onPress={() => router.back()} />
      <View style={{ gap: 8, marginTop: espacio.s }}>
        <Titulo>Agregar medicamento</Titulo>
        <Secundario>Copie los datos de su receta. Los cambios en su tratamiento los indica su médico.</Secundario>
      </View>

      <Seccion titulo="Medicamento">
        {medicamentos.map((m) => (
          <FilaOpcion key={m.id} titulo={m.nombre} detalle={m.presentacion} elegida={m.id === medicamentoId} onPress={() => setMedicamentoId(m.id)} />
        ))}
        {medicamentos.length === 0 && <Secundario>Ya agregó todos los medicamentos del catálogo de ejemplo.</Secundario>}
      </Seccion>

      <Seccion titulo="Cantidad en cada toma">
        <Selector
          texto={`${cantidadTexto} ${plural}`}
          etiquetaMenos="Menos"
          etiquetaMas="Más"
          sinMenos={cantidad <= 0.5}
          onMenos={() => setCantidad(Math.max(0.5, cantidad - 0.5))}
          onMas={() => setCantidad(cantidad + 0.5)}
        />
        <Cuadricula
          columnas={4}
          opciones={unidades.map((u) => ({ valor: u.codigo, texto: u.etiqueta }))}
          elegidas={[unidad]}
          onCambio={([u]) => setUnidad(u)}
        />
      </Seccion>

      <Seccion titulo="¿A qué horas la toma?" nota="Puede elegir varias. Le recordaremos a cada hora.">
        <Cuadricula
          varias
          opciones={HORAS_MEDICAMENTO.map((h) => ({ valor: h, texto: horaLegible(h).replace(':00', '') }))}
          elegidas={horas}
          onCambio={setHoras}
        />
      </Seccion>

      <View style={{ marginTop: 'auto', paddingTop: espacio.xl, gap: 12 }}>
        <Aviso>Demo: el formulario viene prellenado con un ejemplo para la presentación. Puede cambiar cualquier dato.</Aviso>
        <Boton texto="Guardar" icono="check" onPress={guardar} deshabilitado={!medicamentoId || !horas.length || guardando} />
      </View>
    </Pantalla>
  );
}
