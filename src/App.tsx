
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImprovedAuthProvider } from "@/contexts/ImprovedAuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { ChatProvider, useChatContext } from "@/contexts/ChatContext";
import FloatingCallWindow from "@/components/Assistant/FloatingCallWindow";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import ITSM from "./pages/ITSM";
import ServiceCatalog from "./pages/ServiceCatalog";
import AssetManagement from "./pages/AssetManagement";
import KnowledgeBase from "./pages/KnowledgeBase";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AdminLogin from "./pages/AdminLogin";
import AdminRegister from "./pages/AdminRegister";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPortal from "./pages/AdminPortal";
import NewAdminPortal from "./pages/NewAdminPortal";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import "./App.css";

const queryClient = new QueryClient();

const FloatingCallWindowWrapper = () => {
  const { isCallActive, callDuration, endCall, isCallMinimized, toggleCallMinimized } = useChatContext();
  
  return (
    <FloatingCallWindow
      isActive={isCallActive}
      callDuration={callDuration}
      onEndCall={endCall}
      isMinimized={isCallMinimized}
      onToggleMinimize={toggleCallMinimized}
    />
  );
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ImprovedAuthProvider>
            <AdminAuthProvider>
              <ChatProvider>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/signin" element={<SignIn />} />
                  <Route path="/signup" element={<SignUp />} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin/register" element={<AdminRegister />} />
                  <Route
                    path="/dashboard"
                    element={
                      <ProtectedRoute>
                        <Dashboard />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/itsm"
                    element={
                      <ProtectedRoute>
                        <ITSM />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/service-catalog"
                    element={
                      <ProtectedRoute>
                        <ServiceCatalog />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/asset-management"
                    element={
                      <ProtectedRoute>
                        <AssetManagement />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/knowledge-base"
                    element={
                      <ProtectedRoute>
                        <KnowledgeBase />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin/dashboard"
                    element={
                      <AdminRoute>
                        <AdminDashboard />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/portal"
                    element={
                      <AdminRoute>
                        <AdminPortal />
                      </AdminRoute>
                    }
                  />
                  <Route
                    path="/admin/new-portal"
                    element={
                      <AdminRoute>
                        <NewAdminPortal />
                      </AdminRoute>
                    }
                  />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <FloatingCallWindowWrapper />
              </ChatProvider>
            </AdminAuthProvider>
          </ImprovedAuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
