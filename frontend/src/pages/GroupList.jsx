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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Hi, {user.name || 'there'} 👋</h1>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600"
          >
            Log out
          </button>
        </div>

        {/* Create / Join forms */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <form onSubmit={handleCreateGroup} className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium mb-2">Create a group</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Group name"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>

          <form onSubmit={handleJoinGroup} className="bg-white p-4 rounded-lg shadow-sm">
            <label className="block text-sm font-medium mb-2">Join with invite code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Invite code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="flex-1 border rounded px-3 py-2 text-sm"
              />
              <button
                type="submit"
                disabled={actionLoading}
                className="bg-green-600 text-white px-4 py-2 rounded text-sm hover:bg-green-700 disabled:opacity-50"
              >
                Join
              </button>
            </div>
          </form>
        </div>

        {actionError && (
          <div className="bg-red-100 text-red-700 text-sm p-2 rounded mb-4">
            {actionError}
          </div>
        )}

        {/* Group list */}
        <h2 className="text-lg font-semibold mb-3">Your Groups</h2>

        {loading && <p className="text-gray-500 text-sm">Loading groups...</p>}
        {error && <p className="text-red-600 text-sm">{error}</p>}
        {!loading && groups.length === 0 && (
          <p className="text-gray-500 text-sm">No groups yet — create or join one above.</p>
        )}

        <div className="space-y-2">
          {groups.map((group) => (
            <div
              key={group.id}
              onClick={() => navigate(`/groups/${group.id}`)}
              className="bg-white p-4 rounded-lg shadow-sm cursor-pointer hover:shadow-md transition flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{group.name}</p>
                <p className="text-xs text-gray-500">
                  {group.memberCount} member{group.memberCount !== 1 ? 's' : ''} · Code: {group.inviteCode}
                </p>
              </div>
              <span className="text-gray-400">→</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default GroupList;