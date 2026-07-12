import { BrowserRouter, Routes, Route } from 'react-router-dom';
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
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30000, retry: 1 } },
});

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/products" element={<Product />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/purchase" element={<Purchase />} />
          <Route path="/supplier" element={<Supplier />} />
          <Route path="/expense" element={<Expense />} />
          <Route path="/capital" element={<Capital />} />
          <Route path="/report" element={<Report />} />
          <Route path="/setting" element={<Setting />} />
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