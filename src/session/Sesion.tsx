import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { abrirConexion } from '@/data/db/conexion';
import type { Db } from '@/data/db/tipos';
import { AccesoPaciente, contextoDeUsuario, ContextoUsuario, prepararBase } from '@/data/repositorio';

/**
 * Sesión de la DEMO: no hay inicio de sesión real. Se elige "Entrar como María / Juan / Laura"
 * para enseñar cómo cambian los permisos. En producción, aquí entra Supabase Auth.
 */

type ValorSesion = {
  db: Db | null;
  error: string | null;
  contexto: ContextoUsuario | null;
  acceso: AccesoPaciente | null; // paciente que se está viendo
  version: number;
  entrar: (usuarioId: string) => Promise<void>;
  salir: () => void;
  elegirPaciente: (pacienteId: string) => void;
  refrescar: () => void;
  reiniciarDemo: () => Promise<void>;
};

const Contexto = createContext<ValorSesion | null>(null);

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const [db, setDb] = useState<Db | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [contexto, setContexto] = useState<ContextoUsuario | null>(null);
  const [pacienteId, setPacienteId] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const conexion = await abrirConexion();
        await prepararBase(conexion);
        setDb(conexion);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      }
    })();
  }, []);

  const entrar = useCallback(
    async (usuarioId: string) => {
      if (!db) return;
      const ctx = await contextoDeUsuario(db, usuarioId);
      setContexto(ctx);
      setPacienteId(ctx.pacientes[0]?.pacienteId ?? null);
    },
    [db],
  );

  const refrescar = useCallback(() => {
    setVersion((v) => v + 1);
    if (db && contexto) contextoDeUsuario(db, contexto.usuarioId).then(setContexto);
  }, [db, contexto]);

  const reiniciarDemo = useCallback(async () => {
    if (!db) return;
    await db.destruir();
    setContexto(null);
    setPacienteId(null);
    const conexion = await abrirConexion();
    await prepararBase(conexion);
    setDb(conexion);
    setVersion((v) => v + 1);
  }, [db]);

  const acceso = contexto?.pacientes.find((p) => p.pacienteId === pacienteId) ?? null;

  const valor = useMemo<ValorSesion>(
    () => ({
      db, error, contexto, acceso, version, entrar, refrescar, reiniciarDemo,
      salir: () => {
        setContexto(null);
        setPacienteId(null);
      },
      elegirPaciente: setPacienteId,
    }),
    [db, error, contexto, acceso, version, entrar, refrescar, reiniciarDemo],
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}

export function useSesion() {
  const v = useContext(Contexto);
  if (!v) throw new Error('useSesion debe usarse dentro de ProveedorSesion');
  return v;
}

/**
 * Carga datos para una pantalla y los vuelve a cargar al regresar a ella o cuando
 * cambia algo (por ejemplo, al registrar una dosis).
 */
export function useDatos<T>(cargar: (db: Db, usuarioId: string, pacienteId: string) => Promise<T>, deps: unknown[] = []) {
  const { db, contexto, acceso, version } = useSesion();
  const [datos, setDatos] = useState<T | null>(null);
  const cargarRef = useRef(cargar);
  cargarRef.current = cargar;

  const recargar = useCallback(() => {
    if (!db || !contexto || !acceso) return;
    let vigente = true;
    cargarRef.current(db, contexto.usuarioId, acceso.pacienteId).then((r) => {
      if (vigente) setDatos(r);
    });
    return () => {
      vigente = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [db, contexto, acceso, version, ...deps]);

  useFocusEffect(recargar);
  return datos;
}
