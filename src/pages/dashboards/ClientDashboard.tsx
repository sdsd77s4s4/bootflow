import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useClientes } from '@/hooks/useClientes';
import { useRevendas } from '@/hooks/useRevendas';
import { useRealtimeClientes, useRealtimeRevendas } from '@/hooks/useRealtime';
import type { TableRow, TableInsert } from '@/types/supabase.types';
import useDashboardData from '@/hooks/useDashboardData';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { 
  Brain, 
  Users, 
  Tv, 
  Radio, 
  ShoppingCart, 
  BarChart3, 
  Settings, 
  Plus,
  MessageSquare,
  Gamepad2,
  Zap,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  DollarSign,
  TrendingUp,
  Clock,
  Home,
  Paintbrush,
  UserPlus,
  Bell,
  RefreshCw,
  AlertCircle,
  Calendar
} from "lucide-react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ClientSidebar } from "@/components/sidebars/ClientSidebar";
import { AIModalManager } from "@/components/modals/AIModalManager";
import { ThemeToggle } from "@/components/theme-toggle";
import { Dialog, DialogContent, DialogTrigger, DialogTitle, DialogDescription, DialogHeader } from '@/components/ui/dialog';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Importando as páginas como componentes
import ClientClients from "../client/ClientClients";
import ClientResellers from "../client/ClientResellers";
import ClientBilling from "../client/ClientBilling";
import ClientNotifications from "../client/ClientNotifications";
import ClientWhatsApp from "../client/ClientWhatsApp";
import ClientGateways from "../client/ClientGateways";
import ClientBranding from "../client/ClientBranding";
import ClientShop from "../client/ClientShop";
import ClientAI from "../client/ClientAI";
import ClientGames from "../client/ClientGames";
import ClientAnalytics from "../client/ClientAnalytics";
import ClientSettings from "../client/ClientSettings";
import ClientProfile from "../client/ClientProfile";

// Wrapper para ClientResellers que aceita callback quando um revendedor é criado
const ClientResellersWrapper = ({ onResellerCreated, onCloseModal }: { onResellerCreated: () => void; onCloseModal: () => void }) => {
  useEffect(() => {
    const handleResellerCreated = () => {
      onResellerCreated();
    };
    
    const handleCloseModal = () => {
      onCloseModal();
    };
    
    // Escutar evento de revendedor criado
    window.addEventListener('reseller-created', handleResellerCreated);
    // Escutar evento para fechar modal
    window.addEventListener('close-reseller-modal', handleCloseModal);
    
    return () => {
      window.removeEventListener('reseller-created', handleResellerCreated);
      window.removeEventListener('close-reseller-modal', handleCloseModal);
    };
  }, [onResellerCreated, onCloseModal]);
  
  return <ClientResellers />;
};

