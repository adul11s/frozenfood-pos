import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { login } from '../../services/api';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { setUser } = useStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await login(username, password);
      if (res.success && res.user) {
        setUser(res.user as Parameters<typeof setUser>[0]);
        navigate('/');
      } else {
        setError(res.message || 'Login gagal');
      }
    } catch {
      setError('Koneksi gagal. Pastikan GAS sudah di-deploy.');
    }
  };

  return (
    <div className="min-h-screen bg-bg-deep bg-glow flex items-center justify-center p-4">
      <form
        onSubmit={handleLogin}
        className="panel w-full max-w-sm p-8 space-y-5"
      >
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-ice to-ice-dim flex items-center justify-center mx-auto mb-3 shadow-lg shadow-ice/20">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#071a2b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="2" x2="12" y2="22" />
              <line x1="5" y1="6" x2="19" y2="18" />
              <line x1="19" y1="6" x2="5" y2="18" />
              <line x1="2" y1="12" x2="22" y2="12" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold font-display text-frost">FrozenPOS</h1>
          <p className="text-frost-dim text-xs mt-1 uppercase tracking-widest">Frozen Food Point of Sale</p>
        </div>

        {error && (
          <div className="bg-alert/15 text-alert text-sm p-3 rounded-lg text-center border border-alert/20">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full panel-2 px-4 py-3 text-sm text-frost placeholder:text-frost-dim outline-none focus:border-ice-dim transition-colors"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full panel-2 px-4 py-3 text-sm text-frost placeholder:text-frost-dim outline-none focus:border-ice-dim transition-colors"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-gradient-to-r from-ice to-ice-dim text-bg-deep font-bold py-3 rounded-xl transition hover:opacity-90"
        >
          Masuk
        </button>

        <p className="text-center text-frost-dim text-xs">
          Default: owner/owner123 · admin/admin123 · kasir/kasir123
        </p>
      </form>
    </div>
  );
}