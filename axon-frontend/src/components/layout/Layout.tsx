import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api';

const navItems = [
  { to: '/library', label: 'Library', icon: '📚', roles: ['USER', 'AX_CREATOR', 'AX_SUPPORTER', 'ADMIN'] },
  { to: '/dashboard', label: 'Dashboard', icon: '📊', roles: ['AX_SUPPORTER', 'ADMIN'] },
  { to: '/my-practice', label: 'My Practice', icon: '📋', roles: ['AX_CREATOR', 'ADMIN'] },
  { to: '/register', label: 'Register BP', icon: '➕', roles: ['AX_CREATOR', 'ADMIN'] },
  { to: '/management', label: 'Management', icon: '🛡️', roles: ['AX_SUPPORTER', 'ADMIN'] },
  { to: '/admin', label: 'Admin', icon: '⚙️', roles: ['ADMIN'] },
];

export default function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const visibleItems = navItems.filter((item) => user?.role && item.roles.includes(user.role));

  const handleLogout = async () => {
    try { await authApi.logout(); } catch { /* ignore */ }
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-[#0f1b2d] text-white transition-all duration-300 ${
          sidebarOpen ? 'w-60' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
            AX
          </div>
          {sidebarOpen && (
            <div>
              <div className="font-bold text-sm leading-tight">AXon</div>
              <div className="text-[10px] text-blue-300 leading-tight">Best Practice Platform</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
          {visibleItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg text-sm transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-base shrink-0">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.name}</div>
                <div className="text-[11px] text-gray-400 truncate">{user?.role}</div>
              </div>
            )}
          </div>
          {sidebarOpen && (
            <button
              onClick={handleLogout}
              className="mt-3 w-full text-xs text-gray-400 hover:text-white hover:bg-white/10 rounded-lg py-1.5 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 flex items-center gap-4 px-6 py-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-800 text-xl"
          >
            ☰
          </button>
          <span className="font-semibold text-gray-800">AXon Best Practice</span>
          <div className="flex-1" />
          <span className="text-sm text-gray-500">{user?.department}</span>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
