import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './pages/ProtectedRoute';
import { ToastProvider } from './context/ToastContext';

// Lazy-loaded pages — each gets its own JS chunk, loaded on demand
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const VerifyPin = lazy(() => import('./pages/VerifyPin'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Collectors = lazy(() => import('./pages/Collectors'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const RewardPointManager = lazy(() => import('./pages/RewardPointManager'));
const PartnerOrgManager = lazy(() => import('./pages/PartnerOrgManager'));
const PointHistory = lazy(() => import('./pages/PointHistory'));
const BinNetwork = lazy(() => import('./pages/BinNetwork'));
const BinCollectionRequests = lazy(() => import('./pages/BinCollectionRequests'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Minimal full-screen spinner shown while a page chunk is being fetched
const PageLoader = () => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    background: '#f0faf5',
  }}>
    <div style={{
      width: '40px',
      height: '40px',
      border: '4px solid #d1fae5',
      borderTop: '4px solid #16a34a',
      borderRadius: '50%',
      animation: 'spin 0.8s linear infinite',
    }} />
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

function App() {
  return (
    <ToastProvider>
      <Router>
        <Suspense fallback={<PageLoader />}>
          <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-pin" element={<VerifyPin />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Protected Routes */}
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/collectors" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
                <Collectors />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/reward-points" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Super Admin']}>
                <RewardPointManager />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/partner-organizations" 
            element={
              <ProtectedRoute allowedRoles={['Admin', 'Super Admin']}>
                <PartnerOrgManager />
              </ProtectedRoute>
            } 
          />
          <Route path="/lgu-management" element={<Navigate to="/partner-organizations" replace />} />
          <Route 
            path="/transactions" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Super Admin']}>
                <PointHistory />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bin-network" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Super Admin']}>
                <BinNetwork />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/bin-collection-requests" 
            element={
              <ProtectedRoute allowedRoles={['Staff', 'Super Admin']}>
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
          
          {/* Admin & Super Admin */}
          <Route 
            path="/users" 
            element={<ProtectedRoute allowedRoles={['Admin', 'Super Admin']}><UserManagement /></ProtectedRoute>} 
          />

          {/* Catch-all 404 Route */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </Router>
    </ToastProvider>
  );
}

export default App;
