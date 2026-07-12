import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import Sales from './pages/Sales';
import Product from './pages/Product';
import Stock from './pages/Stock';
import Purchase from './pages/Purchase';
import Report from './pages/Report';
import Expense from './pages/Expense';
import Capital from './pages/Capital';
import Supplier from './pages/Supplier';
import Setting from './pages/Setting';
import Login from './pages/Login';
import { useStore } from './store/useStore';
import { useOfflineSync } from './hooks/useOfflineSync';
import { ToastProvider } from './components/ui/Toast';
import { canAccess } from './config/permissions';
import { useEffect, type ReactNode } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

function ProtectedRoute({ path, children }: { path: string; children: ReactNode }) {
  const { user } = useStore();
  if (!user || !canAccess(path, user.role)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

function AppContent() {
  const { user, setOnline } = useStore();
  useOfflineSync();

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, [setOnline]);

  if (!user) return <Login />;

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <div className="max-w-lg mx-auto">
        <Routes>
          <Route path="/" element={<ProtectedRoute path="/"><Dashboard /></ProtectedRoute>} />
          <Route path="/sales" element={<ProtectedRoute path="/sales"><Sales /></ProtectedRoute>} />
          <Route path="/products" element={<ProtectedRoute path="/products"><Product /></ProtectedRoute>} />
          <Route path="/stock" element={<ProtectedRoute path="/stock"><Stock /></ProtectedRoute>} />
          <Route path="/purchase" element={<ProtectedRoute path="/purchase"><Purchase /></ProtectedRoute>} />
          <Route path="/supplier" element={<ProtectedRoute path="/supplier"><Supplier /></ProtectedRoute>} />
          <Route path="/expense" element={<ProtectedRoute path="/expense"><Expense /></ProtectedRoute>} />
          <Route path="/capital" element={<ProtectedRoute path="/capital"><Capital /></ProtectedRoute>} />
          <Route path="/report" element={<ProtectedRoute path="/report"><Report /></ProtectedRoute>} />
          <Route path="/setting" element={<ProtectedRoute path="/setting"><Setting /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
      <Navbar />
    </div>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}