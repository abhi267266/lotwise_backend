// kafka/consumer.js
import { Kafka } from 'kafkajs';
import {pool} from '../db.js';

// In both kafka/producer.js and kafka/consumer.js

const kafka = new Kafka({
  clientId: 'my-app',
  brokers: [process.env.KAFKA_BOOTSTRAP_SERVERS],
  sasl: {
    mechanism: 'plain',
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  },
  ssl: process.env.KAFKA_SECURITY_PROTOCOL === 'SASL_SSL',
});
const consumer = kafka.consumer({ groupId: 'lotwise-group' });

export const startConsumer = async () => {
  try {
    await consumer.connect();
    console.log('✅ Kafka consumer connected');

    await consumer.subscribe({ topic: 'trades', fromBeginning: true });

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const trade = JSON.parse(message.value.toString());
          console.log('📩 Received trade:', trade);
          await processTrade(trade);
        } catch (err) {
          console.error('❌ Error processing message:', err);
        }
      },
    });
  } catch (err) {
    console.error('❌ Failed to start consumer:', err);
    throw err;
  }
};

const processTrade = async (trade) => {
  const { symbol, qty, price, timestamp } = trade;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    if (qty > 0) {
      // 🟢 BUY — create a new lot
      await client.query(
        `INSERT INTO lots (symbol, qty_remaining, buy_price, timestamp)
         VALUES ($1, $2, $3, $4)`,
        [symbol, qty, price, timestamp]
      );
    } else {
      // 🔴 SELL — apply FIFO to close existing lots
      let qtyToSell = Math.abs(qty);
      let realizedPnL = 0;

      const { rows: openLots } = await client.query(
        `SELECT * FROM lots WHERE symbol = $1 AND qty_remaining > 0 ORDER BY timestamp ASC`,
        [symbol]
      );

      for (const lot of openLots) {
        if (qtyToSell <= 0) break;

        const sellQty = Math.min(qtyToSell, lot.qty_remaining);
        const pnl = (price - lot.buy_price) * sellQty;
        realizedPnL += pnl;

        await client.query(
          `UPDATE lots SET qty_remaining = qty_remaining - $1 WHERE id = $2`,
          [sellQty, lot.id]
        );

        qtyToSell -= sellQty;
      }

      await client.query(
        `INSERT INTO realized_pnl (symbol, pnl, timestamp)
         VALUES ($1, $2, $3)`,
        [symbol, realizedPnL, timestamp]
      );
    }

    await client.query('COMMIT');
    console.log(`💰 Processed trade for ${symbol}: qty=${qty}, price=${price}`);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Error processing trade:', err);
  } finally {
    client.release();
  }
};
