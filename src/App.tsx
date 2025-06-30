
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Index from '@/pages/Index';
import SignIn from '@/pages/SignIn';
import SignUp from '@/pages/SignUp';
import ITSM from '@/pages/ITSM';
import NotFound from '@/pages/NotFound';
import { ImprovedAuthProvider } from '@/contexts/ImprovedAuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import ProtectedRoute from '@/components/ProtectedRoute';
import AdminRoute from '@/components/AdminRoute';
import { Toaster } from '@/components/ui/toaster';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminPortal from '@/pages/AdminPortal';
import DeveloperModeIndicator from '@/components/DeveloperModeIndicator';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <ImprovedAuthProvider>
          <div className="App">
            <DeveloperModeIndicator />
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
                  <AdminRoute>
                    <AdminPortal />
                  </AdminRoute>
                } 
              />
              <Route 
                path="/admin-dashboard" 
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                } 
              />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <Toaster />
          </div>
        </ImprovedAuthProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
