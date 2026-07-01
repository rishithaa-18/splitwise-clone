import pool from '../models/db.js';

// Add an expense to a group, split equally among all current group members
export const addExpense = async (req, res) => {
  const { groupId, description, amount } = req.body;
  const userId = req.userId; // person adding = payer by default

  if (!groupId || !description || !amount) {
    return res.status(400).json({ error: 'groupId, description, and amount are required' });
  }
  if (isNaN(amount) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Verify the payer is a member of this group
    const memberCheck = await client.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (memberCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    // Get all members of the group
    const membersResult = await client.query(
      'SELECT user_id FROM group_members WHERE group_id = $1',
      [groupId]
    );
    const members = membersResult.rows.map((r) => r.user_id);

    if (members.length === 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Group has no members' });
    }

    // Create the expense record
    const expenseResult = await client.query(
      'INSERT INTO expenses (group_id, paid_by, description, amount) VALUES ($1, $2, $3, $4) RETURNING id, description, amount, created_at',
      [groupId, userId, description.trim(), amount]
    );
    const expense = expenseResult.rows[0];

    // Split equally — handle rounding so shares always sum exactly to amount
    const totalCents = Math.round(Number(amount) * 100);
    const baseShareCents = Math.floor(totalCents / members.length);
    const remainder = totalCents - baseShareCents * members.length;

    const shareInsertPromises = members.map((memberId, index) => {
      // distribute the leftover pennies to the first few members
      const shareCents = baseShareCents + (index < remainder ? 1 : 0);
      const shareAmount = (shareCents / 100).toFixed(2);
      return client.query(
        'INSERT INTO expense_shares (expense_id, user_id, amount_owed) VALUES ($1, $2, $3)',
        [expense.id, memberId, shareAmount]
      );
    });
    await Promise.all(shareInsertPromises);

    await client.query('COMMIT');

    res.status(201).json({
      expense: {
        id: expense.id,
        groupId,
        description: expense.description,
        amount: Number(expense.amount),
        paidBy: userId,
        createdAt: expense.created_at,
        splitAmong: members.length,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error while adding expense' });
  } finally {
    client.release();
  }
};

// List all expenses for a group, with payer name and per-user share breakdown
export const getGroupExpenses = async (req, res) => {
  const { groupId } = req.params;
  const userId = req.userId;

  try {
    // Verify membership
    const memberCheck = await pool.query(
      'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
      [groupId, userId]
    );
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'You are not a member of this group' });
    }

    const expensesResult = await pool.query(
      `SELECT e.id, e.description, e.amount, e.created_at, e.paid_by, u.name AS paid_by_name
       FROM expenses e
       JOIN users u ON u.id = e.paid_by
       WHERE e.group_id = $1
       ORDER BY e.created_at DESC`,
      [groupId]
    );

    // Fetch shares for all these expenses in one query
    const expenseIds = expensesResult.rows.map((e) => e.id);
    let sharesByExpense = {};

    if (expenseIds.length > 0) {
      const sharesResult = await pool.query(
        `SELECT es.expense_id, es.user_id, es.amount_owed, u.name
         FROM expense_shares es
         JOIN users u ON u.id = es.user_id
         WHERE es.expense_id = ANY($1::int[])`,
        [expenseIds]
      );

      sharesByExpense = sharesResult.rows.reduce((acc, row) => {
        if (!acc[row.expense_id]) acc[row.expense_id] = [];
        acc[row.expense_id].push({
          userId: row.user_id,
          name: row.name,
          amountOwed: Number(row.amount_owed),
        });
        return acc;
      }, {});
    }

    const expenses = expensesResult.rows.map((e) => ({
      id: e.id,
      description: e.description,
      amount: Number(e.amount),
      paidBy: { id: e.paid_by, name: e.paid_by_name },
      createdAt: e.created_at,
      shares: sharesByExpense[e.id] || [],
    }));

    res.status(200).json({ expenses });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while fetching expenses' });
  }
};