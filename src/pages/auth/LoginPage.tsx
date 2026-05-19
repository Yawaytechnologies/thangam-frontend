import React, { useState } from 'react';
import type { AxiosError } from 'axios';
import { useLogin } from '../../hooks/useAuth';

const GOLD_RING = '0 0 0 2px rgba(201,162,39,0.2)';

const LoginPage: React.FC = () => {
  const login = useLogin();
  const [credential, setCredential] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [fieldError, setFieldError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError('');
    if (!credential.trim()) { setFieldError('Phone or email is required'); return; }
    if (!password) { setFieldError('Password is required'); return; }
    if (rememberMe) localStorage.setItem('sth-remember', credential.trim());
    else localStorage.removeItem('sth-remember');
    const isEmail = credential.includes('@');
    login.mutate(isEmail ? { email: credential.trim(), password } : { phone: credential.trim(), password });
  };

  const errorMessage =
    fieldError ||
    (login.isError
      ? (login.error as AxiosError<{ message: string }>)?.response?.data?.message ?? 'Invalid credentials. Please try again.'
      : '');

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: 'linear-gradient(135deg, var(--color-navy) 0%, var(--color-navy-mid) 60%, var(--color-navy) 100%)' }}
      >
        {/* Background building silhouette */}
        <div className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Crect width='800' height='600' fill='%23111'/%3E%3Crect x='100' y='200' width='120' height='400' fill='%23222'/%3E%3Crect x='240' y='150' width='80' height='450' fill='%23222'/%3E%3Crect x='340' y='100' width='140' height='500' fill='%23282828'/%3E%3Crect x='500' y='180' width='100' height='420' fill='%23222'/%3E%3Crect x='620' y='220' width='90' height='380' fill='%23222'/%3E%3C/svg%3E")`,
            backgroundSize: 'cover',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
            >
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <div>
              <p className="text-white font-bold text-lg leading-tight">Sri Thangam</p>
              <p className="text-gold text-xs font-semibold tracking-widest uppercase">Housing</p>
            </div>
          </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Precision in<br />Property<br />Management.
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed mb-10">
            Access the central command for Sri Thangam Housing's premium real estate portfolio and administrative operations.
          </p>

          {/* Stats */}
          <div className="flex gap-10">
            <div>
              <p className="text-gold text-2xl font-bold">500+</p>
              <p className="text-gray-400 text-xs uppercase tracking-wide mt-1">Properties Managed</p>
            </div>
            <div className="border-l border-gray-700 pl-10">
              <p className="text-gold text-2xl font-bold">24/7</p>
              <p className="text-gray-400 text-xs uppercase tracking-wide mt-1">Active Monitoring</p>
            </div>
          </div>
        </div>

        {/* Bottom shimmer line */}
        <div
          className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, var(--color-gold), transparent)' }}
        />
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
            >
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">Sri Thangam Housing</span>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mb-1">Super Admin Login</h2>
          <p className="text-sm text-gray-500 mb-8">Enter your credentials to access the management portal.</p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Phone or Email */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                Phone or Email
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </span>
                <input
                  type="text"
                  value={credential}
                  onChange={(e) => setCredential(e.target.value)}
                  placeholder="Enter your registered identity"
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all bg-gray-50"
                  onFocus={(e) => { e.target.style.boxShadow = GOLD_RING; e.target.style.borderColor = 'var(--color-gold)'; }}
                  onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Password
                </label>
                <button type="button" className="text-gold text-xs font-medium">
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-11 py-3 border border-gray-200 rounded-lg text-sm focus:outline-none transition-all bg-gray-50"
                  onFocus={(e) => { e.target.style.boxShadow = GOLD_RING; e.target.style.borderColor = 'var(--color-gold)'; }}
                  onBlur={(e) => { e.target.style.boxShadow = ''; e.target.style.borderColor = '#e5e7eb'; }}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPassword ? (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember me */}
            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-gold"
              />
              <label htmlFor="remember" className="text-sm text-gray-600 cursor-pointer select-none">
                Remember this session
              </label>
            </div>

            {/* Error */}
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={login.isPending}
              className="w-full py-3 rounded-lg text-white text-sm font-semibold transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg, var(--color-gold), var(--color-gold-light))' }}
            >
              {login.isPending && (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
              )}
              {login.isPending ? 'Signing in...' : 'Login to Dashboard →'}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-8">
            RESTRICTED ACCESS AREA<br />
            <span className="text-gray-400">Privacy Policy · Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
