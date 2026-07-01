import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import groupRoutes from './routes/group.routes.js';
import expenseRoutes from './routes/expense.routes.js';
import settlementRoutes from './routes/settlement.routes.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://splitwise-clone-cyan.vercel.app"
  ],
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settlements', settlementRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Splitwise Clone API is running' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});