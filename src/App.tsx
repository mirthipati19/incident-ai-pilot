import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ImprovedAuthProvider } from "@/contexts/ImprovedAuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import DevModeIndicator from "@/components/DevModeIndicator";
import Index from "./pages/Index";
import ITSM from "./pages/ITSM";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import AdminDashboard from "./pages/AdminDashboard";
import AdminPortal from "./pages/AdminPortal";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import EmailConfirmation from "./pages/EmailConfirmation";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ImprovedAuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <DevModeIndicator />
            <BrowserRouter>
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
                      <AdminDashboard />
                    </AdminRoute>
                  }
                />
                <Route
                  path="/admin-portal"
                  element={
                    <AdminRoute>
                      <AdminPortal />
                    </AdminRoute>
                  }
                />
                <Route path="/email-confirmation" element={<EmailConfirmation />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ImprovedAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
