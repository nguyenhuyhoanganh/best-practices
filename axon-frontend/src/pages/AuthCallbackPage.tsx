import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import type { TokenResponse } from '../types';

export default function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuthStore();
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;

    const code = searchParams.get('code');
    if (!code) {
      navigate('/login', { replace: true });
      return;
    }

    axios
      .get<TokenResponse>(`/auth/callback?code=${encodeURIComponent(code)}`, {
        withCredentials: true,
      })
      .then((res) => {
        login(res.data.access_token, res.data.user);
        navigate('/library', { replace: true });
      })
      .catch(() => {
        navigate('/login', { replace: true });
      });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <p className="text-gray-500">Authenticating…</p>
    </div>
  );
}
