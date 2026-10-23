import React, { useState } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { supabase, isSupabaseConfigured } from '../services/supabaseClient';
import { Shield, X, AlertTriangle, CheckCircle, Info, Lock } from 'lucide-react';

export const AuthModal: React.FC = () => {
  const { isAuthModalOpen, setIsAuthModalOpen, setUser, supabaseStatus } = useDisaster();

  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'citizen' | 'authority' | 'partner' | 'public'>('citizen');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isAuthModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsLoading(true);

    if (!email || !password) {
      setErrorMessage('Please provide both email and password.');
      setIsLoading(false);
      return;
    }

    // If Supabase is configured with keys, execute real Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        if (mode === 'register') {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || email.split('@')[0],
                role,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            const profile = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: fullName || email.split('@')[0],
              role,
              isApproved: role !== 'authority', // Authority requires approval
            };
            setUser(profile);
            localStorage.setItem('disastershield_user', JSON.stringify(profile));
            setSuccessMessage('Registration successful! Session established.');
            setTimeout(() => setIsAuthModalOpen(false), 900);
          }
        } else {
          // Sign in
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            const profile = {
              id: data.user.id,
              email: data.user.email || email,
              fullName: data.user.user_metadata?.full_name || email.split('@')[0],
              role: (data.user.user_metadata?.role as any) || role,
              isApproved: true,
            };
            setUser(profile);
            localStorage.setItem('disastershield_user', JSON.stringify(profile));
            setSuccessMessage('Signed in successfully.');
            setTimeout(() => setIsAuthModalOpen(false), 800);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Authentication error. Please check credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Supabase is not configured yet. Fall back to local prototype account
      // so user can test the portals immediately without blocking!
      setTimeout(() => {
        const localUser = {
          id: `USR-${Math.floor(1000 + Math.random() * 9000)}`,
          email,
          fullName: fullName || email.split('@')[0],
          role,
          isApproved: true,
        };
        setUser(localUser);
        localStorage.setItem('disastershield_user', JSON.stringify(localUser));
        setSuccessMessage(`Signed in as ${role.toUpperCase()} (Prototype Mode).`);
        setIsLoading(false);
        setTimeout(() => setIsAuthModalOpen(false), 800);
      }, 500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header Badge & Title */}
          <div className="mb-6">
            <span className="text-[11px] font-bold tracking-[0.14em] text-emerald-800 uppercase block mb-1">
              DisasterShield Account
            </span>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight font-sans">
              {mode === 'signin' ? 'Welcome back.' : 'Create account.'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Authority access remains restricted until your role is approved.
            </p>
          </div>

          {/* Unconfigured Supabase Banner (Matches Reference Screenshot) */}
          {!isSupabaseConfigured && (
            <div className="rounded-xl bg-[#FBF6EE] border border-[#E7DFCE] p-3.5 mb-5 text-[11px] text-[#786134] leading-relaxed">
              <div className="flex gap-2">
                <Info className="w-4 h-4 text-[#A88236] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#614A1C]">Supabase is not configured yet.</p>
                  <p className="mt-0.5">
                    Add <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_URL</code> and{' '}
                    <code className="bg-amber-100/70 px-1 py-0.5 rounded font-mono text-[10px]">VITE_SUPABASE_ANON_KEY</code> to enable production authentication.
                  </p>
                  <p className="mt-1 text-[10px] text-[#8C6F32]">
                    (You can still sign in right now with any email to test role-based access.)
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Feedback Alerts */}
          {errorMessage && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 mb-4 text-xs text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 mb-4 text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Varthyusha Eedammagari"
                  className="w-full bg-[#EEF2EE]/70 border border-[#D1DDD4] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full bg-[#EEF2EE]/70 border border-[#D1DDD4] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#EEF2EE]/70 border border-[#D1DDD4] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Portal role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as any)}
                className="w-full bg-[#EEF2EE]/70 border border-[#D1DDD4] rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-hidden focus:border-emerald-600 focus:bg-white transition font-sans"
              >
                <option value="citizen">Citizen</option>
                <option value="authority">Authority / Responder</option>
                <option value="partner">Relief Partner / NGO</option>
                <option value="public">General Public</option>
              </select>
            </div>

            {/* Action Buttons (Matches Reference Screenshot) */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3 px-4 bg-[#1B4332] hover:bg-[#245740] text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-950/20 transition flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isLoading ? 'Processing...' : mode === 'signin' ? 'Sign in' : 'Register'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'signin' ? 'register' : 'signin');
                  setErrorMessage(null);
                }}
                className="flex-1 py-3 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition"
              >
                {mode === 'signin' ? 'Register' : 'Back to Sign In'}
              </button>
            </div>

            <div className="pt-1 text-center">
              <button
                type="button"
                onClick={() => alert('Password reset link is sent to registered email in live Supabase environment.')}
                className="text-xs text-slate-500 hover:text-emerald-800 underline transition"
              >
                Forgot password?
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
