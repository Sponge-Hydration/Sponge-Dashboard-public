
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import AuthGuard from "./components/AuthGuard";
import RoleGuard from "./components/RoleGuard";
import Dashboard from "./pages/Dashboard";
import Patients from "./pages/Patients";
import UserDetail from "./pages/UserDetail";
import Nurses from "./pages/Nurses";
import MyHydration from "./pages/MyHydration";
import Family from "./pages/Family";
import Admin from "./pages/Admin";
import Login from "./pages/Login";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/dashboard/me" />} />
    <Route path="/login" element={<Login />} />
    <Route
      path="/dashboard"
      element={
        <AuthGuard>
          <RoleGuard allowedRoles={['nurse', 'admin']}>
            <Dashboard />
          </RoleGuard>
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/me"
      element={
        <AuthGuard>
          <MyHydration />
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/family"
      element={
        <AuthGuard>
          <Family />
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/patients"
      element={
        <AuthGuard>
          <RoleGuard allowedRoles={['nurse', 'admin']}>
            <Patients />
          </RoleGuard>
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/nurses"
      element={
        <AuthGuard>
          <RoleGuard allowedRoles={['nurse', 'admin']}>
            <Nurses />
          </RoleGuard>
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/admin"
      element={
        <AuthGuard>
          <RoleGuard allowedRoles={['admin']}>
            <Admin />
          </RoleGuard>
        </AuthGuard>
      }
    />
    <Route
      path="/dashboard/patient/:userId"
      element={
        <AuthGuard>
          <RoleGuard allowedRoles={['nurse', 'admin']}>
            <UserDetail />
          </RoleGuard>
        </AuthGuard>
      }
    />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
