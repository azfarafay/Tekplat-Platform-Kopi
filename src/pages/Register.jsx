import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('roastery');
  const [nibNumber, setNibNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/register', {
        name,
        email,
        password,
        role,
        nib_number: nibNumber,
      });

      if (response.status === 201 || response.data?.success) {
        navigate('/', {
          state: {
            success: response.data?.message || 'Pendaftaran berhasil. Silakan login.',
          },
        });
      } else {
        throw new Error(response.data?.message || 'Pendaftaran gagal.');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Pendaftaran gagal.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Daftar Akun</h1>
          <p className="mt-2 text-sm text-slate-500">Buat akun baru untuk mengakses dashboard.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-700">
              Nama
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <div>
            <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
              Role
            </label>
            <select
              id="role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            >
              <option value="roastery">roastery</option>
              <option value="coffee_shop">coffee_shop</option>
            </select>
          </div>

          <div>
            <label htmlFor="nib_number" className="mb-2 block text-sm font-medium text-slate-700">
              NIB Number
            </label>
            <input
              id="nib_number"
              type="text"
              value={nibNumber}
              onChange={(event) => setNibNumber(event.target.value)}
              required
              className="w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Daftar'}
          </button>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Register;
