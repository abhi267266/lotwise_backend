import { pool } from '../db.js';

export const migrate = async () => {
  // A little more flair for your console
  console.log('🔥 Nuke and Pave Migration Initiated... 🔥');

  try {
    // --- ADDED ---
    // Drop all tables first. CASCADE handles dependencies.
    console.log('...Dropping existing tables (if they exist)...');
    await pool.query(`
      DROP TABLE IF EXISTS trades CASCADE;
      DROP TABLE IF EXISTS lots CASCADE;
      DROP TABLE IF EXISTS realized_pnl CASCADE;
    `);

    // --- MODIFIED ---
    // Create all tables fresh.
    console.log('...Creating tables...');
    await pool.query(`
    CREATE TABLE IF NOT EXISTS trades (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      qty INTEGER NOT NULL,
      price NUMERIC(10, 2) NOT NULL,
      timestamp TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS lots (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      qty_remaining INTEGER NOT NULL,
      buy_price NUMERIC(10, 2) NOT NULL,
      timestamp TIMESTAMP NOT NULL
    );

    CREATE TABLE IF NOT EXISTS realized_pnl (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(10) NOT NULL,
      pnl NUMERIC(12, 2) NOT NULL,
      timestamp TIMESTAMP NOT NULL
    );
  `);

    console.log('✅ Database reset complete.');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  }
};

migrate();
