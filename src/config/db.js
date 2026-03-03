import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'postgres',
  password: 'gtigti',
  port: 5433,
});

// Jeito certo de exportar em ESM:
export const query = (text, params) => pool.query(text, params);
export default pool;