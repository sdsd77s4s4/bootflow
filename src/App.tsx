import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// UI Components
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Contexts
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/components/theme-provider';

// Pages
import Landing from "./pages/Landing";
import HomeRoute from '@/components/HomeRoute';
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Sobre from "./pages/empresa/Sobre";
import Blog from "./pages/empresa/Blog";
import BlogPost from "./pages/BlogPost";

// Dashboards
import AdminDashboard from "./pages/dashboards/AdminDashboard";
import ClientDashboard from "./pages/dashboards/ClientDashboard";
import RequireAuth from '@/components/RequireAuth';


// Internal Pages
import Settings from "./pages/Settings";
import HelpCenter from "./pages/HelpCenter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import API from "./pages/API";
import Documentacao from "./pages/Documentacao";
import Integracoes from "./pages/Integracoes";
import Demo from "./pages/Demo";
import Products from "./pages/Products";
import Statistics from "./pages/Statistics";
import Ecommerce from "./pages/Ecommerce";
import Channels from "./pages/Channels";
import VoiceCampaigns from "./pages/VoiceCampaigns";
import AIConfiguration from "./pages/AIConfiguration";
import AdminResellers from "./pages/AdminResellers";
import ButtonConfigurator from "./pages/ButtonConfigurator";
import { WhatsAppStatusContext } from './pages/AdminWhatsApp';

const queryClient = new QueryClient();

// Componente para fornecer navegação ao AuthProvider
const AuthProviderWithNavigation = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return <AuthProvider navigate={navigate}>{children}</AuthProvider>;
};

const App = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected'>('disconnected');
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="bootflow-ui-theme">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProviderWithNavigation>
              <WhatsAppStatusContext.Provider value={{ isConnected, setIsConnected, connectionStatus, setConnectionStatus }}>
                <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<HomeRoute />} />
                <Route path="/preco" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Signup />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/ajuda" element={<HelpCenter />} />
                <Route path="/api" element={<API />} />
                <Route path="/documentacao" element={<Documentacao />} />
                <Route path="/integracoes" element={<Integracoes />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/empresa/sobre" element={<Sobre />} />
                <Route path="/empresa/blog" element={<Blog />} />
                <Route path="/empresa/blog/:category" element={<Blog />} />
                <Route path="/blog/:id" element={<BlogPost />} />

                {/* Dashboard Admin - Acesso direto (protegido) */}
                <Route path="/admin" element={<RequireAuth allowedRoles={['admin']}><AdminDashboard /></RequireAuth>} />
                <Route path="/admin/revendedores" element={<RequireAuth allowedRoles={['admin']}><AdminResellers /></RequireAuth>} />
                
                {/* Dashboard Cliente */}
                <Route path="/dashboard/client" element={<ClientDashboard />} />
                
                {/* Redirecionamento para /dashboard */}
                <Route path="/dashboard" element={<ClientDashboard />} />
                
                {/* Outras rotas */}
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/estatisticas" element={<Statistics />} />
                <Route path="/ecommerce" element={<Ecommerce />} />
                <Route path="/canais" element={<Channels />} />
                <Route path="/campanhas-voz" element={<VoiceCampaigns />} />
                <Route path="/ia-config" element={<AIConfiguration />} />
                <Route path="/button-configurator" element={<ButtonConfigurator />} />

                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </WhatsAppStatusContext.Provider>
          </AuthProviderWithNavigation>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
