import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/authStore';
import type { UserRole } from './types';

import Layout from './components/layout/Layout';
import LoginPage from './pages/LoginPage';
import AuthCallbackPage from './pages/AuthCallbackPage';
import LibraryPage from './pages/LibraryPage';
import DetailPage from './pages/DetailPage';
import RegisterPage from './pages/RegisterPage';
import MyPracticePage from './pages/MyPracticePage';
import ManagementPage from './pages/ManagementPage';
import DashboardPage from './pages/DashboardPage';
import AdminPage from './pages/AdminPage';
import MasterDataPage from './pages/MasterDataPage';
import UserManagementPage from './pages/UserManagementPage';

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 60_000 } },
});

function RequireAuth() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}

function RequireRole({ roles }: { roles: UserRole[] }) {
  const role = useAuthStore((s) => s.user?.role);
  return role && roles.includes(role) ? <Outlet /> : <Navigate to="/" replace />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          <Route element={<RequireAuth />}>
            <Route element={<Layout />}>
              <Route index element={<Navigate to="/library" replace />} />
              <Route path="/library" element={<LibraryPage />} />
              <Route path="/library/:id" element={<DetailPage />} />

              {/* Creator routes */}
              <Route element={<RequireRole roles={['AX_CREATOR', 'ADMIN']} />}>
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/my-practice" element={<MyPracticePage />} />
              </Route>

              {/* Supporter routes */}
              <Route element={<RequireRole roles={['AX_SUPPORTER', 'ADMIN']} />}>
                <Route path="/management" element={<ManagementPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
              </Route>

              {/* Admin-only routes */}
              <Route element={<RequireRole roles={['ADMIN']} />}>
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/admin/master-data" element={<MasterDataPage />} />
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
