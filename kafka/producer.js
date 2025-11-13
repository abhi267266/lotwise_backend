// kafka/producer.js
import { Kafka } from 'kafkajs';

// In both kafka/producer.js and kafka/consumer.js

import dotenv from 'dotenv';
dotenv.config();

// ============ KAFKA CLIENT SETUP - RAILWAY COMPATIBLE ============
const kafka = new Kafka({
  clientId: 'lotwise-backend',
  brokers: (process.env.KAFKA_BOOTSTRAP_SERVERS || 'localhost:9092').split(','),
  ssl: process.env.KAFKA_SECURITY_PROTOCOL === 'SASL_SSL',
  sasl: {
    mechanism: (process.env.KAFKA_SASL_MECHANISM || 'plain').toLowerCase(),
    username: process.env.KAFKA_SASL_USERNAME,
    password: process.env.KAFKA_SASL_PASSWORD,
  },
});

const producer = kafka.producer({
  idempotent: true,
  maxInFlightRequests: 5,
  compression: 1, // Gzip compression
  allowAutoTopicCreation: true,
  transactionTimeout: 30000,
});

export const connectProducer = async () => {
  try {
    await producer.connect();
    console.log('✅ Kafka producer connected');
  } catch (err) {
    console.error('❌ Failed to connect producer:', err);
    throw err;
  }
};

export const sendTradeMessage = async (topic, message) => {
  try {
    await producer.send({
      topic,
      messages: [
        {
          value: JSON.stringify(message),
          key: message.symbol, // Use symbol as key for partitioning
        },
      ],
      timeout: 30000,
    });
    console.log(`📤 Sent message to ${topic}:`, message);
  } catch (err) {
    console.error('❌ Kafka send error:', err);
    throw err; // Re-throw to let the controller handle it
  }
};

export const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log('✅ Kafka producer disconnected');
  } catch (err) {
    console.error('❌ Error disconnecting producer:', err);
  }
};
