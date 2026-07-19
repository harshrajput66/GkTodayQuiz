import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { User, Mail, Calendar, LogOut, Shield } from 'lucide-react';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-animated">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 pt-24 pb-12">
        <h1 className="font-display text-3xl font-700 text-white mb-8">Profile</h1>

        {/* Avatar & Name */}
        <div className="glass-card p-8 mb-6 text-center">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary-400 to-accent-500 flex items-center justify-center text-3xl font-700 text-white mx-auto mb-4">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <h2 className="font-display text-xl font-700 text-white">{user?.name}</h2>
          <p className="text-slate-400 text-sm mt-1">{user?.email}</p>
          <span className="badge badge-primary mt-3">Student</span>
        </div>

        {/* Details */}
        <div className="glass-card p-6 mb-6">
          <h3 className="text-sm font-600 text-slate-400 uppercase tracking-wide mb-4">Account Details</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <User className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Full Name</p>
                <p className="text-white font-500">{user?.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3 border-b border-white/5">
              <Mail className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="text-white font-500">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 py-3">
              <Shield className="w-4 h-4 text-slate-500" />
              <div>
                <p className="text-xs text-slate-500">Authentication</p>
                <p className="text-white font-500">JWT + bcrypt (Secure)</p>
              </div>
            </div>
          </div>
        </div>

        {/* Logout */}
        <button
          id="profile-logout-btn"
          onClick={handleLogout}
          className="btn btn-danger w-full py-3"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
}
