import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { SocketProvider } from './context/SocketContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public Pages
import { LandingPage } from './pages/LandingPage';
import { RoleSelection } from './pages/RoleSelection';
import { LoginPage } from './pages/LoginPage';
import { SignupPage } from './pages/SignupPage';
import { ExamDiscoveryPage } from './pages/ExamDiscoveryPage';
import { ExamDetailsPage } from './pages/ExamDetailsPage';
import { LeaderboardPage } from './pages/LeaderboardPage';
import { SchedulePage } from './pages/SchedulePage';

// Student Pages
import { StudentDashboard } from './pages/StudentDashboard';
import { MyExamsPage } from './pages/MyExamsPage';
import { ExamAttemptPage } from './pages/ExamAttemptPage';
import { ResultPage } from './pages/ResultPage';
import { MistakeAnalysisPage } from './pages/MistakeAnalysisPage';
import { PerformanceAnalyticsPage } from './pages/PerformanceAnalyticsPage';
import { ProfilePage } from './pages/ProfilePage';
import { SettingsPage } from './pages/SettingsPage';

// Teacher Pages
import { TeacherDashboardPage } from './pages/teacher/TeacherDashboardPage';
import { TeacherQuestionBankPage } from './pages/teacher/TeacherQuestionBankPage';
import { TeacherCreateExamPage } from './pages/teacher/TeacherCreateExamPage';
import { TeacherExamsPage } from './pages/teacher/TeacherExamsPage';
import { TeacherResultsPage } from './pages/teacher/TeacherResultsPage';
import { TeacherAnalyticsPage } from './pages/teacher/TeacherAnalyticsPage';

// Admin Pages
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminBulkUploadPage } from './pages/admin/AdminBulkUploadPage';
import { AdminExamsPage } from './pages/admin/AdminExamsPage';
import { AdminCreateExamPage } from './pages/admin/AdminCreateExamPage';
import { AdminAttemptsPage } from './pages/admin/AdminAttemptsPage';
import { AdminAIQuestionGenPage } from './pages/admin/AdminAIQuestionGenPage';
import { AdminAuditLogsPage } from './pages/admin/AdminAuditLogsPage';
import AdminLiveMonitoringPage from './pages/admin/AdminLiveMonitoringPage';
import AdminCandidateDetailPage from './pages/admin/AdminCandidateDetailPage';

const AppLayout = () => {
  const location = useLocation();
  // Hide global Navbar & Footer during active exam attempts, on the institutional landing page, and role selection
  const hideGlobalChrome = 
    location.pathname.includes('/attempt/') || 
    location.pathname === '/' || 
    location.pathname === '/role-select';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 font-sans">
      {!hideGlobalChrome && <Navbar />}
      <main className="flex-1">
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/role-select" element={<RoleSelection />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<LoginPage />} />
          <Route path="/exams" element={<ExamDiscoveryPage />} />
          <Route path="/exam/:examId" element={<ExamDetailsPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/leaderboard/:examId" element={<LeaderboardPage />} />
          <Route path="/schedule" element={<SchedulePage />} />

          {/* Student Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-exams"
            element={
              <ProtectedRoute>
                <MyExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/exam/:examId/attempt/:attemptId"
            element={
              <ProtectedRoute>
                <ExamAttemptPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/:attemptId"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/results/my-results"
            element={
              <ProtectedRoute>
                <MyExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/mistakes"
            element={
              <ProtectedRoute>
                <MistakeAnalysisPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute>
                <PerformanceAnalyticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />

          {/* Teacher Protected Routes */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/questions"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherQuestionBankPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exams/create"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherCreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/results"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherResultsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/analytics"
            element={
              <ProtectedRoute allowedRoles={['TEACHER', 'ADMIN']}>
                <TeacherAnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminDashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/monitoring"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminLiveMonitoringPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attempts/:id/monitoring"
            element={
              <ProtectedRoute allowedRoles={['ADMIN', 'TEACHER']}>
                <AdminCandidateDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminQuestionsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/questions/upload"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminBulkUploadPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminExamsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/exams/create"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminCreateExamPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/attempts"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminAttemptsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/ai-generator"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminAIQuestionGenPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/audit-logs"
            element={
              <ProtectedRoute requireAdmin={true}>
                <AdminAuditLogsPage />
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<LandingPage />} />
        </Routes>
      </main>
      {!hideGlobalChrome && <Footer />}
    </div>
  );
};

export const App = () => {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <SocketProvider>
            <AppLayout />
          </SocketProvider>
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
