import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required on Railway
  },
});

pool.on('connect', () => {
  console.log('✅ Connected to PostgreSQL on Railway');
});