const ClientDashboard = () => {
  // Obter o cliente logado para filtrar dados
  const { user } = useAuth();
  
  // --- Estados para integração APIBrasil QR Code ---
  const [apiBrasilConfig, setApiBrasilConfig] = useState(() => {
    const saved = localStorage.getItem('apiBrasilConfig');
    return saved ? JSON.parse(saved) : { bearerToken: '', profileId: '' };
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [isLoadingQR, setIsLoadingQR] = useState(false);
  // --- Fim estados integração APIBrasil ---
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [clientModal, setClientModal] = useState(false);
  const [resellerModal, setResellerModal] = useState(false);
  const [brandingModal, setBrandingModal] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [viewMode, setViewMode] = useState<'grid' | 'kanban'>('grid');
  // Usando o hook personalizado para gerenciar os dados do dashboard
  const { stats, loading: loadingStats, error: statsError, refresh: refreshStats } = useDashboardData();

  // Estados para o modal de cliente
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    plan: "",
    price: "",
    status: "Ativo",
    telegram: "",
    observations: "",
    expirationDate: "",
    password: "",
    bouquets: "",
    realName: "",
    whatsapp: "",
    devices: 0,
    credits: 0,
    notes: "",
    server: "",
    m3u_url: "",
  });

  // Estados para o modal de revendedor
  const [newReseller, setNewReseller] = useState({
    username: "",
    password: "",
    force_password_change: false,
    permission: "",
    credits: 10,
    servers: "",
    master_reseller: "",
    disable_login_days: 0,
    monthly_reseller: false,
    personal_name: "",
    email: "",
    telegram: "",
    whatsapp: "",
    observations: ""
  });

  const [isAddingReseller, setIsAddingReseller] = useState(false);

  // Estados para a extração M3U
  const [m3uUrl, setM3uUrl] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionResult, setExtractionResult] = useState<Record<string, unknown> | null>(null);
  const [extractionError, setExtractionError] = useState("");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Hooks para dados de usuários e revendedores com atualização em tempo real
  const { data: realtimeClientes, error: clientesError, isConnected: clientesConnected } = useRealtimeClientes();
  const { data: realtimeRevendas, error: revendasError, isConnected: revendasConnected } = useRealtimeRevendas();
  
  // Hooks para funções de atualização e dados
  const { clientes: clientesFromHook, fetchClientes, addCliente: addClienteHook } = useClientes();
  const { revendas: revendasFromHook, fetchRevendas } = useRevendas();
  
  // Estados locais para os dados
  const [clientes, setClientes] = useState<TableRow<'clientes'>[]>([]);
  const [revendas, setRevendas] = useState<TableRow<'revendas'>[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loadingRevendas, setLoadingRevendas] = useState(true);
  
  // Atualiza os estados locais quando os dados em tempo real mudam OU quando os dados dos hooks mudam
  useEffect(() => {
    console.log('🔄 [ClientDashboard] useEffect sincronização - revendasFromHook:', revendasFromHook?.length, 'realtimeRevendas:', realtimeRevendas?.length);
    // Priorizar dados do hook se disponíveis, caso contrário usar dados em tempo real
    let clientesToUse = clientesFromHook && clientesFromHook.length > 0 ? clientesFromHook : realtimeClientes;
    let revendasToUse = revendasFromHook && revendasFromHook.length > 0 ? revendasFromHook : realtimeRevendas;
    
    // Filtrar por admin_id se houver cliente logado (garantir que apenas dados do cliente sejam exibidos)
    if (user?.id) {
      if (clientesToUse && Array.isArray(clientesToUse)) {
        clientesToUse = clientesToUse.filter((cliente: TableRow<'clientes'>) => {
          return cliente.admin_id === user.id || cliente.admin_id === null || cliente.admin_id === undefined;
        }) as TableRow<'clientes'>[];
      }
      if (revendasToUse && Array.isArray(revendasToUse)) {
        revendasToUse = revendasToUse.filter((revenda: TableRow<'revendas'>) => {
          return revenda.admin_id === user.id || revenda.admin_id === null || revenda.admin_id === undefined;
        }) as TableRow<'revendas'>[];
      }
      console.log('🔄 [ClientDashboard] Dados filtrados por admin_id:', user.id, 'Clientes:', clientesToUse?.length, 'Revendas:', revendasToUse?.length);
    }
    
    if (clientesToUse) {
      setClientes(clientesToUse as TableRow<'clientes'>[]);
      setLoadingClientes(false);
    }
    
    if (revendasToUse) {
      console.log('✅ [ClientDashboard] Atualizando estado revendas com', revendasToUse.length, 'revendedores');
      setRevendas(revendasToUse as TableRow<'revendas'>[]);
      setLoadingRevendas(false);
    }
  }, [realtimeClientes, realtimeRevendas, clientesFromHook, revendasFromHook, user?.id]);
  
  // Buscar dados iniciais ao montar o componente (apenas uma vez)
  useEffect(() => {
    if (fetchClientes) {
      fetchClientes();
    }
    if (fetchRevendas) {
      fetchRevendas();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Executar apenas uma vez ao montar

  // Exibe notificações de erro
  useEffect(() => {
    if (clientesError) {
      console.error('Erro na conexão em tempo real de clientes:', clientesError);
      toast.error('Erro ao conectar com atualizações em tempo real de clientes');
    }
    
    if (revendasError) {
      console.error('Erro na conexão em tempo real de revendas:', revendasError);
      toast.error('Erro ao conectar com atualizações em tempo real de revendas');
    }
  }, [clientesError, revendasError]);
  
  // Função para adicionar um novo cliente (usa o hook useClientes)
  const addCliente = useCallback(async (clienteData: TableInsert<'clientes'>) => {
    try {
      console.log('🔄 [ClientDashboard] addCliente wrapper chamado com:', clienteData);
      
      // Chamar diretamente o hook sem verificar sessão (o hook já faz isso)
      const success = await addClienteHook(clienteData);
      
      if (success) {
        toast.success('Cliente adicionado com sucesso!');
        return true;
      } else {
        // Mostra mensagem de erro mais específica
        const errorMsg = 'Não foi possível adicionar o cliente. Verifique se você está autenticado e se todos os campos obrigatórios estão preenchidos.';
        toast.error(errorMsg, { duration: 5000 });
        console.error('Erro ao adicionar cliente - verifique o console para detalhes');
        return false;
      }
    } catch (error: unknown) {
      console.error('Erro no wrapper addCliente:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao adicionar cliente: ${errorMessage}`, { duration: 5000 });
      return false;
    }
  }, [addClienteHook]);
  
  // Função para adicionar um novo revendedor
  const addRevenda = useCallback(async (revendaData: TableInsert<'revendas'>) => {
    try {
      const { data, error } = await supabase
        .from('revendas')
        .insert([revendaData])
        .select();
        
      if (error) throw error;
      
      toast.success('Revendedor adicionado com sucesso!');
      return { data, error: null };
    } catch (error) {
      console.error('Erro ao adicionar revendedor:', error);
      toast.error('Erro ao adicionar revendedor');
      return { data: null, error };
    }
  }, []);

  // Função para formatar a data relativa
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Agora';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
    return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
  };

  // Função para retornar os preços baseados no plano selecionado
  const getPlanPrices = (plan: string): string[] => {
    const prices: { [key: string]: string[] } = {
      "Mensal": ["30,00", "35,00", "40,00", "50,00"],
      "Bimestral": ["50,00", "60,00", "70,00"],
      "Trimestral": ["75,00", "90,00", "100,00"],
      "Semestral": ["150,00", "160,00", "170,00"],
      "Anual": ["130,00", "180,00", "200,00", "250,00", "280,00"],
    };
    return prices[plan] || [];
  };

  // Função para calcular clientes que expiram em 3 dias
  const clientesExpiramEm3Dias = useMemo(() => {
    if (!clientes || clientes.length === 0) return 0;
    
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    
    // Data de expiração em 3 dias (incluindo hoje, então são 3 dias a partir de hoje)
    const em3Dias = new Date();
    em3Dias.setDate(hoje.getDate() + 3);
    em3Dias.setHours(0, 0, 0, 0);
    
    const count = clientes.filter(cliente => {
      if (!cliente.expiration_date) return false;
      
      try {
        const expirationDate = new Date(cliente.expiration_date);
        expirationDate.setHours(0, 0, 0, 0);
        
        // Calcular diferença em dias
        const diffTime = expirationDate.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        // Clientes que expiram em 3 dias ou menos (0, 1, 2 ou 3 dias)
        return diffDays >= 0 && diffDays <= 3;
      } catch (error) {
        console.error('Erro ao processar data de expiração:', error);
        return false;
      }
    }).length;
    
    return count;
  }, [clientes]);

  // Função para formatar valor monetário em formato brasileiro
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Usar ref para evitar loops infinitos
  const isRefreshingRef = useRef(false);
  const lastRefreshRef = useRef(0);

  // Função para atualizar clientes
  const refreshUsers = useCallback(() => {
    // Evitar múltiplas chamadas simultâneas
    const now = Date.now();
    if (isRefreshingRef.current || (now - lastRefreshRef.current < 1000)) {
      return;
    }
    isRefreshingRef.current = true;
    lastRefreshRef.current = now;
    
    if (fetchClientes) {
      fetchClientes();
    }
    
    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 1000);
  }, [fetchClientes]);
  
  // Função para atualizar revendas
  const refreshResellers = useCallback(() => {
    // Evitar múltiplas chamadas simultâneas
    const now = Date.now();
    if (isRefreshingRef.current || (now - lastRefreshRef.current < 1000)) {
      return;
    }
    isRefreshingRef.current = true;
    lastRefreshRef.current = now;
    
    if (fetchRevendas) {
      fetchRevendas();
    }
    
    setTimeout(() => {
      isRefreshingRef.current = false;
    }, 1000);
  }, [fetchRevendas]);

  // Sistema de Proxy CORS Multi-Fallback (apenas HTTPS para evitar Mixed Content)
  const corsProxies = [
    {
      name: "api.allorigins.win",
      url: (targetUrl: string) =>
        `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`,
    },
    {
      name: "corsproxy.io",
      url: (targetUrl: string) =>
        `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`,
    },
  ];

  // Função para extrair dados M3U usando o sistema que funcionou
  const extractM3UData = async () => {
    if (!m3uUrl.trim()) {
      setExtractionError("Por favor, insira uma URL M3U válida.");
      return;
    }

    setIsExtracting(true);
    setExtractionError("");
    setExtractionResult(null);

    try {
      // Extrair credenciais da URL
      const urlObj = new URL(m3uUrl);
      const username = urlObj.searchParams.get("username") || "";
      const password = urlObj.searchParams.get("password") || "";
      const baseUrl = `${urlObj.protocol}//${urlObj.host}`;

      if (!username || !password) {
        throw new Error(
          "Credenciais não encontradas na URL. Verifique se a URL contém username e password."
        );
      }

      // Construir URLs da API
      const apiUrl = `${baseUrl}/player_api.php?username=${username}&password=${password}`;

      // Verificar se é HTTP e avisar sobre Mixed Content
      if (urlObj.protocol === "http:") {
        console.log(
          "URL HTTP detectada - usando proxies para evitar Mixed Content"
        );
        setExtractionError("URL HTTP detectada - usando proxies seguros...");
      } else {
        // Tentar primeiro sem proxy (se for HTTPS)
        try {
          console.log("Tentando acesso direto...");
          setExtractionError("Tentando acesso direto...");

          const response = await fetch(apiUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
          });

          if (response.ok) {
            const text = await response.text();
            let data;

            try {
              data = JSON.parse(text);
            } catch (parseError) {
              throw new Error("Resposta não é um JSON válido.");
            }

            if (!data.user_info) {
              throw new Error("Dados do usuário não encontrados na resposta.");
            }

            console.log("Sucesso com acesso direto!");

          // Aplicar dados extraídos ao formulário
          const extractedData = {
            name: data.user_info.username,
            email: `${data.user_info.username}@iptv.com`,
            plan: data.user_info.is_trial === "1" ? "Trial" : "Premium",
            price: "",
            status: data.user_info.status === "Active" ? "Ativo" : "Inativo",
            telegram: data.user_info.username
              ? `@${data.user_info.username}`
              : "",
            observations: `Usuário: ${data.user_info.username} | Acesso direto`,
            expirationDate: data.user_info.exp_date
              ? new Date(parseInt(data.user_info.exp_date) * 1000)
                  .toISOString()
                  .split("T")[0]
              : "",
            password: data.user_info.password || password,
            bouquets: "",
            realName: "",
            whatsapp: "",
            devices: data.user_info.max_connections
              ? parseInt(data.user_info.max_connections)
              : 1,
            credits: 0,
            notes: "",
            server: "",
            m3u_url: "",
          };

            setNewUser(extractedData as typeof newUser);

            setExtractionResult({
              success: true,
              message: `Dados extraídos com sucesso! Usuário: ${data.user_info.username}`,
              data: data,
            });

            setExtractionError("");
            return;
          }
        } catch (directError) {
          console.log("Acesso direto falhou, tentando proxies...");
        }
      }

      // Tentar com diferentes proxies
      for (let i = 0; i < corsProxies.length; i++) {
        const proxy = corsProxies[i];
        const proxiedUrl = `${proxy.url(apiUrl)}`;

        try {
          console.log(
            `Tentando proxy ${i + 1}/${corsProxies.length}: ${proxy.name}`
          );
          setExtractionError(
            `Testando proxy ${i + 1}/${corsProxies.length}...`
          );

          const response = await fetch(proxiedUrl, {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
            },
            mode: "cors",
          });

          if (!response.ok) {
            if (response.status === 403) {
              throw new Error("Acesso negado. Verifique suas credenciais.");
            } else if (response.status === 404) {
              throw new Error("Servidor IPTV não encontrado.");
            } else {
              throw new Error(`Erro HTTP: ${response.status}`);
            }
          }

          const text = await response.text();
          let data;

          try {
            data = JSON.parse(text);
          } catch (parseError) {
            throw new Error("Resposta não é um JSON válido.");
          }

          if (!data.user_info) {
            throw new Error("Dados do usuário não encontrados na resposta.");
          }

          console.log(`Sucesso com proxy: ${proxy.name}`);

          // Preparar observações com dados reais
          const observations = [];
          if (data.user_info.username)
            observations.push(`Usuário: ${data.user_info.username}`);
          if (data.user_info.password)
            observations.push(`Senha: ${data.user_info.password}`);
          if (data.user_info.exp_date) {
            const expDate = new Date(parseInt(data.user_info.exp_date) * 1000);
            observations.push(`Expira: ${expDate.toLocaleDateString("pt-BR")}`);
          }
          if (data.user_info.max_connections)
            observations.push(`Conexões: ${data.user_info.max_connections}`);
          if (data.user_info.active_cons)
            observations.push(`Ativas: ${data.user_info.active_cons}`);

          // Aplicar dados extraídos ao formulário
          const extractedData = {
            name: data.user_info.username || username,
            email: `${data.user_info.username || username}@iptv.com`,
            plan: data.user_info.is_trial === "1" ? "Trial" : "Premium",
            price: "",
            status: data.user_info.status === "Active" ? "Ativo" : "Inativo",
            telegram: data.user_info.username
              ? `@${data.user_info.username}`
              : "",
            observations:
              observations.length > 0 ? observations.join(" | ") : "",
            expirationDate: data.user_info.exp_date
              ? new Date(parseInt(data.user_info.exp_date) * 1000)
                  .toISOString()
                  .split("T")[0]
              : "",
            password: data.user_info.password || password,
            bouquets: "Premium, Sports, Movies",
            realName: "",
            whatsapp: "",
            devices: data.user_info.max_connections
              ? parseInt(data.user_info.max_connections)
              : 1,
            credits: 0,
            notes: "",
            server: "",
            m3u_url: "",
          };

          setNewUser(extractedData);

          setExtractionResult({
            success: true,
            message: `Dados extraídos com sucesso! Usuário: ${data.user_info.username}`,
            data: data,
          });

          setExtractionError("");
          return;
        } catch (error) {
          console.log(`Falha com proxy ${proxy.name}:`, error);

          if (i === corsProxies.length - 1) {
            // Se todos os proxies falharam, usar dados simulados como fallback
            console.log("Todos os proxies falharam, usando dados simulados...");
            setExtractionError("Proxies falharam, usando dados simulados...");

            // Simular dados baseados na URL
            const extractedData = {
              name: username,
              email: `${username}@iptv.com`,
              plan: "Premium",
              price: "",
              status: "Ativo",
              telegram: `@${username}`,
              observations: `Usuário: ${username} | Senha: ${password} | Dados simulados`,
              expirationDate: "",
              password: password,
              bouquets: "",
              realName: "",
              whatsapp: "",
              devices: 1,
              credits: 0,
              notes: "",
              server: "",
              m3u_url: "",
            };

            setNewUser(extractedData as typeof newUser);

            setExtractionResult({
              success: true,
              message: `Dados simulados aplicados! Usuário: ${username}`,
              data: { user_info: { username, password } },
            });

            setExtractionError("");
            return;
          }
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erro desconhecido";
      setExtractionError(errorMessage);
      console.error("Erro na extração M3U:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddUser = async () => {
    console.log("🔵 [ClientDashboard] handleAddUser chamado");
    console.log("🔵 [ClientDashboard] Estado newUser:", newUser);
    
    // Validação completa dos campos obrigatórios
    if (!newUser.name || !newUser.email || !newUser.plan) {
      console.log("❌ [ClientDashboard] Validação falhou: campos obrigatórios não preenchidos");
      alert("Por favor, preencha todos os campos obrigatórios: Nome, Email e Plano.");
      return;
    }

    // Validar data de vencimento
    if (!newUser.expirationDate) {
      console.log("❌ [ClientDashboard] Validação falhou: data de vencimento não preenchida");
      alert("Por favor, preencha a data de vencimento.");
      return;
    }

    console.log("✅ [ClientDashboard] Validação passou, iniciando processo...");
    setIsAddingUser(true);

    // Timeout de segurança para evitar travamento infinito (30 segundos)
    let timeoutId: NodeJS.Timeout | null = null;
    timeoutId = setTimeout(() => {
      console.error("⏰ [ClientDashboard] Timeout: processo demorou mais de 30 segundos");
      setIsAddingUser(false);
      alert("⏰ O processo está demorando muito. Verifique sua conexão e tente novamente.");
    }, 30000);

    try {
      console.log("📤 [ClientDashboard] Dados do usuário a ser adicionado:", newUser);

      // Preparar dados do usuário para o Supabase (snake_case)
      const userData = {
        name: newUser.realName || newUser.name,
        email: newUser.email,
        plan: newUser.plan, // Campo obrigatório
        price: newUser.price || "", // Campo de preço
        status: newUser.status || "Ativo", // Campo obrigatório com default
        expiration_date: newUser.expirationDate, // Campo obrigatório
        password: newUser.password || "",
        m3u_url: newUser.m3u_url || "",
        bouquets: newUser.bouquets || "",
        observations: newUser.observations || "",
        real_name: newUser.realName || "",
        telegram: newUser.telegram || "",
        whatsapp: newUser.whatsapp || "",
        devices: newUser.devices || 0,
        credits: newUser.credits || 0,
        notes: newUser.notes || "",
        server: newUser.server || "",
      };

      console.log("📤 [ClientDashboard] Dados preparados para adicionar:", userData);

      // Adicionar usuário usando o hook
      console.log("🔄 [ClientDashboard] Chamando addCliente...");
      const success = await addCliente(userData);
      console.log("🔄 [ClientDashboard] addCliente retornou:", success);

      // Verificar se a operação foi bem-sucedida
      if (!success) {
        console.error("❌ [ClientDashboard] addCliente retornou false");
        const errorMessage = "Erro ao adicionar cliente. Verifique os dados e tente novamente.";
        console.error("❌ [ClientDashboard] Mensagem de erro:", errorMessage);
        throw new Error(errorMessage);
      }

      console.log("✅ [ClientDashboard] Cliente adicionado com sucesso!");
      
      // Cancelar timeout de segurança já que a operação foi bem-sucedida
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Limpar formulário
      setNewUser({
        name: "",
        email: "",
        plan: "",
        price: "",
        status: "Ativo",
        telegram: "",
        observations: "",
        expirationDate: "",
        password: "",
        bouquets: "",
        realName: "",
        whatsapp: "",
        devices: 0,
        credits: 0,
        notes: "",
        server: "",
        m3u_url: "",
      });

      // Limpar dados de extração
      setM3uUrl("");
      setExtractionResult(null);
      setExtractionError("");

      // Fechar modal
      setClientModal(false);

      // Atualizar dados
      refreshUsers();

      // Atualizar dashboard
      setRefreshTrigger(prev => prev + 1);
    } catch (error: any) {
      console.error("❌ [ClientDashboard] Erro ao adicionar usuário:", error);
      
      // Cancelar timeout de segurança já que houve erro
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      
      const errorMessage = error?.message || error || "Erro desconhecido ao adicionar usuário.";
      
      // Mensagens específicas para diferentes tipos de erro
      if (errorMessage.includes("duplicate key value") || errorMessage.includes("unique constraint")) {
        alert("❌ Já existe um usuário com este e-mail!");
      } else if (errorMessage.includes("row-level security") || errorMessage.includes("RLS")) {
        alert("❌ Erro de permissão: Verifique se você está autenticado e se as políticas RLS estão configuradas corretamente.");
      } else if (errorMessage.includes("autenticação") || errorMessage.includes("sessão expirou")) {
        alert("❌ Sua sessão expirou. Por favor, faça login novamente.");
      } else if (errorMessage.includes("NOT NULL") || errorMessage.includes("null value")) {
        alert("❌ Erro: Alguns campos obrigatórios não foram preenchidos corretamente.");
      } else {
        alert(`❌ Erro ao adicionar usuário: ${errorMessage}`);
      }
    } finally {
      console.log("🔄 [ClientDashboard] Finalizando processo (finally)...");
      setIsAddingUser(false);
    }
  };

  const handleAddReseller = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newReseller.username || !newReseller.password || !newReseller.permission) {
      alert("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    setIsAddingReseller(true);
    try {
      const success = await addRevenda({
        username: newReseller.username,
        password: newReseller.password,
        force_password_change: newReseller.force_password_change?.toString(),
        permission: newReseller.permission as 'admin' | 'reseller' | 'subreseller',
        credits: newReseller.credits,
        servers: newReseller.servers || undefined,
        master_reseller: newReseller.master_reseller || undefined,
        disable_login_days: newReseller.disable_login_days,
        monthly_reseller: newReseller.monthly_reseller,
        personal_name: newReseller.personal_name || undefined,
        email: newReseller.email || undefined,
        telegram: newReseller.telegram || undefined,
        whatsapp: newReseller.whatsapp || undefined,
        observations: newReseller.observations || undefined
      });

      if (success) {
        // Limpar formulário
        setNewReseller({
          username: "",
          password: "",
          force_password_change: false,
          permission: "",
          credits: 10,
          servers: "",
          master_reseller: "",
          disable_login_days: 0,
          monthly_reseller: false,
          personal_name: "",
          email: "",
          telegram: "",
          whatsapp: "",
          observations: ""
        });
        
        // Fechar modal
        setResellerModal(false);
        
        // Navegar para a página de Gerenciamento de Revendedores
        setCurrentPage("resellers");
        
        // Atualizar dados
        refreshResellers();
        
        // Atualizar dashboard
        setRefreshTrigger(prev => prev + 1);
      }
    } catch (error) {
      console.error("Erro ao adicionar revendedor:", error);
      alert("Erro ao adicionar revendedor. Tente novamente.");
    } finally {
      setIsAddingReseller(false);
    }
  };

  const handleModalOpen = (modalType: string) => {
    setActiveModal(modalType);
  };

  const handleModalClose = () => {
    setActiveModal(null);
  };

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    setDrawerOpen(false); // Fecha o Drawer no mobile
  };

  // Kanban columns state
  const [kanbanColumns, setKanbanColumns] = useState({
    'servicos': {
      id: 'servicos',
      title: 'Serviços Principais',
      color: 'bg-blue-600',
      cards: [
    {
      id: 'clientes',
      content: (
        <CardHeader className="bg-gradient-to-r from-purple-700 to-purple-500 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Users className="w-6 h-6 text-purple-200" />
            <CardTitle className="text-white">Clientes</CardTitle>
          </div>
        </CardHeader>
      ),
      body: (
        <CardContent className="bg-[#1f2937] rounded-b-lg">
          <p className="text-gray-300 mb-4">Gerencie todos os seus clientes cadastrados</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Total de Clientes:</span><span className="text-sm font-semibold text-white">{(clientes?.length || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Clientes Ativos:</span><span className="text-sm font-semibold text-white">{stats.activeClients.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Novos este mês:</span><span className="text-sm font-semibold text-green-400">+{stats.monthlyGrowth}%</span></div>
          </div>
        </CardContent>
      ),
      onClick: () => handlePageChange("clients")
    },
    {
      id: 'revendas',
      content: (
        <CardHeader className="bg-gradient-to-r from-green-700 to-green-500 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <UserPlus className="w-6 h-6 text-green-200" />
            <CardTitle className="text-white">Revendas</CardTitle>
          </div>
        </CardHeader>
      ),
      body: (
        <CardContent className="bg-[#1f2937] rounded-b-lg">
          <p className="text-gray-300 mb-4">Gerencie suas revendas e parceiros</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Revendedores Ativos:</span><span className="text-sm font-semibold text-white">{stats.activeResellers}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Novos este mês:</span><span className="text-sm font-semibold text-green-400">+8</span></div>
          </div>
        </CardContent>
      ),
      onClick: () => handlePageChange("resellers")
    }
      ]
    },
    'personalizacao': {
      id: 'personalizacao',
      title: 'Cobrança',
      color: 'bg-purple-600',
      cards: [
    {
      id: 'cobranca',
      content: (
        <CardHeader className="bg-gradient-to-r from-blue-700 to-blue-500 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-blue-200" />
            <CardTitle className="text-white">Cobrança</CardTitle>
          </div>
        </CardHeader>
      ),
      body: (
        <CardContent className="bg-[#1f2937] rounded-b-lg">
          <p className="text-gray-300 mb-4">Controle e visualize cobranças e pagamentos</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Receita Total:</span><span className="text-sm font-semibold text-white">R$ {stats.totalRevenue.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Pagamentos este mês:</span><span className="text-sm font-semibold text-green-400">+15</span></div>
          </div>
        </CardContent>
      ),
      onClick: () => handlePageChange("billing")
    }
      ]
    },
    'analytics': {
      id: 'analytics',
      title: 'Notificações',
      color: 'bg-red-600',
      cards: [
        {
          id: 'notificacoes',
      content: (
        <CardHeader className="bg-gradient-to-r from-red-700 to-red-500 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-red-200" />
            <CardTitle className="text-white">Notificações</CardTitle>
          </div>
        </CardHeader>
      ),
      body: (
        <CardContent className="bg-[#1f2937] rounded-b-lg">
          <p className="text-gray-300 mb-4">Gerencie alertas e notificações do sistema</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Notificações Enviadas:</span><span className="text-sm font-semibold text-white">2.345</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Novas este mês:</span><span className="text-sm font-semibold text-green-400">+120</span></div>
          </div>
        </CardContent>
      ),
      onClick: () => handlePageChange("notifications")
    },
    {
      id: 'whatsapp',
      content: (
        <CardHeader className="bg-gradient-to-r from-green-800 to-green-600 rounded-t-lg">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-6 h-6 text-green-200" />
            <CardTitle className="text-white">WhatsApp</CardTitle>
          </div>
        </CardHeader>
      ),
      body: (
        <CardContent className="bg-[#1f2937] rounded-b-lg">
          <p className="text-gray-300 mb-4">Gerencie integrações e campanhas de WhatsApp</p>
          <div className="space-y-2">
            <div className="flex justify-between"><span className="text-sm text-gray-400">Campanhas Ativas:</span><span className="text-sm font-semibold text-white">8</span></div>
            <div className="flex justify-between"><span className="text-sm text-gray-400">Mensagens este mês:</span><span className="text-sm font-semibold text-green-400">+1.200</span></div>
          </div>
        </CardContent>
      ),
      onClick: () => handlePageChange("whatsapp")
    }
      ]
    },
    'analises': {
      id: 'analises',
      title: 'Analises',
      color: 'bg-yellow-600',
      cards: [
        {
          id: 'analises-card',
          content: (
            <CardHeader className="bg-gradient-to-r from-yellow-600 to-yellow-400 rounded-t-lg">
              <div className="flex items-center space-x-2">
                <BarChart3 className="w-6 h-6 text-yellow-100" />
                <CardTitle className="text-white">Analises</CardTitle>
              </div>
            </CardHeader>
          ),
          body: (
            <CardContent className="bg-[#1f2937] rounded-b-lg">
              <p className="text-gray-300 mb-4">Visualize relatórios e análises detalhadas</p>
              <div className="space-y-2">
                <div className="flex justify-between"><span className="text-sm text-gray-400">Relatórios:</span><span className="text-sm font-semibold text-white">15</span></div>
                <div className="flex justify-between"><span className="text-sm text-gray-400">Atualizados este mês:</span><span className="text-sm font-semibold text-green-400">+3</span></div>
              </div>
            </CardContent>
          ),
          onClick: () => handlePageChange("analytics")
    }
      ]
    }
  });

  // Legacy kanban cards for backward compatibility
  const initialKanbanCards = Object.values(kanbanColumns).flatMap(column => column.cards);
  const [kanbanCards, setKanbanCards] = useState(initialKanbanCards);

  // Atualizar o card de clientes quando a quantidade mudar
  useEffect(() => {
    setKanbanColumns(prevColumns => {
      const updatedColumns = { ...prevColumns };
      const servicosColumn = updatedColumns['servicos'];
      if (servicosColumn) {
        const clientesCardIndex = servicosColumn.cards.findIndex(card => card.id === 'clientes');
        if (clientesCardIndex !== -1) {
          const updatedCards = [...servicosColumn.cards];
          updatedCards[clientesCardIndex] = {
            ...updatedCards[clientesCardIndex],
            body: (
              <CardContent className="bg-[#1f2937] rounded-b-lg">
                <p className="text-gray-300 mb-4">Gerencie todos os seus clientes cadastrados</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Total de Clientes:</span><span className="text-sm font-semibold text-white">{(clientes?.length || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Clientes Ativos:</span><span className="text-sm font-semibold text-white">{stats.activeClients.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Novos este mês:</span><span className="text-sm font-semibold text-green-400">+{stats.monthlyGrowth}%</span></div>
                </div>
              </CardContent>
            )
          };
          updatedColumns['servicos'] = {
            ...servicosColumn,
            cards: updatedCards
          };
        }
      }
      return updatedColumns;
    });
  }, [clientes, stats.activeClients, stats.monthlyGrowth]);

  // Atualizar o card de revendas quando a quantidade mudar
  useEffect(() => {
    setKanbanColumns(prevColumns => {
      const updatedColumns = { ...prevColumns };
      const servicosColumn = updatedColumns['servicos'];
      if (servicosColumn) {
        const revendasCardIndex = servicosColumn.cards.findIndex(card => card.id === 'revendas');
        if (revendasCardIndex !== -1) {
          const updatedCards = [...servicosColumn.cards];
          updatedCards[revendasCardIndex] = {
            ...updatedCards[revendasCardIndex],
            body: (
              <CardContent className="bg-[#1f2937] rounded-b-lg">
                <p className="text-gray-300 mb-4">Gerencie suas revendas e parceiros</p>
                <div className="space-y-2">
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Revendedores Ativos:</span><span className="text-sm font-semibold text-white">{stats.activeResellers}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Total de Revendas:</span><span className="text-sm font-semibold text-white">{(revendas?.length || 0).toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-sm text-gray-400">Novos este mês:</span><span className="text-sm font-semibold text-green-400">+8</span></div>
                </div>
              </CardContent>
            )
          };
          updatedColumns['servicos'] = {
            ...servicosColumn,
            cards: updatedCards
          };
        }
      }
      return updatedColumns;
    });
  }, [revendas, stats.activeResellers]);

  // Componente SortableCard
  function SortableCard({ id, content, body, onClick }: any) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 50 : 1,
      opacity: isDragging ? 0.8 : 1,
      cursor: isDragging ? 'grabbing' : 'grab',
    };
    
    const handleClick = (e: React.MouseEvent) => {
      // Prevenir clique durante o drag
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      
      // Adicionar log para debug
      console.log('Card clicked:', id, 'isDragging:', isDragging);
      
      if (onClick) {
        onClick();
        // Mostrar toast de confirmação
        toast.success(`Abrindo ${id}...`, {
          description: `Modal aberto com sucesso`,
          duration: 1500,
        });
      }
    };
    
    return (
      <div 
        ref={setNodeRef} 
        style={style} 
        {...attributes} 
        className="select-none touch-manipulation"
        data-card-id={id}
      >
        <Card 
          className={`cursor-grab active:cursor-grabbing hover:shadow-glow hover:scale-105 transition-all duration-300 transform relative group ${
            isDragging ? 'shadow-2xl scale-110 rotate-2 z-50' : ''
          }`} 
          onClick={handleClick} 
          onMouseDown={(e) => {
            // Aplicar listeners de drag apenas no mouse down
            if (listeners.onMouseDown) {
              listeners.onMouseDown(e);
            }
          }}
          onTouchStart={(e) => {
            // Aplicar listeners de touch apenas no touch start
            if (listeners.onTouchStart) {
              listeners.onTouchStart(e);
            }
          }}
          tabIndex={0} 
          role="button" 
          aria-pressed="false"
          style={{
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
        >
          {content}
          {body}
          {/* Drag indicator */}
          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-6 h-6 bg-gray-600/80 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 6h8v2H8V6zm0 5h8v2H8v-2zm0 5h8v2H8v-2z"/>
              </svg>
            </div>
          </div>
          
          {/* Click indicator */}
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <div className="w-6 h-6 bg-blue-600/80 rounded-full flex items-center justify-center backdrop-blur-sm">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
          </div>
          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-blue-500/20 rounded-lg border-2 border-blue-500 border-dashed pointer-events-none"></div>
          )}
          {/* Hover effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 to-purple-500/0 hover:from-blue-500/10 hover:to-purple-500/10 rounded-lg transition-all duration-300 pointer-events-none"></div>
          
          {/* Click effect */}
          <div className="absolute inset-0 bg-blue-500/0 hover:bg-blue-500/5 rounded-lg transition-all duration-200 pointer-events-none"></div>
          
          {/* Border highlight on hover */}
          <div className="absolute inset-0 border-2 border-transparent hover:border-blue-500/30 rounded-lg transition-all duration-300 pointer-events-none"></div>
        </Card>
      </div>
    );
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (!active || !over) return;
    
    const activeId = active.id;
    const overId = over.id;
    
    console.log('Drag ended:', { activeId, overId }); // Debug log
    
    // Se o card foi solto sobre outro card ou área vazia
    if (activeId !== overId) {
      setKanbanColumns(prevColumns => {
        const newColumns = { ...prevColumns };
        
        // Encontrar a coluna de origem
        let sourceColumnId = null;
        let sourceCardIndex = -1;
        
        Object.keys(newColumns).forEach(columnId => {
          const cardIndex = newColumns[columnId].cards.findIndex(card => card.id === activeId);
          if (cardIndex !== -1) {
            sourceColumnId = columnId;
            sourceCardIndex = cardIndex;
          }
        });
        
        if (!sourceColumnId) {
          console.log('Source column not found for card:', activeId);
          return newColumns;
        }
        
        const cardToMove = newColumns[sourceColumnId].cards[sourceCardIndex];
        console.log('Moving card:', cardToMove.id, 'from column:', sourceColumnId);
        
        // Remover da coluna de origem
        newColumns[sourceColumnId].cards.splice(sourceCardIndex, 1);
        
        // Verificar se foi solto sobre outro card
        let targetColumnId = null;
        let targetCardIndex = -1;
        
        Object.keys(newColumns).forEach(columnId => {
          const cardIndex = newColumns[columnId].cards.findIndex(card => card.id === overId);
          if (cardIndex !== -1) {
            targetColumnId = columnId;
            targetCardIndex = cardIndex;
          }
        });
        
        if (targetColumnId) {
          // Solto sobre outro card
          console.log('Dropped on card in column:', targetColumnId, 'at position:', targetCardIndex);
          if (sourceColumnId === targetColumnId) {
            // Mesma coluna, reordenar
            newColumns[targetColumnId].cards.splice(targetCardIndex, 0, cardToMove);
          } else {
            // Colunas diferentes, adicionar na posição do card de destino
            newColumns[targetColumnId].cards.splice(targetCardIndex, 0, cardToMove);
          }
        } else {
          // Solto em área vazia - tentar encontrar a coluna pelo data-column-id
          const columnElement = over.data?.current?.columnId || over.id;
          console.log('Dropped in empty area, trying column:', columnElement);
          
          if (columnElement && newColumns[columnElement]) {
            // Adicionar no final da coluna
            newColumns[columnElement].cards.push(cardToMove);
            console.log('Added to column:', columnElement);
          } else {
            // Se não encontrou a coluna, adicionar de volta na origem
            newColumns[sourceColumnId].cards.splice(sourceCardIndex, 0, cardToMove);
            console.log('Column not found, returning to source');
          }
        }
        
        toast.success(`Card movido com sucesso!`, {
          description: `Card reorganizado no sistema Kanban`,
          duration: 2000,
        });
        
        return newColumns;
      });
    }
  };

  // Polling para atualização automática
  useEffect(() => {
    const interval = setInterval(() => {
      refreshUsers();
      if (refreshResellers) refreshResellers();
    }, 30000); // 30 segundos (aumentado para reduzir carga)
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Não depender de refreshUsers/refreshResellers para evitar loops

  // Forçar atualização quando refreshTrigger muda (com debounce)
  const lastRefreshTriggerRef = useRef(0);
  useEffect(() => {
    if (refreshTrigger > 0 && refreshTrigger !== lastRefreshTriggerRef.current) {
      lastRefreshTriggerRef.current = refreshTrigger;
      console.log('🔄 Forçando atualização dos dados...');
      refreshUsers();
      if (refreshResellers) refreshResellers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // Apenas depender de refreshTrigger

  // Listener para atualização instantânea
  useEffect(() => {
    const handleRefresh = (event: CustomEvent) => {
      console.log('🔄 Dashboard: Evento refresh-dashboard recebido, atualizando dados...');
      
      // Atualizar dados baseado na fonte sem disparar refreshTrigger novamente
      if (event.detail?.source === 'users' || !event.detail?.source) {
        console.log('🔄 Atualizando dados de usuários...');
        refreshUsers();
        // Forçar atualização das estatísticas do dashboard (receita total)
        if (refreshStats) {
          console.log('🔄 Atualizando estatísticas do dashboard (receita)...');
          refreshStats();
        }
      }
      if (event.detail?.source === 'resellers' || !event.detail?.source) {
        console.log('🔄 Atualizando dados de revendedores...');
        if (refreshResellers) refreshResellers();
        // Forçar atualização das estatísticas do dashboard
        if (refreshStats) {
          console.log('🔄 Atualizando estatísticas do dashboard (receita)...');
          refreshStats();
        }
      }
      
      // Apenas atualiza o trigger se realmente necessário
      if (!event.detail?.source || event.detail?.forceRefresh) {
        setRefreshTrigger(prev => prev + 1);
      }
    };
    window.addEventListener('refresh-dashboard', handleRefresh as EventListener);
    return () => window.removeEventListener('refresh-dashboard', handleRefresh as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Não depender de refreshUsers/refreshResellers para evitar loops

  // Listener para localStorage (comunicação entre páginas)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh') {
        console.log('🔄 Dashboard: localStorage change detectado, atualizando dados...');
        // Chama diretamente sem atualizar o trigger para evitar loops
        refreshUsers();
        if (refreshResellers) refreshResellers();
        // Forçar atualização das estatísticas do dashboard (receita total)
        if (refreshStats) {
          console.log('🔄 Atualizando estatísticas do dashboard (receita)...');
          refreshStats();
        }
      }
    };
    
    const checkForRefresh = () => {
      const refreshFlag = localStorage.getItem('dashboard-refresh');
      if (refreshFlag) {
        console.log('🔄 Dashboard: Flag de refresh encontrada, atualizando dados...');
        localStorage.removeItem('dashboard-refresh');
        // Chama diretamente sem atualizar o trigger para evitar loops
        refreshUsers();
        if (refreshResellers) refreshResellers();
        // Forçar atualização das estatísticas do dashboard (receita total)
        if (refreshStats) {
          console.log('🔄 Atualizando estatísticas do dashboard (receita)...');
          refreshStats();
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    checkForRefresh(); // Verificar ao montar o componente
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Não depender de refreshUsers/refreshResellers para evitar loops

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#09090b]">
        <ClientSidebar onPageChange={setCurrentPage} currentPage={currentPage} />
        
        <main className="flex-1 p-6 max-w-full w-full overflow-x-auto">
          <div className="max-w-7xl mx-auto space-y-6">
            {currentPage === "dashboard" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-center sm:text-left">
                    <h1 className="text-2xl sm:text-3xl font-bold text-white">Dashboard Cliente</h1>
                    <p className="text-gray-400 text-sm sm:text-base">Visão geral do sistema</p>
                  </div>
                  <div className="flex flex-row items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
                    <ThemeToggle />
                    <Dialog open={clientModal} onOpenChange={setClientModal}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white h-10 sm:h-auto flex-1 sm:flex-initial">
                          <UserPlus className="w-4 h-4 sm:mr-2" />
                          <span className="hidden sm:inline">Novo Cliente</span>
                          <span className="sm:hidden">Cliente</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-[#1f2937] text-white max-w-4xl w-full p-0 rounded-xl shadow-xl border border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Adicionar um Cliente</DialogTitle>
                          <DialogDescription>Preencha os dados do novo cliente</DialogDescription>
                        </DialogHeader>
                        <div className="p-6 w-full flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Adicionar um Cliente</h2>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-400 hover:text-white"
                                onClick={() => setClientModal(false)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          
                          <form onSubmit={async (e) => { 
                            e.preventDefault(); 
                            e.stopPropagation();
                            console.log("🔵 [ClientDashboard] Form submit disparado!");
                            await handleAddUser(); 
                          }} className="space-y-6 flex-1 overflow-y-auto">
                            <div className="flex items-center gap-2 mb-4">
                              <span className="text-green-400 text-xs font-medium">• Campos obrigatórios marcados com *</span>
                              <span className="text-blue-400 text-xs font-medium">• Dados serão sincronizados automaticamente</span>
                            </div>
                            
                            {/* Extração M3U */}
                            <div className="bg-blue-900/30 border border-blue-800 rounded-lg p-4 mb-6">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-blue-300 font-medium">Extração M3U</span>
                                <div className="flex gap-2">
                                  <Button type="button" className="bg-blue-600 text-white hover:bg-blue-700 px-4 py-1 rounded text-sm" onClick={extractM3UData} disabled={isExtracting}>Extrair</Button>
                                </div>
                              </div>
                              <p className="text-xs text-blue-300 mb-2">Serve para importar dados automaticamente a partir de uma URL.</p>
                              <Input placeholder="Insira a URL do M3U para extrair automaticamente os dados do cliente..." className="bg-[#1f2937] border border-blue-800 text-white mb-2" value={m3uUrl} onChange={e => setM3uUrl(e.target.value)} />
                              {extractionError && (
                                <div className="bg-red-900/40 border border-red-700 text-red-300 text-xs rounded p-2 mb-2">❌ {extractionError}</div>
                              )}
                              {extractionResult && !extractionError && (
                                <div className="bg-green-900/40 border border-green-700 text-green-300 text-xs rounded p-2 mb-2">✅ {extractionResult.message}</div>
                              )}
                            </div>
                            
                            {/* Informações Básicas */}
                            <div className="bg-[#23272f] border border-gray-700 rounded-lg p-4 mb-6">
                              <span className="block text-white font-semibold mb-4">Informações Básicas</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Servidor */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Servidor *
                                  </label>
                                  <Input
                                    type="text"
                                    value={newUser.server || ""}
                                    onChange={(e) => setNewUser({ ...newUser, server: e.target.value })}
                                    placeholder="Digite o nome do servidor"
                                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                                  />
                                </div>
                                {/* Plano */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Plano *
                                  </label>
                                  <select
                                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                                    value={newUser.plan}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, plan: e.target.value, price: "" })
                                    }
                                    title="Selecionar plano de cobrança"
                                  >
                                    <option value="">Selecione um plano</option>
                                    <option value="Mensal">Mensal</option>
                                    <option value="Bimestral">Bimestral</option>
                                    <option value="Trimestral">Trimestral</option>
                                    <option value="Semestral">Semestral</option>
                                    <option value="Anual">Anual</option>
                                  </select>
                                </div>
                                {/* Preço */}
                                {newUser.plan && (
                                  <div className="col-span-1">
                                    <label className="block text-gray-300 mb-1 font-medium">
                                      Preço *
                                    </label>
                                    <select
                                      className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                                      value={newUser.price}
                                      onChange={(e) =>
                                        setNewUser({ ...newUser, price: e.target.value })
                                      }
                                      title="Selecionar preço do plano"
                                    >
                                      <option value="">Selecione um preço</option>
                                      {getPlanPrices(newUser.plan).map((price) => (
                                        <option key={price} value={price}>
                                          R$ {price}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                )}
                                {/* Nome */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Nome *
                                  </label>
                                  <Input
                                    placeholder="Nome completo do cliente"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.name}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, name: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Email */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Email *
                                  </label>
                                  <Input
                                    placeholder="email@exemplo.com"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.email}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, email: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Status */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Status *
                                  </label>
                                  <select
                                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                                    value={newUser.status}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, status: e.target.value })
                                    }
                                    title="Selecionar status do usuário"
                                  >
                                    <option value="Ativo">Ativo</option>
                                    <option value="Inativo">Inativo</option>
                                    <option value="Suspenso">Suspenso</option>
                                    <option value="Pendente">Pendente</option>
                                  </select>
                                </div>
                                {/* Data de Expiração */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Data de Expiração *
                                  </label>
                                  <Input
                                    type="date"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.expirationDate}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, expirationDate: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Configuração de Serviço */}
                            <div className="bg-[#23272f] border border-gray-700 rounded-lg p-4 mb-6">
                              <span className="block text-white font-semibold mb-4">Configuração de Serviço</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Dispositivos */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Dispositivos
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.devices}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, devices: parseInt(e.target.value) || 0 })
                                    }
                                  />
                                </div>
                                {/* Créditos */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Créditos
                                  </label>
                                  <Input
                                    type="number"
                                    placeholder="0"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.credits}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, credits: parseInt(e.target.value) || 0 })
                                    }
                                  />
                                </div>
                                {/* Senha */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Senha
                                  </label>
                                  <Input
                                    placeholder="Senha do cliente"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.password}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, password: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Bouquets */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Bouquets
                                  </label>
                                  <Input
                                    placeholder="Bouquets disponíveis"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.bouquets}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, bouquets: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Informações Adicionais */}
                            <div className="hidden md:block bg-[#23272f] border border-gray-700 rounded-lg p-4 mb-6">
                              <span className="block text-white font-semibold mb-4">Informações Adicionais</span>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Nome Real */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Nome Real
                                  </label>
                                  <Input
                                    placeholder="Nome real do cliente"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.realName}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, realName: e.target.value })
                                    }
                                  />
                                </div>
                                {/* WhatsApp */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    WhatsApp
                                  </label>
                                  <Input
                                    placeholder="+55 (11) 99999-9999"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.whatsapp}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, whatsapp: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Telegram */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Telegram
                                  </label>
                                  <Input
                                    placeholder="@username"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.telegram}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, telegram: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Observações */}
                                <div className="col-span-1">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Observações
                                  </label>
                                  <Input
                                    placeholder="Observações sobre o cliente"
                                    className="bg-[#23272f] border border-gray-700 text-white"
                                    value={newUser.observations}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, observations: e.target.value })
                                    }
                                  />
                                </div>
                                {/* Notas */}
                                <div className="col-span-2">
                                  <label className="block text-gray-300 mb-1 font-medium">
                                    Notas
                                  </label>
                                  <textarea
                                    placeholder="Notas adicionais sobre o cliente..."
                                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2 min-h-[80px] resize-none"
                                    value={newUser.notes}
                                    onChange={(e) =>
                                      setNewUser({ ...newUser, notes: e.target.value })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                            
                            {/* Botões de Ação */}
                            <div className="flex justify-end gap-3 pt-4 border-t border-gray-700">
                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => setClientModal(false)}
                                className="border-gray-600 text-gray-300 hover:bg-gray-700"
                              >
                                Cancelar
                              </Button>
                              <Button
                                type="submit"
                                disabled={isAddingUser}
                                className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white"
                              >
                                {isAddingUser ? "Adicionando..." : "Adicionar Cliente"}
                              </Button>
                            </div>
                          </form>
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Dialog open={resellerModal} onOpenChange={setResellerModal}>
                      <DialogContent className="bg-[#1f2937] text-white max-w-4xl w-full p-0 rounded-xl shadow-xl border border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
                        <DialogHeader className="sr-only">
                          <DialogTitle>Adicionar um Revenda</DialogTitle>
                          <DialogDescription>Preencha os dados do novo revendedor</DialogDescription>
                        </DialogHeader>
                        <div className="p-6 w-full flex flex-col">
                          <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Adicionar um Revenda</h2>
                            <div className="flex items-center gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-gray-400 hover:text-white"
                                onClick={() => setResellerModal(false)}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </Button>
                            </div>
                          </div>
                          
                          {/* Usar componente ClientResellers dentro do modal */}
                          <div className="flex-1 overflow-y-auto">
                            <ClientResellersWrapper 
                              onResellerCreated={() => {
                                console.log('🔄 [ClientDashboard] Revendedor criado, preparando navegação...');
                                // Garantir que a flag esteja definida antes de navegar
                                try {
                                  localStorage.setItem('reseller-created', Date.now().toString());
                                  localStorage.setItem('dashboard-refresh', Date.now().toString());
                                  console.log('✅ [ClientDashboard] Flags definidas no localStorage');
                                } catch (error) {
                                  console.error('❌ [ClientDashboard] Erro ao definir flags:', error);
                                }
                                
                                // Fechar modal após criar revendedor com sucesso
                                setTimeout(() => {
                                  setResellerModal(false);
                                  // Atualizar stats do dashboard
                                  if (refreshStats) {
                                    refreshStats();
                                  }
                                  // Navegar para a página de Gerenciamento de Revendedores
                                  // A página ClientResellers irá buscar os dados atualizados automaticamente
                                  console.log('🔄 [ClientDashboard] Navegando para página de revendedores...');
                                  setCurrentPage("resellers");
                                  console.log('✅ [ClientDashboard] Navegação concluída - ClientResellers irá buscar dados atualizados');
                                }, 800);
                              }}
                              onCloseModal={() => {
                                setResellerModal(false);
                              }}
                            />
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 my-4 sm:my-6">
                  {/* Card 1: Total Clientes */}
                  <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Total Clientes</CardTitle>
                      <Users className="h-3 w-3 sm:h-4 sm:w-4 text-purple-400" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="text-lg sm:text-2xl font-bold text-white">{(clientes?.length || 0).toLocaleString()}</div>
                      <p className="text-xs text-gray-400 mt-1">Clientes cadastrados</p>
                    </CardContent>
                  </Card>
                  {/* Card 2: Total Revendas */}
                  <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Total Revendas</CardTitle>
                      <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-400" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="text-lg sm:text-2xl font-bold text-white">{(revendas?.length || 0).toLocaleString()}</div>
                      <p className="text-xs text-gray-400 mt-1">Revendedores cadastrados</p>
                    </CardContent>
                  </Card>
                  {/* Card 3: Expiram em 3 dias */}
                  <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700/40 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Expiram em 3 dias</CardTitle>
                      <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-400" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="text-lg sm:text-2xl font-bold text-white">{clientesExpiramEm3Dias.toLocaleString()}</div>
                      <p className="text-xs text-gray-400 mt-1">Clientes próximos do vencimento</p>
                    </CardContent>
                  </Card>
                  {/* Card 4: Receita Total */}
                  <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40 text-white">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Receita Total</CardTitle>
                      <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-green-400" />
                    </CardHeader>
                    <CardContent className="p-3 sm:p-6">
                      <div className="text-lg sm:text-2xl font-bold text-white">
                        R$ {formatCurrency(stats.totalRevenue)}
                      </div>
                      <p className="text-xs text-gray-400 mt-1">Receita acumulada (clientes + revendas)</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Cards Section */}
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-white">
                        {viewMode === 'kanban' ? 'Sistema Kanban' : 'Serviços do Sistema'}
                      </h2>
                      <p className="text-gray-400 text-sm sm:text-base">
                        {viewMode === 'kanban' 
                          ? 'Organize seus serviços por categoria' 
                          : 'Acesse todos os serviços do sistema'
                        }
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                      <Button
                        variant={viewMode === 'grid' ? 'default' : 'outline'}
                        onClick={() => setViewMode('grid')}
                        className="bg-[#1f2937] text-white border border-gray-700 hover:bg-[#23272f] h-10 sm:h-auto"
                      >
                        <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        <span className="hidden sm:inline">Grid</span>
                      </Button>
                      <Button
                        variant={viewMode === 'kanban' ? 'default' : 'outline'}
                        onClick={() => setViewMode('kanban')}
                        className="bg-[#1f2937] text-white border border-gray-700 hover:bg-[#23272f] h-10 sm:h-auto"
                      >
                        <svg className="w-4 h-4 sm:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <span className="hidden sm:inline">Kanban</span>
                      </Button>
                      {viewMode === 'kanban' && (
                        <>
                          <Badge className="bg-blue-600 text-white flex items-center gap-1 animate-pulse text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                            <span className="hidden sm:inline">Arraste para reorganizar</span>
                            <span className="sm:hidden">Arrastar</span>
                          </Badge>
                          <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            <span className="hidden sm:inline">Clique para abrir modal</span>
                            <span className="sm:hidden">Clique</span>
                          </Badge>
                          <Badge className="bg-purple-600 text-white flex items-center gap-1 text-xs">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span className="hidden sm:inline">Modais Funcionais</span>
                            <span className="sm:hidden">Modais</span>
                          </Badge>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {viewMode === 'kanban' ? (
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={Object.values(kanbanColumns).flatMap(column => column.cards).map(card => card.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                          {Object.values(kanbanColumns).map(column => (
                            <div key={column.id} className="space-y-4">
                              {/* Column Header */}
                              <div className={`${column.color} rounded-lg p-4 text-white shadow-lg`}>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-semibold text-lg">{column.title}</h3>
                                    <div className="w-2 h-2 bg-white rounded-full"></div>
                                  </div>
                                  <Badge className="bg-white/20 text-white font-medium">{column.cards.length}</Badge>
                                </div>
                              </div>
                              
                              {/* Column Cards */}
                              <div 
                                className="space-y-4 min-h-[200px] bg-[#1f2937]/50 rounded-lg p-4 border border-gray-700 transition-all duration-200 hover:border-gray-600"
                                data-column-id={column.id}
                                data-droppable="true"
                              >
                                {column.cards.map(card => (
                                  <SortableCard 
                                    key={card.id} 
                                    id={card.id} 
                                    content={card.content} 
                                    body={card.body} 
                                    onClick={card.onClick} 
                                  />
                                ))}
                                {column.cards.length === 0 && (
                                  <div 
                                    className="flex items-center justify-center h-32 text-gray-500 border-2 border-dashed border-gray-600 rounded-lg transition-all duration-200 hover:border-blue-500 hover:text-blue-400 group"
                                    data-droppable="true"
                                    data-column-id={column.id}
                                  >
                                    <div className="text-center">
                                      <svg className="w-8 h-8 mx-auto mb-2 text-gray-600 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                                      </svg>
                                      <p className="text-sm group-hover:text-blue-400 transition-colors">Solte um card aqui</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  ) : (
                    /* Layout Grid Original */
                    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                      <SortableContext items={Object.values(kanbanColumns).flatMap(column => column.cards).map(card => card.id)} strategy={rectSortingStrategy}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                          {Object.values(kanbanColumns).flatMap(column => column.cards).map(card => (
                            <SortableCard 
                              key={card.id} 
                              id={card.id} 
                              content={card.content} 
                              body={card.body} 
                              onClick={card.onClick} 
                            />
                          ))}
                        </div>
                      </SortableContext>
                    </DndContext>
                  )}
                </div>
              </>
            )}
            {/* Renderização das outras páginas continua igual */}
            {currentPage === "clients" && <ClientClients />}
            {currentPage === "resellers" && <ClientResellers />}
            {currentPage === "billing" && <ClientBilling />}
            {currentPage === "notifications" && <ClientNotifications />}
            {currentPage === "whatsapp" && <ClientWhatsApp />}
            {currentPage === "gateways" && <ClientGateways />}
            {currentPage === "branding" && <ClientBranding />}
            {currentPage === "shop" && <ClientShop />}
            {currentPage === "ai" && <ClientAI />}
            {currentPage === "games" && <ClientGames />}
            {currentPage === "analytics" && <ClientAnalytics />}
            {currentPage === "settings" && <ClientSettings />}
            {currentPage === "profile" && <ClientProfile />}
          </div>
        </main>

        {/* Modals */}
        <AIModalManager 
          activeModal={activeModal} 
          onClose={handleModalClose} 
          onAddReseller={handleAddReseller}
        />

        {/* Modal Customizar Marca */}
        <Dialog open={brandingModal} onOpenChange={setBrandingModal}>
          <DialogContent className="max-w-4xl bg-[#232a36] border border-purple-700 text-white p-0">
            <div className="overflow-y-auto max-h-[80vh]">
              <ClientBranding />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
};

export default ClientDashboard;