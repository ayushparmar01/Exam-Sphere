import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { GLBLogo } from './common/GLBLogo';
import {
  Award,
  Bell,
  CheckCircle,
  ChevronDown,
  LogOut,
  Menu,
  Shield,
  User,
  X,
  BookOpen,
  Calendar,
  Trophy,
  LayoutDashboard,
  Settings,
  Activity,
  PlusCircle,
  FileCheck,
  BarChart3,
  GraduationCap,
  Users,
} from 'lucide-react';

export const Navbar = () => {
  const { user, isAuthenticated, isAdmin, isTeacher, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setProfileDropdownOpen(false);
    setNotificationsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  let navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Exams', path: '/exams' },
    { name: 'Leaderboard', path: '/leaderboard' },
    { name: 'Schedule', path: '/schedule' },
  ];

  if (isAuthenticated) {
    if (isTeacher) {
      navLinks = [
        { name: 'Dashboard', path: '/teacher/dashboard' },
        { name: 'Students', path: '/teacher/students' },
        { name: 'Assignments', path: '/teacher/assignments' },
        { name: 'Materials', path: '/teacher/materials' },
        { name: 'Exams', path: '/teacher/exams' },
        { name: 'Reports', path: '/teacher/reports' },
        { name: 'Feedback', path: '/teacher/feedback' },
        { name: 'Live Proctoring', path: '/admin/monitoring', isLive: true },
      ];
    } else if (isAdmin) {
      navLinks = [
        { name: 'Dashboard', path: '/admin/dashboard' },
        { name: 'Academic Setup', path: '/admin/academic' },
        { name: 'Faculty Allocations', path: '/admin/teachers' },
        { name: 'College Analytics', path: '/admin/analytics' },
        { name: 'Exams', path: '/admin/exams' },
        { name: 'Live Proctoring', path: '/admin/monitoring', isLive: true },
      ];
    } else {
      // Student
      navLinks = [
        { name: 'My Academic Space', path: '/dashboard' },
        { name: 'Exams', path: '/exams' },
        { name: 'My Exams', path: '/my-exams' },
        { name: 'Leaderboard', path: '/leaderboard' },
        { name: 'Schedule', path: '/schedule' },
        { name: 'Mistakes', path: '/mistakes' },
      ];
    }
  }

  const getDashboardPath = () => {
    if (isAdmin) return '/admin/dashboard';
    if (isTeacher) return '/teacher/dashboard';
    return '/dashboard';
  };

  const getRoleLabel = () => {
    if (isAdmin) return 'Administrator';
    if (isTeacher) return 'Faculty / Teacher';
    return 'Student';
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5 group">
              <GLBLogo size="sm" variant="mark" />
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-tight text-blue-950">
                  GLB <span className="text-blue-600">ExamSphere</span>
                </span>
                <span className="text-[9px] font-bold text-slate-500 uppercase -mt-1 hidden sm:block">
                  GL Bajaj Mathura
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex ml-8 space-x-1">
              {navLinks.map((link) => {
                const isActive = location.pathname === link.path;
                return (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition flex items-center gap-1.5 ${
                      isActive
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    {link.isLive && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {link.name}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                {/* Dashboard Quick Link */}
                <Link
                  to={getDashboardPath()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg border border-slate-200"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-500" />
                  <span>Dashboard</span>
                </Link>

                {/* Notifications Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setNotificationsOpen(!notificationsOpen)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition relative"
                    aria-label="View notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
                    )}
                  </button>

                  {/* Notifications Popover */}
                  {notificationsOpen && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 text-sm">Notifications</span>
                          {unreadCount > 0 && (
                            <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllAsRead}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                        {notifications.length === 0 ? (
                          <div className="py-6 text-center text-sm text-slate-400">
                            No notifications yet
                          </div>
                        ) : (
                          notifications.map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => {
                                markAsRead(notif._id);
                                if (notif.link) navigate(notif.link);
                                setNotificationsOpen(false);
                              }}
                              className={`p-3 text-xs hover:bg-slate-50 cursor-pointer transition flex items-start gap-2.5 ${
                                !notif.read ? 'bg-indigo-50/40' : ''
                              }`}
                            >
                              <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 flex-shrink-0" style={{ opacity: notif.read ? 0 : 1 }} />
                              <div className="flex-1">
                                <p className="font-semibold text-slate-800 text-[13px]">{notif.title}</p>
                                <p className="text-slate-600 mt-0.5">{notif.message}</p>
                                <span className="text-[10px] text-slate-400 mt-1 block">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* User Dropdown */}
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-left"
                  >
                    <img
                      src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                      alt={user?.name}
                      className="w-8 h-8 rounded-full object-cover border border-indigo-200"
                    />
                    <div className="hidden lg:block text-xs">
                      <p className="font-semibold text-slate-800 leading-tight">{user?.name}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold text-indigo-600">
                        {user?.role}
                      </p>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50">
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                          {getRoleLabel()}
                        </span>
                        {user?.department && (
                          <p className="text-[11px] text-slate-500 mt-0.5">{user.department}</p>
                        )}
                      </div>

                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <User className="w-4 h-4 text-slate-400" />
                        My Profile
                      </Link>

                      <Link
                        to="/settings"
                        className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Settings className="w-4 h-4 text-slate-400" />
                        Account Settings
                      </Link>

                      {/* Teacher Quick Tools */}
                      {isTeacher && (
                        <div className="border-t border-slate-100 my-1 pt-1">
                          <Link
                            to="/teacher/questions"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            Question Bank
                          </Link>
                          <Link
                            to="/teacher/exams/create"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <PlusCircle className="w-4 h-4 text-slate-400" />
                            Create Exam
                          </Link>
                          <Link
                            to="/teacher/exams"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Shield className="w-4 h-4 text-slate-400" />
                            My Exams
                          </Link>
                          <Link
                            to="/teacher/students"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="w-4 h-4 text-slate-400" />
                            My Students Roster
                          </Link>
                          <Link
                            to="/teacher/assignments"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <FileCheck className="w-4 h-4 text-slate-400" />
                            Assignments & Grading
                          </Link>
                          <Link
                            to="/teacher/materials"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <BookOpen className="w-4 h-4 text-slate-400" />
                            Study Materials
                          </Link>
                          <Link
                            to="/teacher/reports"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            Reports & Exports
                          </Link>
                          <Link
                            to="/teacher/feedback"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Award className="w-4 h-4 text-slate-400" />
                            Student Feedback
                          </Link>
                          <Link
                            to="/admin/monitoring"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50"
                          >
                            <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                            Live Proctoring Center
                          </Link>
                        </div>
                      )}

                      {/* Admin Quick Tools */}
                      {isAdmin && (
                        <div className="border-t border-slate-100 my-1 pt-1">
                          <Link
                            to="/admin/academic"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <GraduationCap className="w-4 h-4 text-slate-400" />
                            Academic Hierarchy
                          </Link>
                          <Link
                            to="/admin/teachers"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Users className="w-4 h-4 text-slate-400" />
                            Faculty Allocations
                          </Link>
                          <Link
                            to="/admin/analytics"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <BarChart3 className="w-4 h-4 text-slate-400" />
                            College Analytics
                          </Link>
                          <Link
                            to="/admin/monitoring"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-indigo-600 font-semibold hover:bg-indigo-50"
                          >
                            <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
                            Live Proctoring Center
                          </Link>
                          <Link
                            to="/admin/exams"
                            className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                          >
                            <Shield className="w-4 h-4 text-slate-400" />
                            Exam Management
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-slate-100 my-1 pt-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-rose-600 hover:bg-rose-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-4 py-2 text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-200 transition"
                >
                  Register
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 text-slate-600 relative"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-indigo-600" />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-1">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`block px-3 py-2 rounded-lg text-base font-medium ${
                  isActive
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          <div className="pt-4 border-t border-slate-100">
            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="px-3 py-2">
                  <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                  <p className="text-xs text-slate-500">{user?.email}</p>
                  <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                    {getRoleLabel()}
                  </span>
                </div>
                <Link
                  to={getDashboardPath()}
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  Dashboard
                </Link>
                <Link
                  to="/profile"
                  className="block px-3 py-2 rounded-lg text-sm text-slate-700 hover:bg-slate-50"
                >
                  My Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-lg text-sm text-rose-600 font-semibold hover:bg-rose-50"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to="/login"
                  className="w-full py-2.5 text-center text-sm font-semibold text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="w-full py-2.5 text-center text-sm font-semibold text-white bg-indigo-600 rounded-lg shadow-sm"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
