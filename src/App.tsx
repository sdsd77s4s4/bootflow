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
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AuthCallback from "./pages/AuthCallback";
import NotFound from "./pages/NotFound";
import Sobre from "./pages/empresa/Sobre";
import Blog from "./pages/empresa/Blog";

// Dashboards
import AdminDashboard from "./pages/dashboards/AdminDashboard";

// Internal Pages
import Settings from "./pages/Settings";
import HelpCenter from "./pages/HelpCenter";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import API from "./pages/API";
import Documentacao from "./pages/Documentacao";
import Integracoes from "./pages/Integracoes";
import Products from "./pages/Products";
import Statistics from "./pages/Statistics";
import Ecommerce from "./pages/Ecommerce";
import Channels from "./pages/Channels";
import VoiceCampaigns from "./pages/VoiceCampaigns";
import AIConfiguration from "./pages/AIConfiguration";
import AdminResellers from "./pages/AdminResellers";

const queryClient = new QueryClient();

// Componente para fornecer navegação ao AuthProvider
const AuthProviderWithNavigation = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  return <AuthProvider navigate={navigate}>{children}</AuthProvider>;
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="system" storageKey="bootflow-ui-theme">
        <TooltipProvider>
          <BrowserRouter>
            <AuthProviderWithNavigation>
              <Routes>
                {/* Rotas públicas */}
                <Route path="/" element={<Landing />} />
                <Route path="/preco" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/cadastro" element={<Signup />} />
                <Route path="/auth/callback" element={<AuthCallback />} />
                <Route path="/termos" element={<Terms />} />
                <Route path="/privacidade" element={<Privacy />} />
                <Route path="/ajuda" element={<HelpCenter />} />
                <Route path="/api" element={<API />} />
                <Route path="/documentacao" element={<Documentacao />} />
                <Route path="/integracoes" element={<Integracoes />} />
                <Route path="/empresa/sobre" element={<Sobre />} />
                <Route path="/empresa/blog" element={<Blog />} />

                {/* Dashboard Admin - Acesso direto */}
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/revendedores" element={<AdminResellers />} />
                
                {/* Outras rotas */}
                <Route path="/configuracoes" element={<Settings />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/estatisticas" element={<Statistics />} />
                <Route path="/ecommerce" element={<Ecommerce />} />
                <Route path="/canais" element={<Channels />} />
                <Route path="/campanhas-voz" element={<VoiceCampaigns />} />
                <Route path="/ia-config" element={<AIConfiguration />} />

                {/* Rota 404 */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AuthProviderWithNavigation>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;