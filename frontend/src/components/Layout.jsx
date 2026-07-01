import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, LogOut } from 'lucide-react';

function Layout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const isDashboard = location.pathname === '/groups';
  const initial = (user.name || '?').charAt(0).toUpperCase();

  return (
    <div className="min-h-screen flex bg-surface font-body">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r border-line flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-line">
          <h1 className="text-lg font-bold text-brand-dark">Ledger</h1>
        </div>

        <nav className="flex-1 px-3 py-4">
          <button
            onClick={() => navigate('/groups')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              isDashboard
                ? 'bg-brand-light text-brand-dark'
                : 'text-muted hover:bg-surface'
            }`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
        </nav>

        <div className="px-3 py-4 border-t border-line">
          <div className="flex items-center gap-2.5 px-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand text-white flex items-center justify-center text-sm font-semibold shrink-0">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink truncate">{user.name}</p>
              <p className="text-xs text-muted truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-muted hover:bg-surface hover:text-danger transition-colors"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}

export default Layout;