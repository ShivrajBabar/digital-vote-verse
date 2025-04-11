
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";

// Import route groups
import PublicRoutes from "./components/routes/PublicRoutes";
import SuperadminRoutes from "./components/routes/SuperadminRoutes";
import AdminRoutes from "./components/routes/AdminRoutes";
import VoterRoutes from "./components/routes/VoterRoutes";

const queryClient = new QueryClient();

const App = () => {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthProvider>
            <Routes>
              <PublicRoutes />
              <SuperadminRoutes />
              <AdminRoutes />
              <VoterRoutes />
            </Routes>
          </AuthProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

export default App;
