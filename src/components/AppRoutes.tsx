
import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AdminAuthProvider } from "@/contexts/AdminAuthContext";

// Lazy load components
const Index = lazy(() => import("../pages/Index"));
const SignIn = lazy(() => import("../pages/SignIn"));
const SignUp = lazy(() => import("../pages/SignUp"));
const Dashboard = lazy(() => import("../pages/Dashboard"));
const ITSM = lazy(() => import("../pages/ITSM"));
const ServiceCatalogPage = lazy(() => import("../pages/ServiceCatalog"));
const KnowledgeBasePage = lazy(() => import("../pages/KnowledgeBase"));
const AssetManagementPage = lazy(() => import("../pages/AssetManagement"));
const AdminDashboard = lazy(() => import("../pages/AdminDashboard"));
const NotFound = lazy(() => import("../pages/NotFound"));
const ProtectedLayout = lazy(() => import("./Layout/ProtectedLayout"));
const AdminLayout = lazy(() => import("./Layout/AdminLayout"));
const ProtectedRoute = lazy(() => import("./ProtectedRoute"));
const AdminRoute = lazy(() => import("./AdminRoute"));

// New admin components
const AdminLogin = lazy(() => import("../pages/AdminLogin"));
const AdminRegister = lazy(() => import("../pages/AdminRegister"));
const NewAdminPortal = lazy(() => import("../pages/NewAdminPortal"));

const AppRoutes = () => (
  <AdminAuthProvider>
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

          {/* New Admin routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/register" element={<AdminRegister />} />
          <Route path="/admin/portal" element={
            <AdminRoute>
              <NewAdminPortal />
            </AdminRoute>
          } />

          {/* Protected user routes with proper nesting */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <Dashboard />
              </ProtectedLayout>
            </ProtectedRoute>
          } />
          <Route path="/itsm" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <ITSM />
              </ProtectedLayout>
            </ProtectedRoute>
          } />
          <Route path="/service-catalog" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <ServiceCatalogPage />
              </ProtectedLayout>
            </ProtectedRoute>
          } />
          <Route path="/knowledge-base" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <KnowledgeBasePage />
              </ProtectedLayout>
            </ProtectedRoute>
          } />
          <Route path="/asset-management" element={
            <ProtectedRoute>
              <ProtectedLayout>
                <AssetManagementPage />
              </ProtectedLayout>
            </ProtectedRoute>
          } />

          {/* Old admin routes (deprecated) with proper nesting */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute>
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            </ProtectedRoute>
          } />

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </AdminAuthProvider>
);

export default AppRoutes;
