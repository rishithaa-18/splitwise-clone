import express from 'express';
import { getGroupBalances } from '../controllers/settlement.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authenticate);

router.get('/group/:groupId', getGroupBalances);

export default router;