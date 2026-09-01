import { Pool, types } from 'pg';

// 将 timestamptz 统一返回为 ISO 字符串，避免跨 server action 边界时 Date 序列化不一致
types.setTypeParser(1184, (v) => (v ? new Date(v).toISOString() : v));

const globalForDb = globalThis as unknown as { dbPool?: Pool };

function createPool(): Pool {
  const base = {
    connectionString: process.env.DATABASE_URL as string,
    max: 10,
  };
  return process.env.DATABASE_SSL === 'true'
    ? new Pool({ ...base, ssl: { rejectUnauthorized: false } })
    : new Pool(base);
}

export const db = globalForDb.dbPool ?? createPool();

if (!globalForDb.dbPool) {
  globalForDb.dbPool = db;
}
