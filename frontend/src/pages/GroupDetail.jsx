import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';

function GroupDetail() {
  const { groupId } = useParams();
  const navigate = useNavigate();

  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchAll = async () => {
    try {
      const [expensesRes, balancesRes] = await Promise.all([
        api.get(`/expenses/group/${groupId}`),
        api.get(`/settlements/group/${groupId}`),
      ]);
      setExpenses(expensesRes.data.expenses);
      setBalances(balancesRes.data.balances);
      setSettlements(balancesRes.data.settlements);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load group data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId]);

  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!description.trim() || !amount) return;
    setAddLoading(true);
    setAddError('');

    try {
      await api.post('/expenses/add', {
        groupId: Number(groupId),
        description: description.trim(),
        amount: Number(amount),
      });
      setDescription('');
      setAmount('');
      fetchAll(); // refresh expenses + balances together
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setAddLoading(false);
    }
  };

  const formatCurrency = (num) => `₹${Math.abs(num).toFixed(2)}`;

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => navigate('/groups')}
          className="text-sm text-blue-600 hover:underline mb-4"
        >
          ← Back to groups
        </button>

        {loading && <p className="text-gray-500 text-sm">Loading...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}

        {!loading && !error && (
          <>
            {/* Add expense form */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-3">Add an expense</h2>
              <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="Description (e.g. Dinner)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="flex-1 border rounded px-3 py-2 text-sm"
                />
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="0.01"
                  step="0.01"
                  className="sm:w-32 border rounded px-3 py-2 text-sm"
                />
                <button
                  type="submit"
                  disabled={addLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
                >
                  {addLoading ? 'Adding...' : 'Add'}
                </button>
              </form>
              {addError && <p className="text-red-600 text-xs mt-2">{addError}</p>}
              <p className="text-xs text-gray-400 mt-2">
                Split equally among all current group members. You're recorded as the payer.
              </p>
            </div>

            {/* Balances */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
              <h2 className="text-lg font-semibold mb-3">Balances</h2>
              <div className="space-y-1 mb-4">
                {balances.map((b) => (
                  <div key={b.userId} className="flex justify-between text-sm">
                    <span className={b.userId === currentUser.id ? 'font-semibold' : ''}>
                      {b.name} {b.userId === currentUser.id && '(you)'}
                    </span>
                    <span
                      className={
                        b.netBalance > 0
                          ? 'text-green-600'
                          : b.netBalance < 0
                          ? 'text-red-600'
                          : 'text-gray-400'
                      }
                    >
                      {b.netBalance > 0 && `gets back ${formatCurrency(b.netBalance)}`}
                      {b.netBalance < 0 && `owes ${formatCurrency(b.netBalance)}`}
                      {b.netBalance === 0 && 'settled up'}
                    </span>
                  </div>
                ))}
              </div>

              <h3 className="text-sm font-semibold mb-2 text-gray-700">Suggested settlements</h3>
              {settlements.length === 0 ? (
                <p className="text-sm text-gray-400">Everyone's settled up 🎉</p>
              ) : (
                <div className="space-y-1">
                  {settlements.map((s, idx) => (
                    <div key={idx} className="text-sm bg-gray-50 rounded px-3 py-2">
                      <span className="font-medium">{s.from.name}</span> pays{' '}
                      <span className="font-medium">{s.to.name}</span>{' '}
                      <span className="text-blue-600 font-semibold">{formatCurrency(s.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Expense list */}
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <h2 className="text-lg font-semibold mb-3">Expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-sm text-gray-400">No expenses yet.</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="border-b pb-2 last:border-b-0">
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-sm">{exp.description}</p>
                        <p className="text-sm font-semibold">{formatCurrency(exp.amount)}</p>
                      </div>
                      <p className="text-xs text-gray-500">
                        Paid by {exp.paidBy.name} · split among {exp.shares.length}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default GroupDetail;