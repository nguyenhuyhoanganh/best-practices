import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/auth';

export function Header() {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (e) {
      console.error('Logout failed', e);
    }
    logout();
    navigate('/');
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-6 gap-6 sticky top-0 z-50">
      <Link to="/" className="font-bold text-xl text-blue-600 flex items-center gap-2">
        <span className="text-2xl">⚡</span> AXon
      </Link>
      
      <nav className="flex gap-4 flex-1 ml-4">
        <Link to="/" className="text-gray-600 hover:text-gray-900 font-medium">Browse</Link>
        <Link to="/?sort=trending" className="text-gray-600 hover:text-gray-900 font-medium">Trending</Link>
      </nav>

      <div className="flex items-center gap-4">
        {isAuthenticated ? (
          <>
            <Link to="/submit" className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors">
              + Submit
            </Link>
            
            <div className="relative group">
              <button className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900 py-2">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} className="w-8 h-8 rounded-full border border-gray-200" alt={user.name} />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold border border-blue-200">
                    {user?.name[0].toUpperCase()}
                  </div>
                )}
                <span className="max-w-[120px] truncate font-medium">{user?.name}</span>
                <span className="text-gray-400 text-xs">▼</span>
              </button>
              
              <div className="absolute right-0 mt-0 w-48 bg-white rounded-md shadow-xl border border-gray-100 hidden group-hover:block animate-in fade-in slide-in-from-top-1 duration-200 z-50">
                <div className="py-1">
                  <Link to="/my-submissions" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">My Submissions</Link>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">Admin Dashboard</Link>
                  )}
                  <div className="border-t border-gray-100 my-1"></div>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <Link 
            to="/login" 
            className="bg-blue-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
