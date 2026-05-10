import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';

export function SSOCallback() {
  const [params] = useSearchParams();
  const { login } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    const code = params.get('code');
    if (!code) {
      navigate('/');
      return;
    }

    authApi.callback(code)
      .then(({ data }) => {
        login(data.accessToken, data.user);
        navigate('/');
      })
      .catch((err) => {
        console.error('SSO Callback failed', err);
        navigate('/');
      });
  }, [params, login, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-gray-500 font-medium">Authenticating with SSO...</p>
    </div>
  );
}
