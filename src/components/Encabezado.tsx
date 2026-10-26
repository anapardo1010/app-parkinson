import { useSesion } from '@/session/Sesion';
import { Insignia } from './ui';

/** Muestra siempre quién está registrando y sobre qué paciente, como pide el diseño. */
export function InsigniaQuien() {
  const { contexto, acceso } = useSesion();
  if (!contexto || !acceso) return null;
  const nombre = contexto.nombre.split(' ')[0];
  const texto =
    acceso.rol === 'paciente'
      ? `Registrando: ${nombre} (paciente)`
      : acceso.puedeRegistrar
        ? `${nombre}, acompañante de ${acceso.nombre}`
        : `${nombre}, acompañante de ${acceso.nombre} · solo ver`;
  return <Insignia texto={texto} />;
}
