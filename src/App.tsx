
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ImprovedAuthProvider } from "@/contexts/ImprovedAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import { MainNavigation } from "@/components/Navigation/MainNavigation";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import SignIn from "@/pages/SignIn";
import SignUp from "@/pages/SignUp";
import ITSM from "@/pages/ITSM";
import AdminDashboard from "@/pages/AdminDashboard";
import ServiceCatalogPage from "@/pages/ServiceCatalog";
import KnowledgeBasePage from "@/pages/KnowledgeBase";
import AssetManagementPage from "@/pages/AssetManagement";
import NotFound from "@/pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <ImprovedAuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="min-h-screen bg-gray-50">
                <Routes>
                  {/* Public routes */}
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected routes with navigation */}
                  <Route path="/" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <Index />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/dashboard" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/itsm" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <ITSM />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/service-catalog" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <ServiceCatalogPage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/knowledge-base" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <KnowledgeBasePage />
                    </ProtectedRoute>
                  } />
                  
                  <Route path="/asset-management" element={
                    <ProtectedRoute>
                      <MainNavigation />
                      <AssetManagementPage />
                    </ProtectedRoute>
                  } />
                  
                  {/* Admin routes */}
                  <Route path="/admin/dashboard" element={
                    <AdminRoute>
                      <MainNavigation />
                      <AdminDashboard />
                    </AdminRoute>
                  } />
                  
                  {/* Fallback routes */}
                  <Route path="/404" element={<NotFound />} />
                  <Route path="*" element={<Navigate to="/404" replace />} />
                </Routes>
              </div>
            </BrowserRouter>
          </ImprovedAuthProvider>
        </ThemeProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
