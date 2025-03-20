
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { BusinessProvider } from "@/context/BusinessContext"; 
import { AuthProvider } from "@/context/AuthContext";
import Header from "@/components/layout/Header";
import PrivateRoute from "@/components/auth/PrivateRoute";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Invoicing from "./pages/Invoicing";
import Administration from "./pages/Administration";
import Customers from "./pages/Customers";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <BusinessProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Header />
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/facturacion" element={<Invoicing />} />
                <Route path="/administracion" element={
                  <PrivateRoute>
                    <Administration />
                  </PrivateRoute>
                } />
                <Route path="/clientes" element={
                  <PrivateRoute>
                    <Customers />
                  </PrivateRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatePresence>
          </BrowserRouter>
        </TooltipProvider>
      </BusinessProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
