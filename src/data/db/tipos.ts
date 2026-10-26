export type Valor = string | number | null;

/**
 * Interfaz mínima de base de datos. La implementan:
 *  - conexion.ts      → celular (expo-sqlite)
 *  - conexion.web.ts  → navegador (sql.js), solo para la vista previa web de la demo
 * El resto de la app solo conoce esta interfaz.
 */
export interface Db {
  ejecutar(sql: string): Promise<void>;
  correr(sql: string, parametros?: Valor[]): Promise<void>;
  todos<T>(sql: string, parametros?: Valor[]): Promise<T[]>;
  primero<T>(sql: string, parametros?: Valor[]): Promise<T | null>;
  transaccion(tarea: () => Promise<void>): Promise<void>;
  /** Borra la base local por completo (solo para "Reiniciar demo"). */
  destruir(): Promise<void>;
}
