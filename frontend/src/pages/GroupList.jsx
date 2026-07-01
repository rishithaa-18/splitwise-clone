import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [newGroupName, setNewGroupName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchGroups = async () => {
    try {
      const res = await api.get('/groups/my-groups');
      setGroups(res.data.groups);
    } catch (err) {
      setError('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setActionLoading(true);
    setActionError('');
    try {
      await api.post('/groups/create', { name: newGroupName.trim() });
      setNewGroupName('');
      fetchGroups();
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
      fetchGroups();
    } catch (err) {
      setActionError(err.response?.data?.error || 'Failed to join group');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-paper font-body">
      {/* Header */}
      <header className="border-b border-line px-6 py-5 flex justify-between items-center">
        <div>
          <p className="text-xs uppercase tracking-widest text-ink/50">Ledger</p>
          <h1 className="font-display text-2xl font-semibold text-ink">
            Hi, {user.name || 'there'}
          </h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-ink/50 hover:text-owed transition-colors"
        >
          Log out
        </button>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Create / Join */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <form onSubmit={handleCreateGroup} className="bg-white border border-line rounded-xl p-6 shadow-sm">
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-2 font-medium">
              Start a new ledger
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. Goa Trip"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 border border-line rounded-sm px-3 py-2 text-sm bg-paper focus:outline-none focus:border-accent"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-ink text-paper px-4 py-2 rounded-sm text-sm font-medium hover:bg-ink/90 disabled:opacity-40 transition-colors"
              >
                Create
              </button>
            </div>
          </form>

          <form onSubmit={handleJoinGroup} className="bg-white border border-line rounded-sm p-4">
            <label className="block text-xs uppercase tracking-wide text-ink/50 mb-2 font-medium">
              Join with a code
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 border border-line rounded-sm px-3 py-2 text-sm bg-paper focus:outline-none focus:border-accent font-mono"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-accent text-white px-4 py-2 rounded-sm text-sm font-medium hover:bg-accent/90 disabled:opacity-40 transition-colors"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {actionError && (
          <div className="border border-owed/30 bg-owed/5 text-owed text-sm px-3 py-2 rounded-sm mb-6">
            {actionError}
          </div>
        )}

        {/* Group list */}
        <h2 className="font-display text-lg font-semibold text-ink mb-3">Your Groups</h2>

        {loading && <p className="text-ink/40 text-sm">Loading groups…</p>}
        {error && <p className="text-owed text-sm">{error}</p>}
        {!loading && groups.length === 0 && (
          <div className="border border-dashed border-line rounded-sm p-8 text-center">
            <p className="text-ink/50 text-sm">No groups yet.</p>
            <p className="text-ink/40 text-xs mt-1">Create one above, or join a friend's with their invite code.</p>
          </div>
        )}

        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="group bg-white border border-line rounded-sm px-4 py-3 cursor-pointer hover:border-ink/30 transition-colors flex justify-between items-center"
            >
              <div>
                <p className="font-display font-semibold text-ink">{group.name}</p>
                <p className="text-xs text-ink/40 mt-0.5">
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} ·{' '}
                  <span className="font-mono">{group.inviteCode}</span>
                </p>
              </div>
              <span className="text-ink/30 group-hover:text-ink/60 group-hover:translate-x-0.5 transition-all">→</span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default GroupList;