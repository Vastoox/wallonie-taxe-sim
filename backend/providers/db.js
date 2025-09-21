// backend/providers/db.js
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === "require" ? { rejectUnauthorized: false } : false,
});

export default async function db(query, params = []) {
  const { rows } = await pool.query(query, params);
  return rows;
}
