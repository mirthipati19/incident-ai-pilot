
import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { ImprovedAuthProvider } from "@/contexts/ImprovedAuthContext";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";
import { SimpleAdminAuthProvider } from "@/contexts/SimpleAdminAuthContext";

// Lazy load components
const Index = lazy(() => import("./pages/Index"));
const SignIn = lazy(() => import("./pages/SignIn"));
const SignUp = lazy(() => import("./pages/SignUp"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ITSM = lazy(() => import("./pages/ITSM"));
const ServiceCatalogPage = lazy(() => import("./pages/ServiceCatalog"));
const KnowledgeBasePage = lazy(() => import("./pages/KnowledgeBase"));
const AssetManagementPage = lazy(() => import("./pages/AssetManagement"));
const RemoteDesktopPage = lazy(() => import("./pages/RemoteDesktop"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const NotFound = lazy(() => import("./pages/NotFound"));
const ProtectedLayout = lazy(() => import("./components/Layout/ProtectedLayout"));
const AdminLayout = lazy(() => import("./components/Layout/AdminLayout"));
const ProtectedRoute = lazy(() => import("./components/ProtectedRoute"));
const AdminRoute = lazy(() => import("./components/AdminRoute"));

// New simple admin components
const VisionAssist = lazy(() => import("./pages/VisionAssist"));
const RemoteSessionDetail = lazy(() => import("./pages/RemoteSessionDetail"));
const SimpleAdminLogin = lazy(() => import("./pages/SimpleAdminLogin"));
const SimpleAdminRegister = lazy(() => import("./pages/SimpleAdminRegister"));
const SimpleAdminPortal = lazy(() => import("./pages/SimpleAdminPortal"));
const SimpleAdminRoute = lazy(() => import("./components/SimpleAdminRoute"));

// Old admin components (deprecated)
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const AdminRegister = lazy(() => import("./pages/AdminRegister"));
const NewAdminPortal = lazy(() => import("./pages/NewAdminPortal"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <ImprovedAuthProvider>
          <AdminAuthProvider>
            <SimpleAdminAuthProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Suspense fallback={
                    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
                      <div className="text-white text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-white mx-auto mb-4"></div>
                        <p>Loading...</p>
                      </div>
                    </div>
                  }>
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Index />} />
                      <Route path="/signin" element={<SignIn />} />
                      <Route path="/signup" element={<SignUp />} />
                      <Route path="/404" element={<NotFound />} />

                      {/* New Simple Admin routes */}
                      <Route path="/vision-assist" element={<VisionAssist />} />
                      <Route path="/remote-session/:sessionId" element={<RemoteSessionDetail />} />
                      <Route path="/simple-admin-login" element={<SimpleAdminLogin />} />
                      <Route path="/simple-admin-register" element={<SimpleAdminRegister />} />
                      <Route path="/simple-admin-portal" element={
                        <SimpleAdminRoute>
                          <SimpleAdminPortal />
                        </SimpleAdminRoute>
                      } />

                      {/* Old Admin routes (deprecated) */}
                      <Route path="/admin/login" element={<AdminLogin />} />
                      <Route path="/admin/register" element={<AdminRegister />} />
                      <Route path="/admin/portal" element={
                        <AdminRoute>
                          <NewAdminPortal />
                        </AdminRoute>
                      } />

                      {/* Protected user routes - Fixed nesting structure */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<Dashboard />} />
                      </Route>
                      
                      <Route path="/itsm" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<ITSM />} />
                      </Route>
                      
                      <Route path="/service-catalog" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<ServiceCatalogPage />} />
                      </Route>
                      
                      <Route path="/knowledge-base" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<KnowledgeBasePage />} />
                      </Route>
                      
                      <Route path="/asset-management" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<AssetManagementPage />} />
                      </Route>
                      
                      <Route path="/remote-desktop" element={
                        <ProtectedRoute>
                          <ProtectedLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<RemoteDesktopPage />} />
                      </Route>

                      {/* Old admin routes (deprecated) */}
                      <Route path="/admin/dashboard" element={
                        <ProtectedRoute>
                          <AdminLayout />
                        </ProtectedRoute>
                      }>
                        <Route index element={<AdminDashboard />} />
                      </Route>

                      {/* Catch all */}
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </Suspense>
                </BrowserRouter>
              </TooltipProvider>
            </SimpleAdminAuthProvider>
          </AdminAuthProvider>
        </ImprovedAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
