import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Calendar, Plus, Search, Filter, Edit, Trash2, Eye, Copy, Mail, MessageSquare, BarChart3, Users, TrendingUp, DollarSign, AlertCircle, CheckCircle, Clock, Download, Upload, Zap, CreditCard, Receipt, Bell, Settings } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import type { Cliente } from '@/hooks/useClientes';
import { useRevendas } from '@/hooks/useRevendas';
import type { Revenda } from '@/hooks/useRevendas';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import React from "react";
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useCobrancas } from '@/hooks/useCobrancas';
import { RLSErrorBannerCobrancas } from '@/components/RLSErrorBannerCobrancas';

interface Cobranca {
  id: number;
  cliente: string;
  email: string;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'Pendente' | 'Vencida' | 'Paga' | 'Cancelada';
  tipo: 'Cliente' | 'Revenda';
  gateway?: string;
  formaPagamento?: string;
  tentativas?: number;
  ultimaTentativa?: string;
  proximaTentativa?: string;
  observacoes?: string;
  tags?: string[];
  originalId?: number; // ID original do cliente/revenda
  originalType?: 'cliente' | 'revenda'; // Tipo original
}

interface GatewayConfig {
  id: string;
  nome: string;
  tipo: 'PIX' | 'Cartão' | 'Boleto';
  status: 'Ativo' | 'Inativo';
  taxa: string;
  limite: string;
  configurado: boolean;
}

// Gerar cobranças baseadas nos clientes
const generateCobrancasFromClientes = (clientes: Cliente[]): Cobranca[] => {
  return clientes.map((cliente, index) => {
    const statuses: ('Pendente' | 'Vencida' | 'Paga')[] = ['Pendente', 'Vencida', 'Paga'];
    const descricoes = [
      'Renovação Básico - Plano Mensal',
      'Cobrança Básico - Mensal',
      'Serviço Básico - Renovação',
      'Manutenção Básico - Mensal',
      'Upgrade Mensal - Básico',
      'Cobrança Básico - Anual'
    ];
    
    // Gerar data de vencimento baseada no índice
    const hoje = new Date();
    const vencimento = new Date(hoje);
    vencimento.setDate(hoje.getDate() + (index * 7) + Math.floor(Math.random() * 30));
    
    // Se o cliente estiver marcado como pago, a cobrança deve ser "Paga"
    // Caso contrário, usa o status padrão baseado no índice
    const statusCobranca = cliente.pago ? 'Paga' : statuses[index % statuses.length];
    
    return {
      id: cliente.id,
      cliente: cliente.name,
      email: cliente.email,
      descricao: descricoes[index % descricoes.length],
      valor: Math.floor(Math.random() * 50) + 90, // Valor entre 90 e 140
      vencimento: vencimento.toLocaleDateString('pt-BR'),
      status: statusCobranca,
      tipo: 'Cliente',
      gateway: ['PIX', 'Stripe', 'Mercado Pago'][index % 3],
      formaPagamento: ['PIX', 'Cartão de Crédito', 'Cartão de Débito'][index % 3],
      tentativas: Math.floor(Math.random() * 3),
      ultimaTentativa: new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleDateString('pt-BR'),
      proximaTentativa: new Date(Date.now() + Math.random() * 86400000 * 3).toLocaleDateString('pt-BR'),
      observacoes: index % 2 === 0 ? 'Cliente preferencial' : '',
      tags: index % 3 === 0 ? ['Urgente', 'VIP'] : index % 3 === 1 ? ['Recorrente'] : [],
      originalId: cliente.id,
      originalType: 'cliente'
    };
  });
};

// Gerar cobranças baseadas nas revendas
const generateCobrancasFromRevendas = (revendas: Revenda[]): Cobranca[] => {
  return revendas.map((revenda, index) => ({
    id: 10000 + revenda.id, // evitar conflito de id
    cliente: revenda.personal_name || revenda.username,
    email: revenda.email || '',
    descricao: 'Cobrança Revenda - Mensal',
    valor: Math.floor(Math.random() * 80) + 120, // Valor entre 120 e 200
    vencimento: new Date(Date.now() + (index * 5 + 3) * 86400000).toLocaleDateString('pt-BR'),
    status: ['Pendente', 'Vencida', 'Paga'][index % 3] as 'Pendente' | 'Vencida' | 'Paga',
    tipo: 'Revenda',
    gateway: ['PIX', 'Stripe', 'Mercado Pago'][index % 3],
    formaPagamento: ['PIX', 'Cartão de Crédito', 'Cartão de Débito'][index % 3],
    tentativas: Math.floor(Math.random() * 3),
    ultimaTentativa: new Date(Date.now() - Math.random() * 86400000 * 7).toLocaleDateString('pt-BR'),
    proximaTentativa: new Date(Date.now() + Math.random() * 86400000 * 3).toLocaleDateString('pt-BR'),
    observacoes: index % 2 === 0 ? 'Revenda preferencial' : '',
    tags: index % 3 === 0 ? ['Urgente', 'VIP'] : index % 3 === 1 ? ['Recorrente'] : [],
    originalId: revenda.id,
    originalType: 'revenda'
  }));
};

