import { Pool } from "pg";

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST,
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB,
});

export const query = async (
  text: string,
  params?: (string | number | boolean | Date | null | undefined)[],
) => {
  try {
    return await pool.query(text, params);
  } catch (error) {
    console.error("Database Query Error:", error);
    throw error;
  }
};
