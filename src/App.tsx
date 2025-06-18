
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ITSM from '@/pages/ITSM';
import NotFound from '@/pages/NotFound';
import { AuthProvider } from '@/contexts/AuthContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import AdminDashboard from '@/pages/AdminDashboard';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signin" element={<SignIn />} />
            <Route path="/signup" element={<SignUp />} />
            <Route 
              path="/itsm" 
              element={
                <ProtectedRoute>
                  <ITSM />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Toaster />
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;
