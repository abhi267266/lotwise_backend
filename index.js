import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import tradeRoutes from './routes/trades.js';
import { connectProducer } from './kafka/producer.js';
import { startConsumer } from './kafka/consumer.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: process.env.FRONTEND_URL,
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json());
app.use('/api', tradeRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  await connectProducer();
  await startConsumer();
  console.log(`🚀 Server running on port ${PORT}`);
});
