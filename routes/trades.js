import express from 'express';
import { addTrade, getTrades, getOpenPositions, getRealizedPnL } from '../controllers/trades.js';

const router = express.Router();

router.post('/trades', addTrade);
router.get('/trades', getTrades);
router.get('/positions', getOpenPositions);
router.get('/pnl', getRealizedPnL);

export default router;
