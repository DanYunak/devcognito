import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './features/auth/authSlice';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterDashboard from './pages/RecruiterDashboard';

function App() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
    }
  }, [dispatch, token]);

  const defaultRoute = () => {
    if (!user) return '/login';
    if (user.role === 'candidate') return '/candidate';
    if (user.role === 'recruiter' || user.role === 'admin') return '/recruiter';
    return '/login';
  };

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute allowedRoles={['candidate']} />}>
        <Route path="/candidate" element={<CandidateDashboard />} />
      </Route>

      <Route element={<ProtectedRoute allowedRoles={['recruiter', 'admin']} />}>
        <Route path="/recruiter" element={<RecruiterDashboard />} />
      </Route>

      <Route
        path="/unauthorized"
        element={
          <div className="min-h-screen flex items-center justify-center text-red-500 text-xl">
            403 — Access Denied
          </div>
        }
      />

      <Route path="*" element={<Navigate to={defaultRoute()} replace />} />
    </Routes>
  );
}

export default App;