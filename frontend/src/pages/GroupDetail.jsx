import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
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
      fetchAll();
    } catch (err) {
      setAddError(err.response?.data?.error || 'Failed to add expense');
    } finally {
      setAddLoading(false);
    }
  };

  const formatCurrency = (num) => `₹${Math.abs(num).toFixed(2)}`;

  return (
    <div className="p-8 max-w-4xl">
      <button
        onClick={() => navigate('/groups')}
        className="flex items-center gap-1.5 text-sm text-muted hover:text-ink transition-colors mb-5"
      >
        <ArrowLeft size={15} /> Back to dashboard
      </button>

      {loading && <p className="text-sm text-muted">Loading…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* Add expense */}
          <div className="bg-white rounded-xl border border-line p-5 mb-6">
            <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
              <Plus size={16} /> Log an expense
            </h2>
            <form onSubmit={handleAddExpense} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="What was it for?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="flex-1 border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
              />
              <input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.01"
                step="0.01"
                className="sm:w-28 border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand"
              />
              <button
                type="submit"
                disabled={addLoading}
                className="bg-brand text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-40 transition-colors"
              >
                {addLoading ? 'Adding…' : 'Add'}
              </button>
            </form>
            {addError && <p className="text-danger text-xs mt-2">{addError}</p>}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Balances */}
            <div className="bg-white rounded-xl border border-line p-5">
              <h2 className="text-sm font-semibold text-ink mb-4">Balances</h2>
              <div className="divide-y divide-line">
                {balances.map((b) => (
                  <div key={b.userId} className="flex justify-between items-baseline py-2 first:pt-0 last:pb-0">
                    <span className="text-sm text-ink">
                      {b.name} {b.userId === currentUser.id && <span className="text-muted">(you)</span>}
                    </span>
                    <span
                      className={`font-mono text-sm font-semibold ${
                        b.netBalance > 0 ? 'text-brand' : b.netBalance < 0 ? 'text-danger' : 'text-muted'
                      }`}
                    >
                      {b.netBalance > 0 && `+${formatCurrency(b.netBalance)}`}
                      {b.netBalance < 0 && `−${formatCurrency(b.netBalance)}`}
                      {b.netBalance === 0 && '—'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="border-t border-line mt-4 pt-4">
                <p className="text-xs font-semibold text-muted mb-3">SETTLE UP</p>
                {settlements.length === 0 ? (
                  <p className="text-sm text-brand">Everyone's settled up.</p>
                ) : (
                  <div className="space-y-2">
                    {settlements.map((s, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-surface rounded-lg px-3 py-2">
                        <span>
                          <span className="font-medium text-ink">{s.from.name}</span>
                          <span className="text-muted"> → </span>
                          <span className="font-medium text-ink">{s.to.name}</span>
                        </span>
                        <span className="font-mono font-semibold text-brand-dark">
                          {formatCurrency(s.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Expenses */}
            <div className="bg-white rounded-xl border border-line p-5">
              <h2 className="text-sm font-semibold text-ink mb-4">Expenses</h2>
              {expenses.length === 0 ? (
                <p className="text-sm text-muted">Nothing logged yet.</p>
              ) : (
                <div className="divide-y divide-line">
                  {expenses.map((exp) => (
                    <div key={exp.id} className="py-3 first:pt-0 last:pb-0 flex justify-between items-center">
                      <div>
                        <p className="text-sm text-ink font-medium">{exp.description}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {exp.paidBy.name} · split {exp.shares.length} ways
                        </p>
                      </div>
                      <p className="font-mono text-sm font-medium text-ink">{formatCurrency(exp.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupDetail;