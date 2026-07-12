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
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center p-4">
      <form onSubmit={handleLogin} className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-blue-600">FrozenPOS</h1>
          <p className="text-gray-400 text-sm mt-1">Kasir Frozen Food</p>
        </div>
        {error && <div className="bg-red-50 text-red-500 text-sm p-3 rounded-lg text-center">{error}</div>}
        <input type="text" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)}
          className="w-full border rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" required />
        <button type="submit" className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 rounded-lg transition">Masuk</button>
      </form>
    </div>
  );
}
