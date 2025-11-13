// controllers/trades.js
import {pool} from '../db.js';
import { sendTradeMessage } from '../kafka/producer.js';

export const addTrade = async (req, res) => {
  try {
    const { symbol, qty, price, timestamp } = req.body;
    if (!symbol || !qty || !price || !timestamp)
      return res.status(400).json({ error: 'Missing required fields' });

    // Insert into DB
    const result = await pool.query(
      `INSERT INTO trades (symbol, qty, price, timestamp)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [symbol, qty, price, timestamp]
    );

    const trade = result.rows[0];

    // Send to Kafka
    await sendTradeMessage('trades', trade);

    res.status(201).json({ message: 'Trade added successfully', trade });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add trade' });
  }
};

// ✅ NEW: Fetch all trades (optionally emit Kafka message)
export const getTrades = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM trades ORDER BY timestamp ASC');
    const trades = result.rows;
    
    res.json(trades);
  } catch (err) {
    console.error('Error fetching trades:', err);
    res.status(500).json({ error: 'Failed to fetch trades' });
  }
};

// Example placeholders for next controllers
export const getOpenPositions = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT symbol, SUM(qty) AS open_qty
      FROM trades
      GROUP BY symbol
      HAVING SUM(qty) != 0
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching open positions' });
  }
};

export const getRealizedPnL = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT symbol, SUM(pnl) AS total_pnl
      FROM realized_pnl
      GROUP BY symbol
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching PnL' });
  }
};
