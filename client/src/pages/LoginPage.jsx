import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GLBLogo } from '../components/common/GLBLogo';
import { 
  Lock, 
  Mail, 
  ArrowRight, 
  Loader2, 
  UserCheck, 
  ShieldAlert, 
  Eye, 
  EyeOff, 
  ArrowLeft,
  GraduationCap,
  BookOpenCheck,
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
      setError('Please enter both institutional email and password.');
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
      setError(err.response?.data?.message || 'Authentication failed. Please verify institutional credentials.');
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
      title: 'Student Portal Login',
      badge: 'Student / Candidate Access',
      icon: GraduationCap,
      placeholder: 'student@examsphere.com',
      color: 'blue',
    },
    teacher: {
      title: 'Teacher & Faculty Login',
      badge: 'Faculty / Evaluator Access',
      icon: BookOpenCheck,
      placeholder: 'teacher@examsphere.com',
      color: 'indigo',
    },
    admin: {
      title: 'Administrator Console Login',
      badge: 'Examination Cell / Admin',
      icon: ShieldCheck,
      placeholder: 'admin@examsphere.com',
      color: 'slate',
    },
  }[activeRole] || {
    title: 'Institutional Portal Login',
    badge: 'Institutional Access',
    icon: GraduationCap,
    placeholder: 'name@examsphere.com',
    color: 'blue',
  };

  const CurrentRoleIcon = roleMeta.icon;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col justify-center items-center bg-gradient-to-b from-slate-50 via-blue-50/20 to-white py-12 px-4 sm:px-6 lg:px-8">
      
      {/* Back to Portal Link */}
      <div className="max-w-md w-full mb-4 flex items-center justify-between">
        <Link
          to="/role-select"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-900 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Choose Different Role</span>
        </Link>
        <Link
          to="/"
          className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
        >
          Portal Home
        </Link>
      </div>

      <div className="max-w-md w-full space-y-6 bg-white p-8 rounded-2xl shadow-xl border border-slate-200/90">
        
        {/* Institutional Branding Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <GLBLogo size="md" variant="full" />
          </div>

          <div className="pt-2">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              GLB <span className="text-blue-700">ExamSphere</span>
            </h2>
            <p className="text-xs font-bold uppercase tracking-wider text-blue-900 mt-0.5">
              Secure Portal Login
            </p>
          </div>
        </div>

        {/* Role Switcher Tabs */}
        <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 border border-slate-200">
          <button
            type="button"
            onClick={() => handleRoleChange('student')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeRole === 'student'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Student</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('teacher')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeRole === 'teacher'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpenCheck className="w-3.5 h-3.5" />
            <span>Teacher</span>
          </button>
          <button
            type="button"
            onClick={() => handleRoleChange('admin')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1 ${
              activeRole === 'admin'
                ? 'bg-white text-blue-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin</span>
          </button>
        </div>

        {/* Selected Role Indicator Pill */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-blue-50/70 border border-blue-100 text-xs">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold">
            <CurrentRoleIcon className="w-4 h-4 text-blue-700" />
            <span>{roleMeta.title}</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-100">
            {activeRole}
          </span>
        </div>

        {/* Demo Credentials Quick-Fill Strip */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-bold text-slate-700 flex items-center gap-1">
              <UserCheck className="w-3.5 h-3.5 text-blue-700" />
              Quick-Fill Demo Credentials:
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={fillDemoStudent}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'student' 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Student
            </button>
            <button
              type="button"
              onClick={fillDemoTeacher}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'teacher' 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Teacher
            </button>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold border transition text-center ${
                activeRole === 'admin' 
                  ? 'bg-blue-900 text-white border-blue-900' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              Admin
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Main Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Institutional Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={roleMeta.placeholder}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none transition"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <button
                type="button"
                onClick={() => setForgotModalOpen(true)}
                className="text-xs text-blue-700 hover:text-blue-900 font-semibold"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-800 focus:border-transparent outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember Me Checkbox */}
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-blue-900 focus:ring-blue-800"
              />
              <span className="text-xs text-slate-600 font-medium">Remember institutional email</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 rounded-xl bg-blue-900 hover:bg-blue-950 text-white font-bold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
            id="login-submit-btn"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Portal...</span>
              </>
            ) : (
              <>
                <span>Sign In to {roleMeta.title.replace(' Login', '')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-500">
            GL Bajaj Group of Institutions, Mathura • Examination Cell
          </p>
        </div>

      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-bold text-slate-900">Institutional Password Reset</h3>
            <p className="text-xs text-slate-600">
              Enter your registered institutional email to receive verification instructions.
            </p>

            {forgotMsg && (
              <div className="p-3 bg-blue-50 text-blue-900 text-xs rounded-xl border border-blue-200">
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-800 outline-none"
              />
              <div className="flex gap-2 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setForgotModalOpen(false);
                    setForgotMsg('');
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-950 rounded-lg shadow-xs"
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
