import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster, ToastBar, toast } from 'react-hot-toast';
import { X } from 'lucide-react';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import QuizPage from './pages/QuizPage';
import Review from './pages/Review';
import Profile from './pages/Profile';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: '#1e2535',
              color: '#e2e8f0',
              border: '1px solid rgba(91,110,245,0.2)',
              borderRadius: '12px',
              fontSize: '0.875rem',
              padding: '10px 16px',
            },
          }}
        >
          {(t) => (
            <ToastBar toast={t}>
              {({ icon, message }) => (
                <>
                  {icon}
                  {message}
                  {t.type !== 'loading' && (
                    <button
                      onClick={() => toast.dismiss(t.id)}
                      style={{
                        background: 'transparent', border: 'none', color: '#94a3b8', 
                        cursor: 'pointer', display: 'flex', padding: '4px', marginLeft: '4px',
                        borderRadius: '4px'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.color = '#e2e8f0'}
                      onMouseOut={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <X size={16} />
                    </button>
                  )}
                </>
              )}
            </ToastBar>
          )}
        </Toaster>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected */}
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/quiz/:attemptId" element={<ProtectedRoute><QuizPage /></ProtectedRoute>} />
          <Route path="/review/:attemptId" element={<ProtectedRoute><Review /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
