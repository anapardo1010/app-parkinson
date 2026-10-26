import { Redirect } from 'expo-router';
import { useSesion } from '@/session/Sesion';

/** Punto de entrada: sin sesión va a la bienvenida; con sesión, a "Hoy". */
export default function Inicio() {
  const { contexto } = useSesion();
  return <Redirect href={contexto ? '/hoy' : '/bienvenida'} />;
}
