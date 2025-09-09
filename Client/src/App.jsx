import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotifyProvider } from './context/NotifyContext';
import FeedbackToast from './components/FeedbackToast';
import { useNotify } from './context/NotifyContext';

const ToastRenderer = () => {
  const ctx = useNotify();
  if (!ctx) return null;
  const { toasts, remove } = ctx;

  return (
    <div className="flex flex-col items-end">
      {toasts.map((t) => (
        <FeedbackToast key={t.id} toast={t} onClose={() => remove(t.id)} />
      ))}
    </div>
  );
};
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ArtistGallery from './pages/ArtistGallery';
import ArtistDetail from './pages/ArtistDetail';
import AdminDashboard from './pages/AdminDashboard';
import UploadDocument from './pages/UploadDocument';
import EditArtist from './pages/EditArtist';

function App() {
  return (
    <AuthProvider>
      <NotifyProvider>
        <Router>
          <div className="min-h-screen bg-gradient-to-br from-primary-50 to-white">
            <Navbar />
            <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/artists" element={<ArtistGallery />} />
            <Route path="/artists/:id" element={<ArtistDetail />} />
            
            {/* Protected Admin Routes */}
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute adminOnly>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/upload" 
              element={
                <ProtectedRoute adminOnly>
                  <UploadDocument />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin/edit/:id" 
              element={
                <ProtectedRoute adminOnly>
                  <EditArtist />
                </ProtectedRoute>
              } 
            />
          </Routes>
          {/* Toast container (top-right) */}
          <div className="fixed top-6 right-6 z-50"> 
            <ToastRenderer />
          </div>
        </div>
      </Router>
      </NotifyProvider>
    </AuthProvider>
  );
}

export default App;