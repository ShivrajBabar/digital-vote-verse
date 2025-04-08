
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import SuperadminDashboard from "./pages/superadmin/Dashboard";
import AdminDashboard from "./pages/admin/Dashboard";
import VoterDashboard from "./pages/voter/Dashboard";
import VoterProfile from "./pages/voter/Profile";
import Index from "./pages/Index";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<Index />} />
            
            {/* Superadmin routes */}
            <Route 
              path="/superadmin/dashboard" 
              element={
                <ProtectedRoute requiredRole="superadmin">
                  <SuperadminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Admin routes */}
            <Route 
              path="/admin/dashboard" 
              element={
                <ProtectedRoute requiredRole="admin">
                  <AdminDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* Voter routes */}
            <Route 
              path="/voter/dashboard" 
              element={
                <ProtectedRoute requiredRole="voter">
                  <VoterDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/voter/profile" 
              element={
                <ProtectedRoute requiredRole="voter">
                  <VoterProfile />
                </ProtectedRoute>
              } 
            />
            
            {/* Catch-all route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