export default function AdminCobrancas() {
  const { clientes } = useClientes();
  const { revendas } = useRevendas();
  const [activeTab, setActiveTab] = useState('cobrancas');
  
  // Estado para cobranças virtuais (baseadas em clientes e revendas)
  const [cobrancasVirtuais, setCobrancasVirtuais] = useState<Cobranca[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Gateways configurados
  const [gateways] = useState<GatewayConfig[]>([
    { id: 'pix', nome: 'PIX', tipo: 'PIX', status: 'Ativo', taxa: '0.99%', limite: 'R$ 10.000', configurado: true },
    { id: 'stripe', nome: 'Stripe', tipo: 'Cartão', status: 'Ativo', taxa: '2.99% + R$ 0,30', limite: 'R$ 50.000', configurado: true },
    { id: 'mercadopago', nome: 'Mercado Pago', tipo: 'Cartão', status: 'Ativo', taxa: '1.99% + R$ 0,60', limite: 'R$ 25.000', configurado: true },
    { id: 'boleto', nome: 'Boleto', tipo: 'Boleto', status: 'Inativo', taxa: '1.99% + R$ 2,00', limite: 'R$ 5.000', configurado: false },
  ]);

  // Gerar cobranças virtuais baseadas em clientes e revendas
  useEffect(() => {
    setLoading(true);
    try {
      const cobrancasClientes = generateCobrancasFromClientes(clientes);
      const cobrancasRevendas = generateCobrancasFromRevendas(revendas);
      const todasCobrancas = [...cobrancasClientes, ...cobrancasRevendas];
      setCobrancasVirtuais(todasCobrancas);
      setError(null);
    } catch (err) {
      setError('Erro ao gerar cobranças virtuais');
      console.error('Erro ao gerar cobranças:', err);
    } finally {
      setLoading(false);
    }
  }, [clientes, revendas]);

  // Funções para manipular cobranças virtuais
  const addCobranca = (cobranca: Omit<Cobranca, 'id'>) => {
    const novaCobranca: Cobranca = {
      ...cobranca,
      id: Math.max(...cobrancasVirtuais.map(c => c.id)) + 1
    };
    setCobrancasVirtuais(prev => [...prev, novaCobranca]);
    toast.success('Cobrança adicionada com sucesso!');
    return true;
  };

  const updateCobranca = (id: number, updates: Partial<Cobranca>) => {
    setCobrancasVirtuais(prev => 
      prev.map(c => c.id === id ? { ...c, ...updates } : c)
    );
    toast.success('Cobrança atualizada com sucesso!');
    return true;
  };

  const deleteCobranca = (id: number) => {
    setCobrancasVirtuais(prev => prev.filter(c => c.id !== id));
    toast.success('Cobrança excluída com sucesso!');
    return true;
  };

  const clearError = () => setError(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<string | null>(null);
  const [modalNova, setModalNova] = useState(false);
  const [modalVisualizar, setModalVisualizar] = useState<Cobranca | null>(null);
  const [modalEditar, setModalEditar] = useState<Cobranca | null>(null);
  const [modalExcluir, setModalExcluir] = useState<Cobranca | null>(null);
  const [modalCopia, setModalCopia] = useState<Cobranca | null>(null);
  const [modalEmail, setModalEmail] = useState<Cobranca | null>(null);
  const [modalWhats, setModalWhats] = useState<Cobranca | null>(null);
  const [modalRelatorio, setModalRelatorio] = useState(false);
  const [modalAutomacao, setModalAutomacao] = useState(false);
  const [nova, setNova] = useState({ 
    cliente: '', 
    nomeCliente: '', 
    email: '', 
    telefone: '', 
    descricao: '', 
    valor: '', 
    status: 'Pendente', 
    vencimento: '', 
    observacoes: '',
    gateway: 'PIX',
    formaPagamento: 'PIX',
    tags: [] as string[]
  });
  const [edit, setEdit] = useState({ 
    cliente: '', 
    nomeCliente: '', 
    email: '', 
    telefone: '', 
    descricao: '', 
    valor: '', 
    status: 'Pendente', 
    vencimento: '', 
    observacoes: '',
    telegram: '',
    whatsapp: '',
    devices: 1,
    credits: 0,
    renewalDate: '',
    notes: ''
  });

  const total = cobrancasVirtuais.length;
  const pagas = cobrancasVirtuais.filter(c => c.status === 'Paga').length;
  const pendentes = cobrancasVirtuais.filter(c => c.status === 'Pendente').length;
  const vencidas = cobrancasVirtuais.filter(c => c.status === 'Vencida').length;
  const receitaMes = 0;

  const vencendo = cobrancasVirtuais.filter(c => c.status === 'Pendente').slice(0,2); // Exemplo

  const filtradas = cobrancasVirtuais.filter(c => {
    const buscaLower = busca.toLowerCase();
    const matchBusca = c.cliente.toLowerCase().includes(buscaLower) || c.email.toLowerCase().includes(buscaLower) || c.descricao.toLowerCase().includes(buscaLower);
    const matchStatus = !filtroStatus || c.status === filtroStatus;
    return matchBusca && matchStatus;
  });

  // Funções auxiliares
  const handleSalvarNova = () => {
    if (!nova.cliente || !nova.nomeCliente || !nova.email || !nova.descricao || !nova.valor || !nova.vencimento) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }
    
    const novaCobranca: Omit<Cobranca, 'id'> = {
      cliente: nova.nomeCliente,
      email: nova.email,
      descricao: nova.descricao,
      valor: Number(nova.valor),
      vencimento: nova.vencimento,
      status: nova.status as 'Pendente' | 'Vencida' | 'Paga',
      tipo: 'Cliente',
      gateway: nova.gateway,
      formaPagamento: nova.formaPagamento,
      observacoes: nova.observacoes,
      tags: nova.tags
    };
    
    addCobranca(novaCobranca);
    setNova({ 
      cliente: '', 
      nomeCliente: '', 
      email: '', 
      telefone: '', 
      descricao: '', 
      valor: '', 
      status: 'Pendente', 
      vencimento: '', 
      observacoes: '',
      gateway: 'PIX',
      formaPagamento: 'PIX',
      tags: []
    });
    setModalNova(false);
  };

  const handleSalvarEdit = () => {
    if (!edit.cliente || !edit.nomeCliente || !edit.email || !edit.descricao || !edit.valor || !edit.vencimento) {
      alert('Preencha todos os campos obrigatórios!');
      return;
    }
    
    updateCobranca(modalEditar!.id, { 
      cliente: edit.nomeCliente,
      email: edit.email,
      descricao: edit.descricao, 
      valor: Number(edit.valor),
      vencimento: edit.vencimento,
      status: edit.status as 'Pendente' | 'Vencida' | 'Paga'
    });
    
    setEdit({ 
      cliente: '', 
      nomeCliente: '', 
      email: '', 
      telefone: '', 
      descricao: '', 
      valor: '', 
      status: 'Pendente', 
      vencimento: '', 
      observacoes: '',
      telegram: '',
      whatsapp: '',
      devices: 1,
      credits: 0,
      renewalDate: '',
      notes: ''
    });
    setModalEditar(null);
  };

  const handleExcluir = () => {
    deleteCobranca(modalExcluir!.id);
    setModalExcluir(null);
  };

  const handleCopiar = (c: Cobranca) => {
    navigator.clipboard.writeText(`Cliente: ${c.cliente}\nEmail: ${c.email}\nDescrição: ${c.descricao}\nValor: R$ ${c.valor.toFixed(2)}\nVencimento: ${c.vencimento}`);
    toast.success('Cobrança copiada para a área de transferência!');
    setModalCopia(null);
  };

  // Funções de modernização
  const handleEnviarNotificacao = (cobranca: Cobranca) => {
    toast.success(`Notificação enviada para ${cobranca.cliente}`);
    setModalWhats(null);
  };

  const handleEnviarEmail = (cobranca: Cobranca) => {
    toast.success(`Email enviado para ${cobranca.email}`);
    setModalEmail(null);
  };

  const handleGerarRelatorio = () => {
    toast.success('Relatório gerado com sucesso!');
    setModalRelatorio(false);
  };

  const handleConfigurarAutomacao = () => {
    toast.success('Automação configurada com sucesso!');
    setModalAutomacao(false);
  };

  const handleTestarGateway = (gatewayId: string) => {
    toast.success(`Gateway ${gatewayId} testado com sucesso!`);
  };

  // Cálculos para dashboard
  const totalCobrancas = cobrancasVirtuais.length;
  const cobrancasPagas = cobrancasVirtuais.filter(c => c.status === 'Paga').length;
  const cobrancasPendentes = cobrancasVirtuais.filter(c => c.status === 'Pendente').length;
  const cobrancasVencidas = cobrancasVirtuais.filter(c => c.status === 'Vencida').length;
  const valorTotal = cobrancasVirtuais.reduce((acc, c) => acc + c.valor, 0);
  const valorRecebido = cobrancasVirtuais.filter(c => c.status === 'Paga').reduce((acc, c) => acc + c.valor, 0);
  const taxaConversao = totalCobrancas > 0 ? (cobrancasPagas / totalCobrancas) * 100 : 0;

  // Funções auxiliares para seleção de clientes/revendas
  const handleClienteChange = (clienteId: string) => {
    // Extrair o ID do valor "cliente-15" -> "15"
    const id = clienteId.replace('cliente-', '');
    const cliente = clientes.find(c => c.id.toString() === id);
    if (cliente) {
      setNova({
        ...nova,
        cliente: clienteId,
        nomeCliente: cliente.name,
        email: cliente.email,
        telefone: cliente.phone || cliente.whatsapp || '',
        descricao: cliente.observations || 'Cobrança Mensal - Cliente',
        valor: cliente.price || '99.90',
        vencimento: cliente.expiration_date ? new Date(cliente.expiration_date).toISOString().split('T')[0] : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  };

  const handleRevendaChange = (revendaId: string) => {
    // Extrair o ID do valor "revenda-15" -> "15"
    const id = revendaId.replace('revenda-', '');
    const revenda = revendas.find(r => r.id.toString() === id);
    if (revenda) {
      setNova({
        ...nova,
        cliente: revendaId,
        nomeCliente: revenda.personal_name || revenda.username,
        email: revenda.email || '',
        telefone: revenda.phone || '',
        descricao: 'Cobrança Mensal - Revenda',
        valor: '149.90',
        vencimento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      });
    }
  };

  const getUserById = (id: number) => {
    return clientes.find(c => c.id === id) || revendas.find(r => r.id === id);
  };

  const openEditModal = (cobranca: Cobranca) => {
    setModalEditar(cobranca);
    setEdit({
      cliente: cobranca.originalId?.toString() || '',
      nomeCliente: cobranca.cliente,
      email: cobranca.email,
      telefone: '',
      descricao: cobranca.descricao,
      valor: cobranca.valor.toString(),
      status: cobranca.status,
      vencimento: cobranca.vencimento,
      observacoes: cobranca.observacoes || '',
      telegram: '',
      whatsapp: '',
      devices: 1,
      credits: 0,
      renewalDate: '',
      notes: ''
    });
  };

  return (
    <div className="p-6 min-h-screen bg-[#09090b]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 className="w-7 h-7 text-purple-400" />
            <h1 className="text-3xl font-bold text-white">Cobranças</h1>
          </div>
          <p className="text-gray-400">Gerencie todas as suas cobranças e faturamento</p>
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            className="border-purple-700 text-purple-400 hover:bg-purple-700/20"
            onClick={() => setModalRelatorio(true)}
          >
            <Download className="w-4 h-4 mr-2" />
            Relatório
          </Button>
          <Button 
            variant="outline" 
            className="border-green-700 text-green-400 hover:bg-green-700/20"
            onClick={() => setModalAutomacao(true)}
          >
            <Zap className="w-4 h-4 mr-2" />
            Automação
          </Button>
        </div>
      </div>

      {/* Banner de erro RLS - apenas se houver erro */}
      {error && (
        <RLSErrorBannerCobrancas error={error} onClearError={clearError} />
      )}

      {/* Dashboard Cards Modernizados */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Total
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{totalCobrancas}</div>
            <div className="text-xs text-gray-400 mt-1">Cobranças</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Pagas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{cobrancasPagas}</div>
            <div className="text-xs text-gray-400 mt-1">{taxaConversao.toFixed(1)}% taxa</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Pendentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{cobrancasPendentes}</div>
            <div className="text-xs text-gray-400 mt-1">Aguardando</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Vencidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{cobrancasVencidas}</div>
            <div className="text-xs text-gray-400 mt-1">Ação necessária</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Receita
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">R$ {valorRecebido.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Recebido</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-900/50 to-indigo-800/30 border border-indigo-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              A Receber
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-400">R$ {(valorTotal - valorRecebido).toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Pendente</div>
          </CardContent>
        </Card>
      </div>

      {/* Sistema de Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList className="grid w-full grid-cols-4 bg-[#1f2937]">
          <TabsTrigger value="cobrancas" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <Receipt className="w-4 h-4 mr-2" />
            Cobranças
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="gateways" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <CreditCard className="w-4 h-4 mr-2" />
            Gateways
          </TabsTrigger>
          <TabsTrigger value="configuracoes" className="data-[state=active]:bg-purple-700 data-[state=active]:text-white">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </TabsTrigger>
        </TabsList>

        {/* Conteúdo das Tabs */}
        <TabsContent value="cobrancas" className="space-y-6">
        {/* Alertas */}
        <div className="mb-4">
          {cobrancasVencidas > 0 && (
            <div className="bg-red-900/80 text-red-200 rounded-lg px-4 py-3 mb-2 font-semibold">
              <span className="mr-2">⚠️</span> Você tem {cobrancasVencidas} cobrança(s) vencida(s) totalizando R$ {(cobrancasVirtuais.filter(c => c.status === 'Vencida').reduce((acc, c) => acc + c.valor, 0)).toLocaleString()}
            </div>
          )}
          {cobrancasPendentes > 0 && (
            <div className="bg-yellow-900/80 text-yellow-200 rounded-lg px-4 py-3 font-semibold">
              <span className="mr-2">⏰</span> Você tem {cobrancasPendentes} cobrança(s) pendente(s) totalizando R$ {(cobrancasVirtuais.filter(c => c.status === 'Pendente').reduce((acc, c) => acc + c.valor, 0)).toLocaleString()}
            </div>
          )}
        </div>
      </TabsContent>

      {/* Conteúdo da Aba Dashboard */}
      <TabsContent value="dashboard" className="space-y-6">
        {/* Gráficos e Métricas */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1f2937] border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-white">Taxa de Conversão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-green-400 mb-2">{taxaConversao.toFixed(1)}%</div>
                <Progress value={taxaConversao} className="h-3" />
                <p className="text-gray-400 text-sm mt-2">{cobrancasPagas} de {totalCobrancas} cobranças pagas</p>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1f2937] border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-white">Performance por Gateway</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {gateways.filter(g => g.configurado).map(gateway => (
                  <div key={gateway.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${gateway.status === 'Ativo' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-gray-300">{gateway.nome}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{gateway.taxa}</div>
                      <div className="text-xs text-gray-400">{gateway.limite}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="cobrancas" className="space-y-6">
        {/* Filtros e busca */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
          <div className="flex-1 flex items-center bg-[#1f2937] rounded-lg px-3">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <Input
              placeholder="Buscar por cliente, descrição ou email..."
              className="bg-transparent border-none text-white focus:ring-0"
              value={busca}
              onChange={e => setBusca(e.target.value)}
            />
          </div>
          <select
            aria-label="Filtrar cobranças por status"
            className="bg-[#1f2937] border border-gray-700 text-gray-300 rounded px-3 py-2"
            value={filtroStatus || ''}
            onChange={e => setFiltroStatus(e.target.value || null)}
          >
            <option value="">Todos</option>
            <option value="Pendente">Pendentes</option>
            <option value="Vencida">Vencidas</option>
            <option value="Paga">Pagas</option>
          </select>
          <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={() => setModalNova(true)}>
            <Plus className="w-4 h-4 mr-2" /> Nova Cobrança
          </Button>
        </div>

        {/* Tabela de cobranças modernizada */}
        <Card className="bg-[#1f2937] border border-purple-700/40">
          <CardHeader>
            <CardTitle className="text-white text-lg">Lista de Cobranças ({filtradas.length})</CardTitle>
          </CardHeader>
          <CardContent className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Gateway</TableHead>
                  <TableHead>Tentativas</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {filtradas.map(c => (
                <TableRow key={c.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
                        {c.cliente.split(' ').map(n => n[0]).join('').slice(0,2)}
                      </div>
                      <div>
                        <div className="font-semibold text-white">{c.cliente}</div>
                        <div className="text-xs text-gray-400">{c.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{c.descricao}</TableCell>
                  <TableCell className="font-bold text-white">R$ {c.valor.toFixed(2)}</TableCell>
                  <TableCell className="text-gray-300">{c.vencimento}</TableCell>
                  <TableCell>
                    {c.status === 'Vencida' && <Badge className="bg-red-700 text-red-200">Vencida</Badge>}
                    {c.status === 'Pendente' && <Badge className="bg-yellow-700 text-yellow-200">Pendente</Badge>}
                    {c.status === 'Paga' && <Badge className="bg-green-700 text-green-200">Paga</Badge>}
                  </TableCell>
                  <TableCell className="text-white text-xs sm:text-sm">{c.tipo}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" onClick={() => setModalVisualizar(c)}><Eye className="w-4 h-4 text-blue-400" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => openEditModal(c)}><Edit className="w-4 h-4 text-yellow-400" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setModalWhats(c)}><MessageSquare className="w-4 h-4 text-green-500" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setModalEmail(c)}><Mail className="w-4 h-4 text-blue-500" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => setModalExcluir(c)}><Trash2 className="w-4 h-4 text-red-400" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      </TabsContent>

      <TabsContent value="gateways" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map(gateway => (
            <Card key={gateway.id} className="bg-[#1f2937] border border-purple-700/40">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg">{gateway.nome}</CardTitle>
                  <Badge className={gateway.status === 'Ativo' ? 'bg-green-700 text-green-200' : 'bg-red-700 text-red-200'}>
                    {gateway.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tipo:</span>
                    <span className="text-white">{gateway.tipo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taxa:</span>
                    <span className="text-white">{gateway.taxa}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Limite:</span>
                    <span className="text-white">{gateway.limite}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-purple-700 text-purple-400 hover:bg-purple-700/20"
                    onClick={() => handleTestarGateway(gateway.id)}
                  >
                    <Zap className="w-4 h-4 mr-1" />
                    Testar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 border-blue-700 text-blue-400 hover:bg-blue-700/20"
                  >
                    <Settings className="w-4 h-4 mr-1" />
                    Config
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </TabsContent>

      <TabsContent value="configuracoes" className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-[#1f2937] border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-white">Configurações de Notificação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Email automático</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">WhatsApp automático</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Notificações push</span>
                <Switch />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1f2937] border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-white">Automação de Cobranças</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Cobrança automática</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Retry automático</span>
                <Switch defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">Multa por atraso</span>
                <Switch />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
      </Tabs>
      {/* Modal Nova Cobrança */}
      <Dialog open={modalNova} onOpenChange={setModalNova}>
        <DialogContent className="bg-[#1f2937] text-white max-w-4xl w-full p-0 rounded-xl shadow-xl border border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="p-6 w-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Nova Cobrança</h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setModalNova(false)}
                className="text-gray-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>
            
            <div className="space-y-6">
              {/* Cliente */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Cliente <span className="text-red-500">*</span>
                </label>
                <select 
                  aria-label="Selecionar cliente ou revenda"
                  className="w-full bg-[#23272f] border border-gray-600 text-white rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  value={nova.cliente}
                  onChange={e => {
                    if (e.target.value.startsWith('cliente-')) {
                      handleClienteChange(e.target.value);
                    } else if (e.target.value.startsWith('revenda-')) {
                      handleRevendaChange(e.target.value);
                    }
                  }}
                >
                  <option value="">Selecionar</option>
                  <optgroup label="Clientes">
                    {clientes.map(user => (
                      <option key={`cliente-${user.id}`} value={`cliente-${user.id}`}>{user.name} - {user.email}</option>
                    ))}
                  </optgroup>
                  <optgroup label="Revendas">
                    {revendas.map(rev => (
                      <option key={`revenda-${rev.id}`} value={`revenda-${rev.id}`}>{rev.personal_name || rev.username} - {rev.email}</option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Nome do Cliente */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Nome do Cliente <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="Nome completo do cliente"
                  className="bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  value={nova.nomeCliente}
                  onChange={e => setNova({ ...nova, nomeCliente: e.target.value })}
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Email <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="Email do cliente"
                  className="bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  value={nova.email}
                  onChange={e => setNova({ ...nova, email: e.target.value })}
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Telefone
                </label>
                <Input 
                  placeholder="(11) 99999-9999"
                  className="bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  value={nova.telefone}
                  onChange={e => setNova({ ...nova, telefone: e.target.value })}
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Descrição <span className="text-red-500">*</span>
                </label>
                <textarea 
                  placeholder="Descrição da cobrança"
                  className="w-full bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-lg px-3 py-2 min-h-[80px] resize-none"
                  value={nova.descricao}
                  onChange={e => setNova({ ...nova, descricao: e.target.value })}
                />
              </div>

              {/* Valor */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Valor <span className="text-red-500">*</span>
                </label>
                <Input 
                  placeholder="R$ 0,00"
                  className="bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500"
                  value={nova.valor}
                  onChange={e => setNova({ ...nova, valor: e.target.value })}
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Status
                </label>
                <select 
                  aria-label="Status da cobrança"
                  className="w-full bg-[#23272f] border border-gray-600 text-white rounded-lg px-3 py-2 focus:border-purple-500 focus:outline-none"
                  value={nova.status}
                  onChange={e => setNova({ ...nova, status: e.target.value })}
                >
                  <option value="Pendente">Pendente</option>
                  <option value="Vencida">Vencida</option>
                  <option value="Paga">Paga</option>
                </select>
              </div>

              {/* Data de Vencimento */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Data de Vencimento <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input 
                    type="date"
                    className="bg-[#23272f] border border-gray-600 text-white focus:border-purple-500 pr-10"
                    value={nova.vencimento}
                    onChange={e => setNova({ ...nova, vencimento: e.target.value })}
                  />
                  <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-gray-300 mb-2 font-medium">
                  Observações
                </label>
                <textarea 
                  placeholder="Observações adicionais sobre a cobrança"
                  className="w-full bg-[#23272f] border border-gray-600 text-white placeholder-gray-400 focus:border-purple-500 rounded-lg px-3 py-2 min-h-[100px] resize-y"
                  value={nova.observacoes}
                  onChange={e => setNova({ ...nova, observacoes: e.target.value })}
                />
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-700">
              <Button 
                variant="outline" 
                onClick={() => setModalNova(false)}
                className="border-gray-600 text-gray-400 hover:text-white px-6 py-2"
              >
                Cancelar
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2"
                onClick={handleSalvarNova}
              >
                Criar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal Visualizar */}
      <Dialog open={!!modalVisualizar} onOpenChange={() => setModalVisualizar(null)}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogTitle>Detalhes da Cobrança</DialogTitle>
          <DialogDescription>Veja as informações completas da cobrança selecionada.</DialogDescription>
          <div className="space-y-2 py-2">
            <div><b>Cliente:</b> {modalVisualizar?.cliente}</div>
            <div><b>E-mail:</b> {modalVisualizar?.email}</div>
            <div><b>Descrição:</b> {modalVisualizar?.descricao}</div>
            <div><b>Valor:</b> R$ {modalVisualizar?.valor.toFixed(2)}</div>
            <div><b>Vencimento:</b> {modalVisualizar?.vencimento}</div>
            <div><b>Status:</b> {modalVisualizar?.status}</div>
          </div>
          <DialogFooter>
            <Button onClick={() => setModalVisualizar(null)} className="bg-purple-600 hover:bg-purple-700 text-white">Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Editar */}
      <Dialog open={!!modalEditar} onOpenChange={() => setModalEditar(null)}>
        <DialogContent className="bg-[#1f2937] text-white max-w-2xl w-full p-0 rounded-xl shadow-xl border border-gray-700">
          <DialogTitle>Editar Cobrança</DialogTitle>
          <DialogDescription>Edite os dados da cobrança e do cliente</DialogDescription>
          <div className="p-6 max-h-[80vh] overflow-y-auto scrollbar-hide">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Users className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-semibold text-white">Editar Cobrança</span>
                <span className="ml-2 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-semibold">Editar</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="bg-[#1f2937] text-white border border-gray-700 px-3 py-1 rounded text-sm">Histórico</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white border border-gray-700 px-3 py-1 rounded text-sm">Duplicar</Button>
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-2">Edite os dados da cobrança e do cliente</p>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-yellow-400 text-xs font-medium">• Campos obrigatórios marcados com *</span>
              <span className="text-blue-400 text-xs font-medium">• Dados serão sincronizados automaticamente</span>
            </div>

            {/* Informações Básicas */}
            <div className="bg-[#1f2937] border border-gray-700 rounded-lg p-4 mb-4">
              <span className="block text-white font-semibold mb-2">Informações Básicas</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Cliente */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Cliente *</label>
                  <select 
                    aria-label="Selecionar cliente para edição"
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.cliente}
                    onChange={e => {
                      const selectedUser = getUserById(parseInt(e.target.value));
                      if (selectedUser) {
                        setEdit({
                          ...edit,
                          cliente: e.target.value,
                          nomeCliente: selectedUser.name,
                          email: selectedUser.email,
                          telefone: selectedUser.phone || '',
                          telegram: selectedUser.telegram || '',
                          whatsapp: selectedUser.whatsapp || '',
                          devices: selectedUser.devices || 1,
                          credits: selectedUser.credits || 0,
                          renewalDate: selectedUser.renewalDate || '',
                          notes: selectedUser.notes || ''
                        });
                      }
                    }}
                  >
                    <option value="">Selecione um cliente</option>
                    {clientes.map(user => (
                      <option key={user.id} value={user.id.toString()}>
                        {user.name}
                      </option>
                    ))}
                    {revendas.map(rev => (
                      <option key={rev.id} value={rev.id.toString()}>
                        {rev.personal_name || rev.username}
                      </option>
                    ))}
                  </select>
                </div>
                {/* Nome */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Nome</label>
                  <input 
                    aria-label="Nome do cliente (edição)"
                    placeholder="Nome do cliente" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.nomeCliente}
                    onChange={e => setEdit({ ...edit, nomeCliente: e.target.value })}
                  />
                </div>
                {/* E-mail */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">E-mail *</label>
                  <input 
                    aria-label="Email do cliente (edição)"
                    placeholder="Email do cliente" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.email}
                    onChange={e => setEdit({ ...edit, email: e.target.value })}
                  />
                </div>
                {/* Telefone */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Telefone</label>
                  <input 
                    aria-label="Telefone do cliente (edição)"
                    placeholder="(11) 99999-9999" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.telefone}
                    onChange={e => setEdit({ ...edit, telefone: e.target.value })}
                  />
                </div>
                {/* Telegram */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Telegram</label>
                  <input 
                    aria-label="Telegram do cliente (edição)"
                    placeholder="@usuario" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.telegram}
                    onChange={e => setEdit({ ...edit, telegram: e.target.value })}
                  />
                </div>
                {/* WhatsApp */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">WhatsApp</label>
                  <input 
                    aria-label="WhatsApp do cliente (edição)"
                    placeholder="+55 11 99999-9999" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.whatsapp}
                    onChange={e => setEdit({ ...edit, whatsapp: e.target.value })}
                  />
                  <span className="text-xs text-gray-400 mt-1 block">Incluindo o código do país - com ou sem espaço e traços</span>
                </div>
                {/* Descrição */}
                <div className="col-span-2">
                  <label className="block text-gray-300 mb-1 font-medium">Descrição *</label>
                  <textarea 
                    placeholder="Descrição da cobrança" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2 min-h-[60px]"
                    value={edit.descricao}
                    onChange={e => setEdit({ ...edit, descricao: e.target.value })}
                  />
                </div>
                {/* Valor */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Valor *</label>
                  <input 
                    aria-label="Valor da cobrança (edição)"
                    placeholder="R$ 0,00" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.valor}
                    onChange={e => setEdit({ ...edit, valor: e.target.value })}
                  />
                </div>
                {/* Status */}
                <div className="col-span-1">
                  <label className="block text-gray-300 mb-1 font-medium">Status</label>
                  <select 
                    aria-label="Status da cobrança (edição)"
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.status}
                    onChange={e => setEdit({ ...edit, status: e.target.value })}
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Vencida">Vencida</option>
                    <option value="Paga">Paga</option>
                  </select>
                </div>
                {/* Data de Vencimento */}
                <div className="col-span-2">
                  <label className="block text-gray-300 mb-1 font-medium">Data de Vencimento *</label>
                  <input 
                    aria-label="Data de vencimento (edição)"
                    type="date"
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.vencimento}
                    onChange={e => setEdit({ ...edit, vencimento: e.target.value })}
                  />
                </div>
                {/* Observações */}
                <div className="col-span-2">
                  <label className="block text-gray-300 mb-1 font-medium">Observações</label>
                  <textarea 
                    placeholder="Observações sobre a cobrança" 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2 min-h-[60px]"
                    value={edit.observacoes}
                    onChange={e => setEdit({ ...edit, observacoes: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Configuração de Serviço */}
            <div className="bg-[#1f2937] border border-gray-700 rounded-lg p-4 mb-4">
              <span className="block text-purple-400 font-semibold mb-2">Configuração de Serviço</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {/* Classe de Serviço */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Classe de Serviço</label>
                  <select className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2" aria-label="Classe de Serviço">
                    <option value="">Selecione</option>
                    <option value="basico">Básico</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                {/* Plano */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Plano</label>
                  <select className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2" aria-label="Plano de serviço">
                    <option value="mensal">Mensal</option>
                    <option value="anual">Anual</option>
                  </select>
                </div>
                {/* Status */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Status</label>
                  <select className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2" aria-label="Status do serviço">
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {/* Data de Renovação */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Data de Renovação</label>
                  <input 
                    aria-label="Data de renovação"
                    type="date"
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.renewalDate}
                    onChange={e => setEdit({ ...edit, renewalDate: e.target.value })}
                  />
                </div>
                {/* Número de Dispositivos */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Número de Dispositivos</label>
                  <input 
                    aria-label="Número de dispositivos"
                    type="number" 
                    min={1} 
                    className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                    value={edit.devices}
                    onChange={e => setEdit({ ...edit, devices: parseInt(e.target.value) || 1 })}
                  />
                </div>
                {/* Créditos */}
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Créditos</label>
                  <div className="flex items-center gap-2">
                    <button 
                      type="button" 
                      className="bg-[#23272f] text-white px-2 py-1 rounded border border-gray-700"
                      onClick={() => setEdit({ ...edit, credits: Math.max(0, edit.credits - 1) })}
                    >
                      -
                    </button>
                    <input 
                      aria-label="Créditos"
                      type="number" 
                      min={0} 
                      className="w-16 bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
                      value={edit.credits}
                      onChange={e => setEdit({ ...edit, credits: parseInt(e.target.value) || 0 })}
                    />
                    <button 
                      type="button" 
                      className="bg-[#23272f] text-white px-2 py-1 rounded border border-gray-700"
                      onClick={() => setEdit({ ...edit, credits: Math.min(500, edit.credits + 1) })}
                    >
                      +
                    </button>
                    <span className="text-xs text-gray-400 ml-2">valor<br/>entre 0<br/>e 500€</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Informações Adicionais */}
            <div className="bg-[#1f2937] border border-gray-700 rounded-lg p-4 mb-4">
              <span className="block text-white font-semibold mb-2">Informações Adicionais</span>
              <div className="flex items-center gap-2 mb-2">
                <input aria-label="Notificações via WhatsApp" type="checkbox" className="accent-green-500" />
                <span className="text-gray-300 text-sm">Notificações via WhatsApp</span>
              </div>
              <div>
                <label className="block text-gray-300 mb-1 font-medium">Anotações</label>
                <textarea 
                  className="w-full bg-[#1f2937] border border-gray-700 text-white rounded p-2 min-h-[60px]" 
                  placeholder="Anotações..."
                  value={edit.notes}
                  onChange={e => setEdit({ ...edit, notes: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setModalEditar(null)} className="bg-gray-700 text-white px-6 py-2 rounded font-semibold">
                Cancelar
              </Button>
              <Button onClick={handleSalvarEdit} className="bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2 rounded font-semibold">
                Salvar Alterações
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      {/* Modal Excluir */}
      <Dialog open={!!modalExcluir} onOpenChange={() => setModalExcluir(null)}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Cobrança</DialogTitle>
          </DialogHeader>
          <div className="py-4">Tem certeza que deseja excluir esta cobrança?</div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalExcluir(null)} className="bg-gray-700 text-white">Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => deleteCobranca(modalExcluir!.id)}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal E-mail */}
      <Dialog open={!!modalEmail} onOpenChange={() => setModalEmail(null)}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Cobrança por E-mail</DialogTitle>
          </DialogHeader>
          <div className="py-4">Cobrança enviada para <b>{modalEmail?.email}</b>!</div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setModalEmail(null)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal WhatsApp */}
      <Dialog open={!!modalWhats} onOpenChange={() => setModalWhats(null)}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Cobrança por WhatsApp</DialogTitle>
          </DialogHeader>
          <div className="py-4">Cobrança enviada para <b>{modalWhats?.cliente}</b> via WhatsApp!</div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => handleEnviarNotificacao(modalWhats!)}>Enviar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Relatório */}
      <Dialog open={modalRelatorio} onOpenChange={setModalRelatorio}>
        <DialogContent className="bg-[#1f2937] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Gerar Relatório</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Período</label>
                <Select>
                  <SelectTrigger className="bg-[#23272f] border-gray-700" aria-label="Período do relatório">
                    <SelectValue placeholder="Selecione o período" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#23272f] border-gray-700">
                    <SelectItem value="7">Últimos 7 dias</SelectItem>
                    <SelectItem value="30">Últimos 30 dias</SelectItem>
                    <SelectItem value="90">Últimos 90 dias</SelectItem>
                    <SelectItem value="365">Último ano</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Formato</label>
                <Select>
                  <SelectTrigger className="bg-[#23272f] border-gray-700" aria-label="Formato do relatório">
                    <SelectValue placeholder="Selecione o formato" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#23272f] border-gray-700">
                    <SelectItem value="pdf">PDF</SelectItem>
                    <SelectItem value="excel">Excel</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Incluir</label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input aria-label="Incluir métricas de conversão" type="checkbox" defaultChecked className="accent-purple-500" />
                  <span className="text-gray-300">Métricas de conversão</span>
                </div>
                <div className="flex items-center gap-2">
                  <input aria-label="Incluir performance por gateway" type="checkbox" defaultChecked className="accent-purple-500" />
                  <span className="text-gray-300">Performance por gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <input aria-label="Incluir análise de tendências" type="checkbox" className="accent-purple-500" />
                  <span className="text-gray-300">Análise de tendências</span>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalRelatorio(false)} className="border-gray-700 text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleGerarRelatorio} className="bg-purple-600 hover:bg-purple-700">
              <Download className="w-4 h-4 mr-2" />
              Gerar Relatório
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Automação */}
      <Dialog open={modalAutomacao} onOpenChange={setModalAutomacao}>
        <DialogContent className="bg-[#1f2937] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Configurar Automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-300 mb-2">Tipo de Automação</label>
                <Select>
                  <SelectTrigger className="bg-[#23272f] border-gray-700">
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#23272f] border-gray-700">
                    <SelectItem value="cobranca">Cobrança Recorrente</SelectItem>
                    <SelectItem value="lembrete">Lembretes Automáticos</SelectItem>
                    <SelectItem value="retry">Retry Automático</SelectItem>
                    <SelectItem value="multa">Multa por Atraso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-gray-300 mb-2">Frequência</label>
                <Select>
                  <SelectTrigger className="bg-[#23272f] border-gray-700">
                    <SelectValue placeholder="Selecione a frequência" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#23272f] border-gray-700">
                    <SelectItem value="diario">Diário</SelectItem>
                    <SelectItem value="semanal">Semanal</SelectItem>
                    <SelectItem value="mensal">Mensal</SelectItem>
                    <SelectItem value="personalizado">Personalizado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="block text-gray-300 mb-2">Configurações</label>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Tentativas máximas</span>
                  <input aria-label="Tentativas máximas" type="number" min="1" max="10" defaultValue="3" className="w-20 bg-[#23272f] border border-gray-700 text-white rounded px-2 py-1" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Intervalo entre tentativas (dias)</span>
                  <input aria-label="Intervalo entre tentativas (dias)" type="number" min="1" max="30" defaultValue="7" className="w-20 bg-[#23272f] border border-gray-700 text-white rounded px-2 py-1" />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Multa por atraso (%)</span>
                  <input aria-label="Multa por atraso (porcentagem)" type="number" min="0" max="20" defaultValue="2" className="w-20 bg-[#23272f] border border-gray-700 text-white rounded px-2 py-1" />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalAutomacao(false)} className="border-gray-700 text-gray-300">
              Cancelar
            </Button>
            <Button onClick={handleConfigurarAutomacao} className="bg-green-600 hover:bg-green-700">
              <Zap className="w-4 h-4 mr-2" />
              Configurar Automação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function VencimentoDatePicker() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);
  const [time, setTime] = React.useState<string>("");

  function handleDateSelect(selected: Date | undefined) {
    setDate(selected);
    setOpen(false);
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    setTime(e.target.value);
  }

  function formatDate(d?: Date) {
    if (!d) return "";
    return d.toLocaleDateString("pt-BR");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <div className="flex gap-2">
          <input
            aria-label="Selecionar data de vencimento"
            readOnly
            value={date ? formatDate(date) : ""}
            placeholder="Selecione a data"
            className="w-1/2 bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2 cursor-pointer"
            onClick={() => setOpen(true)}
          />
          <input
            aria-label="Selecionar hora"
            type="time"
            value={time}
            onChange={handleTimeChange}
            className="w-1/2 bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 bg-[#1f2937] border border-gray-700">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md bg-[#1f2937] text-white"
        />
        <div className="flex justify-end p-2">
          <Button size="sm" onClick={() => setOpen(false)}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RenovacaoDatePicker() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  function formatDate(d?: Date) {
    if (!d) return "";
    return d.toLocaleDateString("pt-BR");
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <input
          readOnly
          value={date ? formatDate(date) : ""}
          placeholder="dd/mm/aaaa"
          className="w-full bg-[#23272f] border border-gray-700 text-white rounded px-3 py-2 cursor-pointer"
          onClick={() => setOpen(true)}
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0 bg-[#1f2937] border border-gray-700">
        <CalendarComponent
          mode="single"
          selected={date}
          onSelect={setDate}
          className="rounded-md bg-[#1f2937] text-white"
        />
        <div className="flex justify-end p-2">
          <Button size="sm" onClick={() => setOpen(false)}>
            OK
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
} 