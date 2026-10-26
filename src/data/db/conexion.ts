import * as SQLite from 'expo-sqlite';
import type { Db, Valor } from './tipos';

const NOMBRE = 'parkinson-demo.db';

/** Conexión en el celular con expo-sqlite. */
export async function abrirConexion(): Promise<Db> {
  const db = await SQLite.openDatabaseAsync(NOMBRE);
  await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

  return {
    ejecutar: (sql) => db.execAsync(sql),
    correr: async (sql, parametros: Valor[] = []) => {
      await db.runAsync(sql, parametros);
    },
    todos: <T,>(sql: string, parametros: Valor[] = []) => db.getAllAsync<T>(sql, parametros),
    primero: <T,>(sql: string, parametros: Valor[] = []) => db.getFirstAsync<T>(sql, parametros),
    transaccion: (tarea) => db.withTransactionAsync(tarea),
    destruir: async () => {
      await db.closeAsync();
      await SQLite.deleteDatabaseAsync(NOMBRE);
    },
  };
}
