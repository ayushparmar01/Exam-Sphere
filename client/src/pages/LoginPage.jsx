import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GLBLogo } from '../components/common/GLBLogo';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  GraduationCap,
  BookOpen,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import api from '../services/api';

export const LoginPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialRole = searchParams.get('role') || 'student';

  const [activeRole, setActiveRole] = useState(initialRole.toLowerCase());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMsg, setForgotMsg] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || null;

  // Sync role with query parameter if present
  useEffect(() => {
    const roleParam = searchParams.get('role');
    if (roleParam && ['student', 'teacher', 'admin'].includes(roleParam.toLowerCase())) {
      setActiveRole(roleParam.toLowerCase());
    }
  }, [searchParams]);

  // Load remembered email on mount if available
  useEffect(() => {
    const savedEmail = localStorage.getItem('glb_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleRoleChange = (newRole) => {
    setActiveRole(newRole);
    setSearchParams({ role: newRole });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    try {
      setLoading(true);
      const user = await login(email, password);

      // Save or remove remembered email
      if (rememberMe) {
        localStorage.setItem('glb_remembered_email', email);
      } else {
        localStorage.removeItem('glb_remembered_email');
      }

      // Role-aware intelligent redirection
      if (from) {
        navigate(from, { replace: true });
      } else if (user.role === 'ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else if (user.role === 'TEACHER') {
        navigate('/teacher/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoStudent = () => {
    setActiveRole('student');
    setEmail('student@examsphere.com');
    setPassword('Student@123');
    setError('');
  };

  const fillDemoTeacher = () => {
    setActiveRole('teacher');
    setEmail('teacher@examsphere.com');
    setPassword('Teacher@123');
    setError('');
  };

  const fillDemoAdmin = () => {
    setActiveRole('admin');
    setEmail('admin@examsphere.com');
    setPassword('Admin@123');
    setError('');
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotMsg('');
    if (!forgotEmail) return;

    try {
      setForgotLoading(true);
      const res = await api.post('/auth/forgot-password', { email: forgotEmail });
      setForgotMsg(res.data?.message || 'Password reset link has been dispatched.');
    } catch (err) {
      setForgotMsg('If an account exists, instructions have been dispatched.');
    } finally {
      setForgotLoading(false);
    }
  };

  const roleMeta = {
    student: {
      title: 'Student Login',
      badge: 'Candidate Portal',
      icon: GraduationCap,
      placeholder: 'student@examsphere.com',
    },
    teacher: {
      title: 'Teacher Login',
      badge: 'Faculty Portal',
      icon: BookOpen,
      placeholder: 'teacher@examsphere.com',
    },
    admin: {
      title: 'Administrator Login',
      badge: 'Admin Console',
      icon: ShieldCheck,
      placeholder: 'admin@examsphere.com',
    },
  }[activeRole] || {
    title: 'Portal Login',
    badge: 'Institutional Access',
    icon: GraduationCap,
    placeholder: 'name@examsphere.com',
  };

  const CurrentRoleIcon = roleMeta.icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-[#0F1115] text-[#E6EDF3] py-12 px-4 sm:px-6 lg:px-8 selection:bg-sky-500 selection:text-slate-950">
      
      {/* Top Breadcrumb Links */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between text-xs">
        <Link
          to="/role-select"
          className="inline-flex items-center gap-1.5 font-semibold text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-white"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Role Selection</span>
        </Link>
        <Link
          to="/"
          className="font-semibold text-slate-400 hover:text-slate-200 transition-colors focus:outline-none focus:text-white"
        >
          Portal Home
        </Link>
      </div>

      {/* Dark Card Container */}
      <div className="max-w-md w-full space-y-6 bg-[#151922] p-8 rounded-2xl shadow-2xl border border-slate-800">
        
        {/* Header with Institutional Branding */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <GLBLogo size="md" variant="full" theme="dark" />
          </div>

          <div className="pt-2">
            <h2 className="text-2xl font-black text-[#E6EDF3] tracking-tight">
              GLB <span className="text-sky-400">ExamSphere</span>
            </h2>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
              Institutional Examination Portal
            </p>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-[#0F1115] p-1 rounded-xl flex items-center gap-1 border border-slate-800" role="tablist" aria-label="Select Login Role">
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'student'}
            onClick={() => handleRoleChange('student')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeRole === 'student'
                ? 'bg-[#1C2230] text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'teacher'}
            onClick={() => handleRoleChange('teacher')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeRole === 'teacher'
                ? 'bg-[#1C2230] text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeRole === 'admin'}
            onClick={() => handleRoleChange('admin')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
              activeRole === 'admin'
                ? 'bg-[#1C2230] text-sky-400 border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Selected Role Indicator Pill */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-[#0F1115] border border-slate-800 text-xs">
          <div className="flex items-center gap-1.5 text-slate-200 font-bold">
            <CurrentRoleIcon className="w-4 h-4 text-sky-400" />
            <span>{roleMeta.title}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-sky-400 bg-[#151922] px-2 py-0.5 rounded border border-slate-800">
            {roleMeta.badge}
          </span>
        </div>

        {/* Demo Credentials Quick-Fill Strip */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold">
            <span>Demo Quick-Fill:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={fillDemoStudent}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'student' 
                  ? 'bg-sky-500 text-slate-950 border-sky-400' 
                  : 'bg-[#151922] border-slate-800 text-slate-300 hover:text-white hover:bg-[#1A202C]'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={fillDemoTeacher}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'teacher' 
                  ? 'bg-sky-500 text-slate-950 border-sky-400' 
                  : 'bg-[#151922] border-slate-800 text-slate-300 hover:text-white hover:bg-[#1A202C]'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'admin' 
                  ? 'bg-sky-500 text-slate-950 border-sky-400' 
                  : 'bg-[#151922] border-slate-800 text-slate-300 hover:text-white hover:bg-[#1A202C]'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Inline Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2" role="alert">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={roleMeta.placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0F1115] border border-slate-800 text-sm text-[#E6EDF3] placeholder-slate-500 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-sky-400 hover:text-sky-300 font-semibold focus:outline-none"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0F1115] border border-slate-800 text-sm text-[#E6EDF3] placeholder-slate-500 focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-700 bg-[#0F1115] text-sky-500 focus:ring-sky-500/50"
              />
              <span className="text-xs text-slate-400 font-medium">Remember email</span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-sky-500 hover:bg-sky-400 active:bg-sky-600 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-sky-500/20 transition-all flex items-center justify-center gap-2 mt-2 focus:outline-none focus:ring-2 focus:ring-sky-400"
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                <span>Authenticating...</span>
              </>
            ) : (
              <>
                <span>Sign In to {roleMeta.title}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-800">
          <p className="text-xs text-slate-400">
            GL Bajaj Group of Institutions, Mathura
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F1115]/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#151922] rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-800">
            <h3 className="text-base font-bold text-[#E6EDF3]">Reset Password</h3>
            <p className="text-xs text-slate-400">
              Enter your registered institutional email to receive verification instructions.
            </p>

            {forgotMsg && (
              <div className="p-3 bg-[#0F1115] text-sky-400 text-xs rounded-xl border border-slate-800">
                {forgotMsg}
              </div>
            )}

            <form onSubmit={handleForgotPassword} className="space-y-3">
              <input
                type="email"
                required
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="registered@examsphere.com"
                className="w-full px-3.5 py-2 rounded-xl bg-[#0F1115] border border-slate-800 text-sm text-[#E6EDF3] placeholder-slate-500 focus:ring-2 focus:ring-sky-500/50 outline-none"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotMsg('');
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-400 hover:text-white rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-sky-500 hover:bg-sky-400 rounded-lg shadow-xs"
                >
                  {forgotLoading ? 'Submitting...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default LoginPage;
