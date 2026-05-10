import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = useMutation({
    mutationFn: (data: any) => authApi.login(data),
    onSuccess: ({ data }) => {
      login(data.accessToken, data.user);
      navigate('/');
    },
    onError: () => {
      setError('Invalid username or password');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loginMutation.mutate({ username, password });
  };

  return (
    <div className="max-w-md mx-auto py-20">
      <div className="bg-white border border-gray-100 p-10 rounded-3xl shadow-xl shadow-gray-100 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black text-gray-900">Welcome Back</h1>
          <p className="text-gray-400 font-medium text-sm">Please sign in to your account</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-bold border border-red-100 animate-in fade-in slide-in-from-top-1">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Username</label>
            <input 
              type="text" required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="e.g. admin"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Password</label>
            <input 
              type="password" required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loginMutation.isPending}
            className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all disabled:opacity-50"
          >
            {loginMutation.isPending ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="pt-4 border-t border-gray-50 text-center">
          <p className="text-xs text-gray-400 font-medium italic">
            Default credentials for this environment: <br/>
            <span className="font-bold text-gray-500 not-italic">admin / 12345678</span>
          </p>
        </div>
      </div>
    </div>
  );
}
