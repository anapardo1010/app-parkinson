import initSqlJs from 'sql.js/dist/sql-asm.js';
import type { Db, Valor } from './tipos';

const CLAVE = 'parkinson-demo-db';

function aBase64(bytes: Uint8Array): string {
  let binario = '';
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binario += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binario);
}

function deBase64(texto: string): Uint8Array {
  const binario = atob(texto);
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i++) bytes[i] = binario.charCodeAt(i);
  return bytes;
}

/**
 * Conexión para la vista previa web de la demo: SQLite compilado a JavaScript (sql.js).
 * Guarda una copia en el navegador para que los cambios sobrevivan a recargar la página.
 * Esto es solo para enseñar la demo; la app real usa expo-sqlite en el celular.
 */
export async function abrirConexion(): Promise<Db> {
  const SQL = await initSqlJs();
  let guardada: string | null = null;
  try {
    guardada = localStorage.getItem(CLAVE);
  } catch {
    guardada = null;
  }
  let db = guardada ? new SQL.Database(deBase64(guardada)) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');

  let pendiente: ReturnType<typeof setTimeout> | null = null;
  const guardar = () => {
    if (pendiente) clearTimeout(pendiente);
    pendiente = setTimeout(() => {
      try {
        localStorage.setItem(CLAVE, aBase64(db.export()));
        db.run('PRAGMA foreign_keys = ON;');
      } catch {
        // Sin almacenamiento disponible: la demo sigue funcionando en memoria.
      }
    }, 400);
  };

  let enTransaccion = false;

  const conexion: Db = {
    ejecutar: async (sql) => {
      db.exec(sql);
      if (!enTransaccion) guardar();
    },
    correr: async (sql, parametros: Valor[] = []) => {
      db.run(sql, parametros);
      if (!enTransaccion) guardar();
    },
    todos: async <T,>(sql: string, parametros: Valor[] = []) => {
      const consulta = db.prepare(sql);
      consulta.bind(parametros);
      const filas: T[] = [];
      while (consulta.step()) filas.push(consulta.getAsObject() as T);
      consulta.free();
      return filas;
    },
    primero: async <T,>(sql: string, parametros: Valor[] = []) => {
      const filas = await conexion.todos<T>(sql, parametros);
      return filas[0] ?? null;
    },
    transaccion: async (tarea) => {
      db.exec('BEGIN');
      enTransaccion = true;
      try {
        await tarea();
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      } finally {
        enTransaccion = false;
        guardar();
      }
    },
    destruir: async () => {
      if (pendiente) clearTimeout(pendiente);
      db.close();
      try {
        localStorage.removeItem(CLAVE);
      } catch {
        // nada que borrar
      }
      db = new SQL.Database();
    },
  };
  return conexion;
}
