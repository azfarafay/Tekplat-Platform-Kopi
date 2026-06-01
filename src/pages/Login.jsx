import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const Login = () => {
  const location = useLocation();
  const successMessage = location.state?.success || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    console.log("Tombol login diklik!"); // <--- Debugger pertama
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email,
        password,
      });

      console.log('Respons Backend LENGKAP:', response.data);
      console.log('Struktur response:', JSON.stringify(response.data, null, 2));

      // Handle multiple possible data structures
      let token, user;
      
      // Try different structures - backend ini: token di dalam data, user adalah seluruh data object
      if (response.data?.data?.token) {
        token = response.data.data.token;
        // User adalah seluruh object data (sudah berisi token, jadi extract yang perlu saja)
        const { token: _, ...userWithoutToken } = response.data.data;
        user = userWithoutToken;
      } else if (response.data?.token) {
        token = response.data.token;
        user = response.data;
      }
      
      console.log('Token dari parsing:', token);
      console.log('User dari parsing:', user);
      console.log('Token ada?:', !!token);
      console.log('User ada?:', !!user);
      
      if (!token || !user) {
        console.error('Data yang diterima:', { 
          responseData: response.data,
          token, 
          user 
        });
        throw new Error('Respons login tidak valid. Token atau user tidak ditemukan. Struktur response: ' + JSON.stringify(response.data));
      }

      try {
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        console.log('Data tersimpan di localStorage');
      } catch (storageError) {
        console.error('Error menyimpan ke localStorage:', storageError);
        throw new Error('Gagal menyimpan data login. ' + storageError.message);
      }

      console.log('Navigasi ke /dashboard...');
      navigate('/dashboard');
    } catch (errorResponse) {
      console.error('Error detail:', errorResponse);
      const message =
        errorResponse?.response?.data?.message ||
        errorResponse?.message ||
        'Login gagal. Periksa kembali email dan kata sandi Anda.';
      console.error('Error message yang ditampilkan:', message);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Masuk</h1>
          <p className="mt-2 text-sm text-slate-500">Gunakan akun Anda untuk mengakses dashboard.</p>
        </div>

        {successMessage && (
          <div className="mb-6 rounded-3xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
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

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-3xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Memproses...' : 'Login'}
          </button>

          {error && <p className="text-center text-sm text-red-600">{error}</p>}
        </form>
      </div>
    </div>
  );
};

export default Login;
