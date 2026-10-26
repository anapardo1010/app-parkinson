import initSqlJs from 'sql.js';
import type { Db, Valor } from '@/data/db/tipos';

/** Base de datos en memoria para pruebas (SQLite en Node con sql.js). */
export async function crearDbPrueba(): Promise<Db> {
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  const conexion: Db = {
    ejecutar: async (sql) => {
      db.exec(sql);
    },
    correr: async (sql, p: Valor[] = []) => {
      db.run(sql, p);
    },
    todos: async <T,>(sql: string, p: Valor[] = []) => {
      const st = db.prepare(sql);
      st.bind(p);
      const filas: T[] = [];
      while (st.step()) filas.push(st.getAsObject() as T);
      st.free();
      return filas;
    },
    primero: async <T,>(sql: string, p: Valor[] = []) => (await conexion.todos<T>(sql, p))[0] ?? null,
    transaccion: async (tarea) => {
      db.exec('BEGIN');
      try {
        await tarea();
        db.exec('COMMIT');
      } catch (e) {
        db.exec('ROLLBACK');
        throw e;
      }
    },
    destruir: async () => db.close(),
  };
  return conexion;
}
