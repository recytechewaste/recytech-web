import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import VerifyPin from './pages/VerifyPin';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Collectors from './pages/Collectors';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import UserManagement from './pages/UserManagement'; 
import ProtectedRoute from './pages/ProtectedRoute';
import RewardPointManager from './pages/RewardPointManager';
import LguManager from './pages/LguManager';
import PointHistory from './pages/PointHistory';
import BinNetwork from './pages/BinNetwork';
import BinCollectionRequests from './pages/BinCollectionRequests';
import Unauthorized from './pages/Unauthorized';
import NotFound from './pages/NotFound';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-pin" element={<VerifyPin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={<ProtectedRoute><Dashboard /></ProtectedRoute>} 
          />
          <Route 
            path="/collectors" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <Collectors />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reward-points" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <RewardPointManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/lgu-management" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <LguManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <PointHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bin-network" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <BinNetwork />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bin-collection-requests" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <BinCollectionRequests />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reports" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <Reports />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/settings" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Admin', 'Super Admin']}>
                <Settings />
              </ProtectedRoute>
            } 
          />
          
          {/* Super Admin Only */}
          <Route 
            path="/users" 
            element={<ProtectedRoute allowedRoles={['Super Admin']}><UserManagement /></ProtectedRoute>} 
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
}

export default App;
