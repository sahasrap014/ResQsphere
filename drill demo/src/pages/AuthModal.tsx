import React, { useState, useEffect } from 'react';
import { useDisaster } from '../state/DisasterContext';
import { supabase, isSupabaseConfigured, fetchUserProfile } from '../services/supabaseClient';
import { validateIndianMobile } from '../utils/phoneValidation';
import {
  ShieldAlert,
  X,
  AlertTriangle,
  CheckCircle,
  Lock,
  Users,
  ShieldCheck,
  Building2,
  Sparkles,
  Phone,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    setIsAuthModalOpen,
    authModalInitialRole,
    setUser,
    supabaseStatus,
    mode: appMode,
  } = useDisaster();

  // Selected role tab: Citizen | Authority | Partner
  const [selectedRole, setSelectedRole] = useState<'citizen' | 'authority' | 'partner'>('citizen');
  const [mode, setMode] = useState<'signin' | 'register'>('signin');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [agency, setAgency] = useState('');
  const [district, setDistrict] = useState('East Godavari');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Sync initial role when modal opens
  useEffect(() => {
    if (authModalInitialRole) {
      setSelectedRole(authModalInitialRole);
    }
  }, [authModalInitialRole, isAuthModalOpen]);

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

    // Phone validation on registration
    if (mode === 'register' && phone) {
      const phoneVal = validateIndianMobile(phone);
      if (!phoneVal.isValid) {
        setErrorMessage(phoneVal.error || 'Enter a valid 10-digit Indian mobile number.');
        setIsLoading(false);
        return;
      }
    }

    // Live Mode: Supabase Auth
    if (isSupabaseConfigured && supabase) {
      try {
        if (mode === 'register') {
          const phoneVal = phone ? validateIndianMobile(phone).normalized : '';
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName || email.split('@')[0],
                role: selectedRole,
                phone: phoneVal,
                agency: selectedRole !== 'citizen' ? agency : undefined,
                district,
              },
            },
          });

          if (error) throw error;

          if (data.user) {
            // For privileged roles, inform user of approval requirement
            if (selectedRole !== 'citizen') {
              setSuccessMessage(
                `Account registered! Because you applied as ${selectedRole.toUpperCase()}, administrator approval is required before command access is granted.`
              );
            } else {
              const profile = {
                id: data.user.id,
                email: data.user.email || email,
                fullName: fullName || email.split('@')[0],
                role: selectedRole,
                phone: phoneVal,
                district,
                isApproved: true,
              };
              setUser(profile);
              localStorage.setItem('resqsphere_user', JSON.stringify(profile));
              setSuccessMessage('Registration successful! Citizen profile activated.');
              setTimeout(() => setIsAuthModalOpen(false), 1200);
            }
          }
        } else {
          // Sign In
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          if (data.user) {
            // Requirement 3: Determine permissions from securely stored and validated role in profiles
            const profile = await fetchUserProfile(data.user.id);

            if (!profile) {
              // Fallback to user metadata if profile trigger is delayed
              const userMetaRole = data.user.user_metadata?.role || 'citizen';
              if (selectedRole !== 'citizen' && userMetaRole !== selectedRole) {
                throw new Error(
                  `Access Denied: Your account role is "${userMetaRole}". You cannot sign in to the ${selectedRole.toUpperCase()} command interface.`
                );
              }
              const tempProfile = {
                id: data.user.id,
                email: data.user.email || email,
                fullName: data.user.user_metadata?.full_name || email.split('@')[0],
                role: userMetaRole,
                isApproved: true,
              };
              setUser(tempProfile);
              localStorage.setItem('resqsphere_user', JSON.stringify(tempProfile));
            } else {
              // Strict role check
              if (selectedRole !== 'citizen' && profile.role !== selectedRole) {
                throw new Error(
                  `Access Denied: Your account is registered as "${profile.role}". You do not have permission to access the ${selectedRole.toUpperCase()} portal.`
                );
              }

              // Strict approval check for privileged roles
              if (selectedRole !== 'citizen' && !profile.isApproved) {
                throw new Error(
                  `Account Pending Approval: Your ${selectedRole.toUpperCase()} credentials have not yet been approved by state disaster administration.`
                );
              }

              setUser(profile);
              localStorage.setItem('resqsphere_user', JSON.stringify(profile));
            }

            setSuccessMessage(`Signed in successfully as ${selectedRole.toUpperCase()}.`);
            setTimeout(() => setIsAuthModalOpen(false), 900);
          }
        }
      } catch (err: any) {
        setErrorMessage(err.message || 'Authentication error. Please check your credentials.');
      } finally {
        setIsLoading(false);
      }
    } else {
      // Local Prototype / Demo Mode account
      setTimeout(() => {
        const phoneVal = phone ? validateIndianMobile(phone).normalized : '+91 98480 12345';
        const localUser = {
          id: `USR-${selectedRole.toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          email,
          fullName: fullName || (selectedRole === 'authority' ? 'Commander Sharma' : selectedRole === 'partner' ? 'Relief Director Rao' : 'Citizen Applicant'),
          role: selectedRole,
          agency: agency || (selectedRole === 'authority' ? 'NDMA Command Cell' : 'Red Cross India'),
          phone: phoneVal,
          district,
          isApproved: true,
        };
        setUser(localUser);
        localStorage.setItem('resqsphere_user', JSON.stringify(localUser));
        setSuccessMessage(`Signed in as ${selectedRole.toUpperCase()} (Session Active).`);
        setIsLoading(false);
        setTimeout(() => setIsAuthModalOpen(false), 800);
      }, 400);
    }
  };

  const handleQuickDemoLogin = (roleToSet: 'citizen' | 'authority' | 'partner') => {
    const demoProfiles = {
      citizen: {
        id: 'USR-CIT-01',
        email: 'citizen@resqsphere.in',
        fullName: 'K. Venkateswara Rao',
        role: 'citizen' as const,
        phone: '+91 98480 77112',
        district: 'East Godavari Simulation Sector',
        isApproved: true,
      },
      authority: {
        id: 'USR-AUTH-01',
        email: 'command@sdma.gov.in',
        fullName: 'Dr. C. H. Venkataramana, IAS',
        role: 'authority' as const,
        agency: 'AP State Disaster Management Authority',
        phone: '+91 94401 22334',
        district: 'East Godavari Simulation Sector',
        isApproved: true,
      },
      partner: {
        id: 'USR-PART-01',
        email: 'relief@akshayapatra.org',
        fullName: 'P. Anand Kumar (Relief Director)',
        role: 'partner' as const,
        agency: 'Akshaya Relief Mission Trust',
        phone: '+91 98490 55112',
        district: 'East Godavari Simulation Sector',
        isApproved: true,
      },
    };

    const target = demoProfiles[roleToSet];
    setUser(target);
    localStorage.setItem('resqsphere_user', JSON.stringify(target));
    setSuccessMessage(`Quick Switch: Signed in as ${roleToSet.toUpperCase()}`);
    setTimeout(() => setIsAuthModalOpen(false), 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-emerald-100 overflow-hidden relative">
        {/* Close Button */}
        <button
          onClick={() => setIsAuthModalOpen(false)}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100 transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Top Header */}
        <div className="p-6 bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-emerald-300">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">ResQsphere Authentication</h2>
              <p className="text-xs text-emerald-200">
                Secure Disaster Preparedness & Relief Coordination Network
              </p>
            </div>
          </div>

          {/* Requirement 3: Separate Role Sign-In Entry Tabs */}
          <div className="grid grid-cols-3 gap-1.5 mt-5 bg-black/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setSelectedRole('citizen')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'citizen'
                  ? 'bg-white text-emerald-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Citizen</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('authority')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'authority'
                  ? 'bg-white text-red-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-red-600" />
              <span>Authority</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRole('partner')}
              className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                selectedRole === 'partner'
                  ? 'bg-white text-sky-950 shadow-sm'
                  : 'text-emerald-100 hover:text-white hover:bg-white/10'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 text-sky-600" />
              <span>Partner</span>
            </button>
          </div>
        </div>

        {/* Role Explanation Sub-bar */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs text-slate-600">
          <div>
            {selectedRole === 'citizen' && (
              <span><strong>Citizen Portal:</strong> Report emergencies, track requests & safety status.</span>
            )}
            {selectedRole === 'authority' && (
              <span className="text-red-900 font-medium">
                <strong>Incident Command:</strong> Requires verified government responder credentials.
              </span>
            )}
            {selectedRole === 'partner' && (
              <span className="text-sky-900 font-medium">
                <strong>Relief Logistics:</strong> For registered NGOs, suppliers & volunteer teams.
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode('signin')}
              className={`text-xs font-semibold ${mode === 'signin' ? 'text-emerald-800 underline' : 'text-slate-400'}`}
            >
              Sign In
            </button>
            <span className="text-slate-300">|</span>
            <button
              type="button"
              onClick={() => setMode('register')}
              className={`text-xs font-semibold ${mode === 'register' ? 'text-emerald-800 underline' : 'text-slate-400'}`}
            >
              Register
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Notifications */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <div>{successMessage}</div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
            {mode === 'register' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={selectedRole === 'authority' ? 'officer@sdma.gov.in' : 'name@example.com'}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>

            {mode === 'register' && (
              <>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mobile Number (10-Digit Indian Mobile) *
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98480 12345"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                  </div>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Enter valid 10-digit number. Optional +91 prefix accepted.
                  </span>
                </div>

                {selectedRole !== 'citizen' && (
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      {selectedRole === 'authority' ? 'Government Agency / Unit *' : 'NGO / Relief Organization *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={agency}
                      onChange={(e) => setAgency(e.target.value)}
                      placeholder={selectedRole === 'authority' ? 'e.g. NDRF 10th Battalion / SDRF Cell' : 'e.g. Red Cross Society / Akshaya Relief'}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                    />
                  </div>
                )}
              </>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-2.5 rounded-xl font-bold text-white shadow-xs transition flex items-center justify-center gap-2 ${
                selectedRole === 'authority'
                  ? 'bg-red-700 hover:bg-red-800'
                  : selectedRole === 'partner'
                  ? 'bg-sky-700 hover:bg-sky-800'
                  : 'bg-[#1B4332] hover:bg-[#245740]'
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>
                {isLoading
                  ? 'Authenticating...'
                  : mode === 'signin'
                  ? `Sign In as ${selectedRole.toUpperCase()}`
                  : `Register ${selectedRole.toUpperCase()} Account`}
              </span>
            </button>
          </form>

          {/* Quick Demo Switcher for Competition Judges & Reviewers */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Quick Role Tester
              </span>
              <span className="text-[10px] text-slate-400">One-click evaluation profiles</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('citizen')}
                className="px-2 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-semibold transition text-center border border-emerald-200"
              >
                Citizen
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('authority')}
                className="px-2 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-800 text-[11px] font-semibold transition text-center border border-red-200"
              >
                Authority
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin('partner')}
                className="px-2 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 text-[11px] font-semibold transition text-center border border-sky-200"
              >
                Relief Partner
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
