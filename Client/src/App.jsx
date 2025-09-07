import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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

function App() {
  return (
    <AuthProvider>
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
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;