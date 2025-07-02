
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ImprovedAuthProvider } from "@/contexts/ImprovedAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import SessionManager from "@/components/SessionManager";
import ProtectedLayout from "@/components/Layout/ProtectedLayout";
import AdminLayout from "@/components/Layout/AdminLayout";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ThemeProvider>
          <ImprovedAuthProvider>
            <Sonner />
            <BrowserRouter>
              <SessionManager />
              <div className="min-h-screen w-full bg-gray-50">
                <Routes>
                  {/* Public routes - accessible to everyone */}
                  <Route path="/" element={<Index />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  
                  {/* Protected routes with shared layout */}
                  <Route element={<ProtectedRoute><ProtectedLayout /></ProtectedRoute>}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/itsm" element={<ITSM />} />
                    <Route path="/service-catalog" element={<ServiceCatalogPage />} />
                    <Route path="/knowledge-base" element={<KnowledgeBasePage />} />
                    <Route path="/asset-management" element={<AssetManagementPage />} />
                  </Route>
                  
                  {/* Admin routes with shared layout */}
                  <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                  </Route>
                  
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
