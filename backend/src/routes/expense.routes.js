import express from 'express';
import { addExpense, getGroupExpenses } from '../controllers/expense.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

// All expense routes require authentication
router.use(authenticate);

router.post('/add', addExpense);
router.get('/group/:groupId', getGroupExpenses);

export default router;