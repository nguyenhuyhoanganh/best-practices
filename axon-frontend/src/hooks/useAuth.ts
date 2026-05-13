import { useAuthStore } from '../store/authStore';

export const useAuth = () => useAuthStore();

export const useIsCreator = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'AX_CREATOR' || role === 'ADMIN';
};

export const useIsSupporter = () => {
  const role = useAuthStore((s) => s.user?.role);
  return role === 'AX_SUPPORTER' || role === 'ADMIN';
};

export const useIsAdmin = () => useAuthStore((s) => s.user?.role) === 'ADMIN';
