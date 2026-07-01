import pool from '../models/db.js';

// Calculate net balance for each group member, then simplify into minimum transactions
export const getGroupBalances = async (req, res) => {
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

    // Get all members
    const membersResult = await pool.query(
      `SELECT u.id, u.name
       FROM group_members gm
       JOIN users u ON u.id = gm.user_id
       WHERE gm.group_id = $1`,
      [groupId]
    );
    const members = membersResult.rows; // [{id, name}]

    // Net balance = total paid - total owed, per user
    const paidResult = await pool.query(
      `SELECT paid_by AS user_id, COALESCE(SUM(amount), 0) AS total_paid
       FROM expenses
       WHERE group_id = $1
       GROUP BY paid_by`,
      [groupId]
    );

    const owedResult = await pool.query(
      `SELECT es.user_id, COALESCE(SUM(es.amount_owed), 0) AS total_owed
       FROM expense_shares es
       JOIN expenses e ON e.id = es.expense_id
       WHERE e.group_id = $1
       GROUP BY es.user_id`,
      [groupId]
    );

    const paidMap = Object.fromEntries(paidResult.rows.map((r) => [r.user_id, Number(r.total_paid)]));
    const owedMap = Object.fromEntries(owedResult.rows.map((r) => [r.user_id, Number(r.total_owed)]));

    // net > 0 means they are owed money; net < 0 means they owe money
    const balances = members.map((m) => {
      const paid = paidMap[m.id] || 0;
      const owed = owedMap[m.id] || 0;
      const net = Math.round((paid - owed) * 100) / 100;
      return { userId: m.id, name: m.name, net };
    });

    // Simplify debts: minimum transactions using greedy max-heap approach
    const transactions = simplifyDebts(balances);

    res.status(200).json({
      balances: balances.map((b) => ({
        userId: b.userId,
        name: b.name,
        netBalance: b.net, // positive = gets money back, negative = owes money
      })),
      settlements: transactions,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error while calculating balances' });
  }
};

// Greedy debt simplification: repeatedly match the biggest creditor with the biggest debtor
function simplifyDebts(balances) {
  const EPSILON = 0.01;

  // Work on copies so we don't mutate the original balance objects
  const creditors = balances
    .filter((b) => b.net > EPSILON)
    .map((b) => ({ ...b }))
    .sort((a, b) => b.net - a.net);

  const debtors = balances
    .filter((b) => b.net < -EPSILON)
    .map((b) => ({ ...b, net: -b.net })) // store as positive "amount owed"
    .sort((a, b) => b.net - a.net);

  const transactions = [];
  let i = 0; // pointer into debtors
  let j = 0; // pointer into creditors

  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];

    const settledAmount = Math.min(debtor.net, creditor.net);
    const rounded = Math.round(settledAmount * 100) / 100;

    if (rounded > 0) {
      transactions.push({
        from: { userId: debtor.userId, name: debtor.name },
        to: { userId: creditor.userId, name: creditor.name },
        amount: rounded,
      });
    }

    debtor.net = Math.round((debtor.net - settledAmount) * 100) / 100;
    creditor.net = Math.round((creditor.net - settledAmount) * 100) / 100;

    if (debtor.net <= EPSILON) i++;
    if (creditor.net <= EPSILON) j++;
  }

  return transactions;
}