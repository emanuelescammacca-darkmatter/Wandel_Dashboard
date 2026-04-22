import { useState, type FormEvent } from 'react';

interface LoginProps {
  onLogin: () => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }
    setError('');
    onLogin();
  }

  return (
    <div className="min-h-screen w-full flex" style={{ background: '#1a1a2e' }}>
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 px-14 py-12">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded flex items-center justify-center text-white font-bold text-sm">
            W
          </div>
          <span className="text-white font-semibold text-xl tracking-wide">WANDEL</span>
        </div>
        <div>
          <p className="text-white/40 text-sm">Recruitment Intelligence Platform</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 bg-[#f8f9fb] lg:rounded-l-3xl">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-10 lg:hidden">
            <div className="w-7 h-7 bg-[#1a1a2e] rounded flex items-center justify-center text-white font-bold text-sm">
              W
            </div>
            <span className="text-[#1a1a2e] font-semibold text-lg tracking-wide">WANDEL</span>
          </div>

          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Welcome back</h1>
          <p className="text-sm text-gray-500 mb-8">Sign in to your account to continue</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@wandel.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}

            <button
              type="submit"
              className="mt-2 w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
