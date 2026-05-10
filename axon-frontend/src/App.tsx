import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Layout } from './components/layout/Layout';
import { SSOCallback } from './pages/auth/SSOCallback';
import { LoginPage } from './pages/auth/LoginPage';
import { BrowsePage } from './pages/browse/BrowsePage';
import { DetailPage } from './pages/detail/DetailPage';
import { SubmitPage } from './pages/submit/SubmitPage';
import { MySubmissionsPage } from './pages/my-submissions/MySubmissionsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient();

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (adminOnly && user?.role !== 'ADMIN') return <Navigate to="/" replace />;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/auth/callback" element={<SSOCallback />} />
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<BrowsePage />} />
            <Route path="/best-practices/:id" element={<DetailPage />} />
            
            <Route path="/submit" element={
              <ProtectedRoute>
                <SubmitPage />
              </ProtectedRoute>
            } />
            
            <Route path="/my-submissions" element={
              <ProtectedRoute>
                <MySubmissionsPage />
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
