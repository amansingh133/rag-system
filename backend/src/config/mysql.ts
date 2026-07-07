import mysql from 'mysql2/promise';
import { env } from './env.js';

let pool: mysql.Pool | null = null;

export async function initMySQL(): Promise<void> {
  pool = mysql.createPool({
    host: env.MYSQL_HOST,
    port: env.MYSQL_PORT,
    user: env.MYSQL_USER,
    password: env.MYSQL_PASSWORD,
    database: env.MYSQL_DB,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  const conn = await pool.getConnection();
  await conn.ping();
  conn.release();
  console.log('MySQL connected');
}

export function getMySQL(): mysql.Pool {
  if (!pool) throw new Error('MySQL not initialized');
  return pool;
}
