import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import ProtectedRoute from './components/ProtectedRoute';

// Student Pages
import StudentDashboard from "./pages/StudentDashboard";
import Chat from "./pages/Chat";
import Documents from "./pages/Documents";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";

import TeacherDocuments from "./pages/teacher/TeacherDocuments";

import TeacherNotifications from "./pages/teacher/TeacherNotifications";

import TeacherProfile from "./pages/teacher/TeacherProfile";

import TeacherSettings from "./pages/teacher/TeacherSettings";

import TeacherChangePassword from "./pages/teacher/TeacherChangePassword";

import TeacherChat from "./pages/teacher/TeacherChat";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";

import AdminUsers from "./pages/admin/AdminUsers";

import AdminBulkRegistration from "./pages/admin/AdminBulkRegistration";

import AdminDepartments from "./pages/admin/AdminDepartments";

import AdminDocuments from "./pages/admin/AdminDocuments";

import AdminNotifications from "./pages/admin/AdminNotifications";

import AdminProfile from "./pages/admin/AdminProfile";

import AdminSettings from "./pages/admin/AdminSettings";

function App() {
  return (
    <Routes>
      {/* Default Route */}
      <Route path="/" element={<Navigate to="/login" replace />} />

      {/* =====================================================
          AUTHENTICATION
      ===================================================== */}

      <Route path="/login" element={<Login />} />

      <Route path="/change-password" element={<ChangePassword />} />

      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route path="/reset-password/:token" element={<ResetPassword />} />

      {/* =====================================================
          STUDENT DASHBOARD
      ===================================================== */}
      <Route element={<ProtectedRoute />}>

      <Route path="/student" element={<StudentDashboard />} />

      {/* Student Pages */}

      <Route path="/chat" element={<Chat />} />

      <Route path="/documents" element={<Documents />} />

      <Route path="/teacher/chat" element={<TeacherChat />} />

      <Route path="/notifications" element={<Notifications />} />

      <Route path="/profile" element={<Profile />} />

      <Route path="/settings" element={<Settings />} />

      {/* =====================================================
          TEACHER DASHBOARD
      ===================================================== */}

      <Route path="/teacher" element={<Navigate to="/teacher/dashboard" replace />} />

      <Route path="/teacher/dashboard" element={<TeacherDashboard />} />

      <Route path="/teacher/documents" element={<TeacherDocuments />} />

      <Route path="/teacher/notifications" element={<TeacherNotifications />} />

      <Route path="/teacher/profile" element={<TeacherProfile />} />

      <Route path="/teacher/settings" element={<TeacherSettings />} />

      <Route
        path="/teacher/change-password"
        element={<TeacherChangePassword />}
      />

    {/* ============================================================
    ADMIN DASHBOARD
============================================================ */}

<Route
  path="/admin"
  element={<Navigate to="/admin/dashboard" replace />}
/>

<Route
  path="/admin/dashboard"
  element={<AdminDashboard />}
/>

<Route
  path="/admin/users"
  element={<AdminUsers />}
/>

<Route
  path="/admin/bulk-registration"
  element={<AdminBulkRegistration />}
/>

<Route
  path="/admin/departments"
  element={<AdminDepartments />}
/>

<Route
  path="/admin/documents"
  element={<AdminDocuments />}
/>

<Route
  path="/admin/notifications"
  element={<AdminNotifications />}
/>

<Route
  path="/admin/profile"
  element={<AdminProfile />}
/>

<Route
  path="/admin/settings"
  element={<AdminSettings />}
/>

      {/* =====================================================
          UNKNOWN ROUTES
      ===================================================== */}
      </Route>

      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
