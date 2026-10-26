import * as Crypto from 'expo-crypto';

/** Identificadores UUID para registros nuevos (mismo formato que usará Supabase). */
export const nuevoId = () => Crypto.randomUUID();

/** Huella SHA-256 de un texto; se usa para no guardar los códigos de invitación en claro. */
export const huella = (texto: string) => Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, texto);
