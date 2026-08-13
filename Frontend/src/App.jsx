import React, { useContext, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext, AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import ChatRoom from './components/Chat/ChatRoom';
import './styles/app.css';

// ── Theme bootstrap ─────────────────────────────────────────────────────────
// Reads saved preference or falls back to system preference.
// Must run before first render to avoid flash of wrong theme.
const getInitialTheme = () => {
  try {
    const saved = localStorage.getItem('relay-theme');
    if (saved === 'dark' || saved === 'light') return saved;
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark';
  } catch (_) { /* storage unavailable */ }
  return 'light';
};

// Apply immediately (before React hydrates) to avoid FOUC
document.documentElement.setAttribute('data-theme', getInitialTheme());

// ── Loading spinner ──────────────────────────────────────────────────────────
const AppLoader = () => (
  <div className="app-loading">
    <div className="spinner" />
    Loading Relay…
  </div>
);

// ── Route guards ─────────────────────────────────────────────────────────────
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return <AppLoader />;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return null;
  return !isAuthenticated ? children : <Navigate to="/chat" replace />;
};

// ── App content ───────────────────────────────────────────────────────────────
function AppContent() {
  // Keep document theme attribute in sync if the user changes it elsewhere
  useEffect(() => {
    const saved = localStorage.getItem('relay-theme');
    if (saved) document.documentElement.setAttribute('data-theme', saved);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login"    element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/chat"     element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
        <Route path="*"         element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <AppContent />
      </SocketProvider>
    </AuthProvider>
  );
}
