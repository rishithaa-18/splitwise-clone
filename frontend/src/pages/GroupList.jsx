import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, TrendingUp, TrendingDown, Wallet, ChevronRight } from 'lucide-react';
import api from '../api/axios';

function GroupList() {
  const [groups, setGroups] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [totals, setTotals] = useState({ owedToYou: 0, youOwe: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const groupsRes = await api.get('/groups/my-groups');
      const groupList = groupsRes.data.groups;
      setGroups(groupList);

      if (groupList.length === 0) {
        setLoading(false);
        return;
      }

      const [balancesResults, expensesResults] = await Promise.all([
        Promise.all(groupList.map((g) => api.get(`/settlements/group/${g.id}`))),
        Promise.all(groupList.map((g) => api.get(`/expenses/group/${g.id}`))),
      ]);

      let owedToYou = 0;
      let youOwe = 0;
      balancesResults.forEach((res) => {
        const mine = res.data.balances.find((b) => b.userId === user.id);
        if (mine) {
          if (mine.netBalance > 0) owedToYou += mine.netBalance;
          else youOwe += Math.abs(mine.netBalance);
        }
      });
      setTotals({ owedToYou, youOwe });

      const allExpenses = expensesResults.flatMap((res, idx) =>
        res.data.expenses.map((e) => ({ ...e, groupName: groupList[idx].name, groupId: groupList[idx].id }))
      );
      allExpenses.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentExpenses(allExpenses.slice(0, 5));
    } catch (err) {
      setError('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post('/groups/create', { name: newGroupName.trim() });
      setNewGroupName('');
      fetchDashboard();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to create group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoinGroup = async (e) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post('/groups/join', { inviteCode: joinCode.trim() });
      setJoinCode('');
      fetchDashboard();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (num) => `₹${num.toFixed(2)}`;
  const netTotal = totals.owedToYou - totals.youOwe;

  return (
    <div className="p-8 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink">Welcome back, {user.name}!</h1>
        <p className="text-sm text-muted mt-0.5">Here's what's happening with your ledger today.</p>
      </div>

      {loading && <p className="text-sm text-muted">Loading dashboard…</p>}
      {error && <p className="text-sm text-danger">{error}</p>}

      {!loading && !error && (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-brand rounded-xl p-5 text-white">
              <div className="flex items-center gap-2 text-white/80 text-xs font-medium mb-2">
                <Wallet size={14} /> Net Balance
              </div>
              <p className="text-2xl font-bold">
                {netTotal >= 0 ? '+' : '−'}{formatCurrency(Math.abs(netTotal))}
              </p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-line">
              <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2">
                <TrendingUp size={14} className="text-brand" /> You are owed
              </div>
              <p className="text-2xl font-bold text-brand">{formatCurrency(totals.owedToYou)}</p>
            </div>

            <div className="bg-white rounded-xl p-5 border border-line">
              <div className="flex items-center gap-2 text-muted text-xs font-medium mb-2">
                <TrendingDown size={14} className="text-danger" /> You owe
              </div>
              <p className="text-2xl font-bold text-danger">{formatCurrency(totals.youOwe)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: recent activity + groups */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-xl border border-line p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">Recent Activity</h2>
                {recentExpenses.length === 0 ? (
                  <p className="text-sm text-muted">No expenses logged yet.</p>
                ) : (
                  <div className="divide-y divide-line">
                    {recentExpenses.map((exp) => (
                      <div
                        key={exp.id}
                        onClick={() => navigate(`/groups/${exp.groupId}`)}
                        className="py-3 first:pt-0 last:pb-0 flex justify-between items-center cursor-pointer"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{exp.description}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {exp.groupName} · {new Date(exp.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <p className="text-sm font-mono font-medium text-ink">
                          {formatCurrency(exp.amount)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl border border-line p-5">
                <h2 className="text-sm font-semibold text-ink mb-4">Your Groups</h2>
                {groups.length === 0 ? (
                  <p className="text-sm text-muted">No groups yet — create or join one to get started.</p>
                ) : (
                  <div className="space-y-2">
                    {groups.map((group) => (
                      <div
                        key={group.id}
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="flex justify-between items-center px-3 py-3 rounded-lg hover:bg-surface cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-ink">{group.name}</p>
                          <p className="text-xs text-muted mt-0.5">
                            {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} ·{' '}
                            <span className="font-mono">{group.inviteCode}</span>
                          </p>
                        </div>
                        <ChevronRight size={16} className="text-muted" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Right: create/join */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-line p-5">
                <h2 className="text-sm font-semibold text-ink mb-3 flex items-center gap-1.5">
                  <Plus size={16} /> New Group
                </h2>
                <form onSubmit={handleCreateGroup} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Group name"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-brand"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-brand text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-dark disabled:opacity-40 transition-colors"
                  >
                    Create
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-line p-5">
                <h2 className="text-sm font-semibold text-ink mb-3">Join a Group</h2>
                <form onSubmit={handleJoinGroup} className="space-y-2">
                  <input
                    type="text"
                    placeholder="Invite code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="w-full border border-line rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:border-brand"
                  />
                  <button
                    type="submit"
                    disabled={actionLoading}
                    className="w-full bg-ink text-white py-2 rounded-lg text-sm font-medium hover:bg-ink/90 disabled:opacity-40 transition-colors"
                  >
                    Join
                  </button>
                </form>
                {actionError && <p className="text-danger text-xs mt-2">{actionError}</p>}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default GroupList;