import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Users, Plus, Search, Edit, Trash2, Eye, User, Mail, Calendar, Shield, Activity, CheckCircle, RefreshCw, Maximize2, Moon, ArrowUp } from "lucide-react";
import { useRevendas } from '@/hooks/useRevendas';
import { RLSErrorBannerResellers } from '@/components/RLSErrorBannerResellers';
import { useNavigate } from "react-router-dom";

const MAX_RESELLERS = 5; // Limite de revendas para o plano Essencial

export default function ClientResellers() {
  const navigate = useNavigate();
  const { revendas, loading, error, addRevenda, updateRevenda, deleteRevenda, fetchRevendas, clearError } = useRevendas();

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

  // Estados para os modais
  const [editingReseller, setEditingReseller] = useState<any | null>(null);
  const [viewingReseller, setViewingReseller] = useState<any | null>(null);
  const [deletingReseller, setDeletingReseller] = useState<any | null>(null);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddingReseller, setIsAddingReseller] = useState(false);
  const [addResellerSuccess, setAddResellerSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const filteredRevendas = revendas.filter(revenda =>
    revenda.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenda.personal_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    revenda.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Listener para atualizar a lista quando um revendedor é criado
  useEffect(() => {
    const refreshData = (delay: number = 0, reason: string = '') => {
      if (!fetchRevendas) return;
      
      if (delay > 0) {
        setTimeout(() => {
          console.log(`🔄 [ClientResellers] ${reason} - Atualizando lista após ${delay}ms...`);
          fetchRevendas();
        }, delay);
      } else {
        console.log(`🔄 [ClientResellers] ${reason} - Atualizando lista...`);
        fetchRevendas();
      }
    };

    const refreshFlag = localStorage.getItem('dashboard-refresh');
    const resellerCreatedFlag = localStorage.getItem('reseller-created');
    const hasFlags = refreshFlag || resellerCreatedFlag;
    
    if (hasFlags) {
      console.log('🔄 [ClientResellers] Flag de refresh encontrada ao montar, removendo flags...');
      localStorage.removeItem('dashboard-refresh');
      localStorage.removeItem('reseller-created');
      refreshData(800, 'Flag encontrada ao montar');
    }

    const handleResellerCreated = () => {
      console.log('🔄 [ClientResellers] Evento reseller-created recebido');
      refreshData(500, 'Evento reseller-created');
    };

    const handleRefreshDashboard = (event: CustomEvent) => {
      if (event.detail?.source === 'resellers' || !event.detail?.source) {
        console.log('🔄 [ClientResellers] Evento refresh-dashboard recebido');
        refreshData(500, 'Evento refresh-dashboard');
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'dashboard-refresh' || e.key === 'reseller-created') {
        console.log('🔄 [ClientResellers] localStorage change detectado');
        if (e.key === 'dashboard-refresh') localStorage.removeItem('dashboard-refresh');
        if (e.key === 'reseller-created') localStorage.removeItem('reseller-created');
        refreshData(500, 'localStorage change');
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('🔄 [ClientResellers] Página visível, verificando se precisa atualizar...');
        const needsRefresh = localStorage.getItem('reseller-created');
        if (needsRefresh && fetchRevendas) {
          console.log('🔄 [ClientResellers] Flag de atualização encontrada, atualizando lista...');
          localStorage.removeItem('reseller-created');
          refreshData(500, 'Página visível com flag');
        }
      }
    };

    window.addEventListener('reseller-created', handleResellerCreated);
    window.addEventListener('refresh-dashboard', handleRefreshDashboard as EventListener);
    window.addEventListener('storage', handleStorageChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('reseller-created', handleResellerCreated);
      window.removeEventListener('refresh-dashboard', handleRefreshDashboard as EventListener);
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAddRevenda = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Verificar limite de revendas (5 para plano Essencial)
    const currentResellerCount = revendas.length;
    if (currentResellerCount >= MAX_RESELLERS) {
      alert(`Você atingiu o limite de ${MAX_RESELLERS} revendas do seu plano. Para adicionar mais revendas, faça upgrade do seu plano.`);
      return;
    }
    
    const errors: string[] = [];
    
    if (!newReseller.username || newReseller.username.trim() === '') {
      errors.push('Usuário é obrigatório');
    }
    
    if (!newReseller.password || newReseller.password.trim() === '') {
      errors.push('Senha é obrigatória');
    }
    
    if (!newReseller.permission || newReseller.permission.trim() === '') {
      errors.push('Permissão é obrigatória');
    }
    
    if (errors.length > 0) {
      alert(`❌ Por favor, preencha todos os campos obrigatórios:\n\n${errors.join('\n')}`);
      return;
    }
    
    if (newReseller.email && newReseller.email.trim() !== '' && !newReseller.email.includes('@')) {
      alert('❌ Por favor, forneça um email válido ou deixe o campo vazio.');
      return;
    }
    
    setIsAddingReseller(true);
    setAddResellerSuccess(false);
    if (clearError) {
      clearError();
    }
    setFormError(null);
    
    try {
      const success = await addRevenda({
        username: newReseller.username,
        password: newReseller.password,
        force_password_change: newReseller.force_password_change || false,
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
        observations: newReseller.observations || undefined,
        status: 'Ativo'
      });
      
      if (!success) {
        const errorMessage = error || 'Erro ao adicionar revendedor. Verifique os dados e tente novamente.';
        alert(`❌ Erro ao adicionar revendedor:\n\n${errorMessage}`);
        setIsAddingReseller(false);
        setAddResellerSuccess(false);
        setFormError(errorMessage);
        return;
      }
      
      setAddResellerSuccess(true);
      
      if (fetchRevendas) {
        setTimeout(() => {
          fetchRevendas();
        }, 500);
      }
      
      window.dispatchEvent(new CustomEvent('reseller-created'));
      window.dispatchEvent(new CustomEvent('refresh-dashboard', { detail: { source: 'resellers', action: 'create' } }));
      
      try {
        localStorage.setItem('dashboard-refresh', Date.now().toString());
        localStorage.setItem('reseller-created', Date.now().toString());
      } catch (error) {
        console.error('❌ Erro ao definir flag localStorage:', error);
      }
      
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
      
      setTimeout(() => {
        setIsAddDialogOpen(false);
        setAddResellerSuccess(false);
      }, 1000);
    } catch (error) {
      console.error('❌ [ClientResellers] Erro ao adicionar revendedor:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido ao adicionar revendedor';
      alert(`❌ Erro ao adicionar revendedor:\n\n${errorMessage}`);
      setIsAddingReseller(false);
      setAddResellerSuccess(false);
      setFormError(errorMessage);
    } finally {
      setIsAddingReseller(false);
    }
  };

  const handleEditRevenda = async () => {
    if (editingReseller) {
      const success = await updateRevenda(editingReseller.id, {
        username: editingReseller.username,
        password: editingReseller.password,
        force_password_change: editingReseller.force_password_change,
        permission: editingReseller.permission,
        credits: editingReseller.credits,
        servers: editingReseller.servers,
        master_reseller: editingReseller.master_reseller,
        disable_login_days: editingReseller.disable_login_days,
        monthly_reseller: editingReseller.monthly_reseller,
        personal_name: editingReseller.personal_name,
        email: editingReseller.email,
        telegram: editingReseller.telegram,
        whatsapp: editingReseller.whatsapp,
        observations: editingReseller.observations
      });
      
      if (success) {
        window.dispatchEvent(new CustomEvent('refresh-dashboard', { detail: { source: 'resellers', action: 'update' } }));
        
        try {
          localStorage.setItem('dashboard-refresh', Date.now().toString());
        } catch (error) {
          console.error('❌ Erro ao definir flag localStorage:', error);
        }
        
        setEditingReseller(null);
        setIsEditDialogOpen(false);
      }
    }
  };

  const handleDeleteRevenda = async () => {
    if (deletingReseller) {
      const success = await deleteRevenda(deletingReseller.id);
      
      if (success) {
        window.dispatchEvent(new CustomEvent('refresh-dashboard', { 
          detail: { source: 'resellers', action: 'delete', revendaId: deletingReseller.id } 
        }));
        
        try {
          localStorage.setItem('dashboard-refresh', Date.now().toString());
        } catch (error) {
          console.error('❌ Erro ao definir flag localStorage:', error);
        }
        
        setDeletingReseller(null);
        setIsDeleteDialogOpen(false);
        alert("✅ Revendedor excluído com sucesso!");
      } else {
        const errorMsg = error || "Erro ao deletar revendedor. Verifique se você tem permissão no Supabase ou se há policies bloqueando a exclusão.";
        alert(`❌ ${errorMsg}`);
      }
    }
  };

  const openViewModal = (revenda: any) => {
    setViewingReseller(revenda);
    setIsViewDialogOpen(true);
  };

  const openEditModal = (revenda: any) => {
    setEditingReseller({ ...revenda });
    setIsEditDialogOpen(true);
  };

  const openDeleteModal = (revenda: any) => {
    setDeletingReseller(revenda);
    setIsDeleteDialogOpen(true);
  };

  const getPermissionColor = (permission: string) => {
    switch (permission) {
      case "admin": return "bg-red-100 text-red-800";
      case "reseller": return "bg-blue-100 text-blue-800";
      case "subreseller": return "bg-green-100 text-green-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "suspended": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-[#09090b] p-3 sm:p-6">
      {/* Indicadores de status */}
      {loading && (
        <div className="bg-blue-900/40 border border-blue-700 text-blue-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-300"></div>
            <span>Carregando revendedores do banco de dados...</span>
          </div>
        </div>
      )}
      
      {/* Banner de erro RLS */}
      {error && (
        <RLSErrorBannerResellers error={error} onClearError={clearError} />
      )}

      {/* Aviso de limite de revendas */}
      {revendas.length >= MAX_RESELLERS && (
        <div className="bg-yellow-900/40 border border-yellow-700 text-yellow-300 rounded-lg p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Shield className="w-5 h-5 flex-shrink-0" />
              <div>
                <strong>Limite de revendas atingido!</strong>
                <p className="text-sm mt-1">
                  Você atingiu o limite de {MAX_RESELLERS} revendas do seu plano Essencial. 
                  Para adicionar mais revendas, faça upgrade do seu plano.
                </p>
              </div>
            </div>
            <Button
              onClick={() => {
                navigate('/');
                setTimeout(() => {
                  const pricingElement = document.getElementById('pricing');
                  if (pricingElement) {
                    pricingElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }, 100);
              }}
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 font-semibold shadow-lg shadow-purple-500/50 whitespace-nowrap"
            >
              <ArrowUp className="w-4 h-4 mr-2" />
              Fazer Upgrade
            </Button>
          </div>
        </div>
      )}

      {revendas.length >= MAX_RESELLERS - 1 && revendas.length < MAX_RESELLERS && (
        <div className="bg-blue-900/40 border border-blue-700 text-blue-300 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5" />
            <div>
              <strong>Atenção: Limite próximo!</strong>
              <p className="text-sm mt-1">
                Você tem {revendas.length} de {MAX_RESELLERS} revendas. 
                Ainda pode adicionar {MAX_RESELLERS - revendas.length} revenda(s).
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Gerenciamento de Revendedores ({revendas.length}/{MAX_RESELLERS})
          </h1>
          <p className="text-gray-400 text-sm sm:text-base">
            {loading ? 'Carregando...' : `Gerencie todos os revendedores do sistema (${revendas.length} revendedores)`}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="flex items-center gap-2 bg-[#7e22ce] hover:bg-[#6d1bb7] text-white h-10 sm:h-auto disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={revendas.length >= MAX_RESELLERS}
              >
                <Plus className="w-4 h-4" />
                {revendas.length >= MAX_RESELLERS ? (
                  <span className="hidden sm:inline">Limite atingido ({MAX_RESELLERS}/{MAX_RESELLERS})</span>
                ) : (
                  <>
                    <span className="hidden sm:inline">Adicionar Revenda</span>
                    <span className="sm:hidden">Novo</span>
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1f2937] text-white max-w-4xl w-full p-0 rounded-xl shadow-xl border border-gray-700 flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
            <DialogHeader className="sr-only">
              <DialogTitle>Adicionar Revenda</DialogTitle>
              <DialogDescription>Preencha os dados do novo revendedor</DialogDescription>
            </DialogHeader>
            <div className="p-6 w-full flex flex-col">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Adicionar um Revenda</h2>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="text-gray-400 hover:text-white" onClick={() => setIsAddDialogOpen(false)}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </Button>
                </div>
              </div>
              
              <form onSubmit={handleAddRevenda} className="space-y-6 flex-1 overflow-y-auto">
                {formError && (
                  <div className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {formError}
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Usuário <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      placeholder="Obrigatório"
                      value={newReseller.username}
                      onChange={(e) => setNewReseller({...newReseller, username: e.target.value})}
                      required
                    />
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>O campo usuário só pode conter letras, números e traços.</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>O usuário precisa ter no mínimo 6 caracteres.</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Senha <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        className="bg-[#23272f] border-gray-600 text-white flex-1 placeholder-gray-400 focus:border-blue-500"
                        placeholder="Digite a senha"
                        value={newReseller.password}
                        onChange={(e) => setNewReseller({...newReseller, password: e.target.value})}
                        required
                      />
                      <Button type="button" variant="outline" size="sm" className="border-gray-600 text-gray-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                      </Button>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>A senha precisa ter no mínimo 8 caracteres.</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Pelo menos 8 caracteres de comprimento, mas 14 ou mais é melhor.</span>
                      </div>
                      <div className="flex items-center gap-2 text-blue-400 text-xs">
                        <div className="w-1 h-1 bg-blue-400 rounded-full"></div>
                        <span>Uma combinação de letras maiúsculas, letras minúsculas, números e símbolos.</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="forcePasswordChange"
                    className="rounded border-gray-600 bg-[#23272f] text-blue-500 focus:ring-blue-500"
                    checked={newReseller.force_password_change}
                    onChange={(e) => setNewReseller({...newReseller, force_password_change: e.target.checked})}
                  />
                  <Label htmlFor="forcePasswordChange" className="text-sm text-gray-300">
                    Forçar revenda a mudar a senha no próximo login
                  </Label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Permissão <span className="text-red-500">*</span>
                    </Label>
                    <Select value={newReseller.permission} onValueChange={(value) => setNewReseller({...newReseller, permission: value})}>
                      <SelectTrigger className="bg-[#23272f] border-gray-600 text-white focus:border-blue-500">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent className="bg-[#23272f] border-gray-600">
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="reseller">Revendedor</SelectItem>
                        <SelectItem value="subreseller">Sub-Revendedor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Créditos <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 text-gray-400 hover:text-white"
                        onClick={() => setNewReseller({...newReseller, credits: Math.max(0, newReseller.credits - 1)})}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </Button>
                      <Input
                        type="number"
                        className="bg-[#23272f] border-gray-600 text-white text-center placeholder-gray-400 focus:border-blue-500"
                        placeholder="0"
                        value={newReseller.credits}
                        onChange={(e) => setNewReseller({...newReseller, credits: parseInt(e.target.value) || 0})}
                        min="10"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 text-gray-400 hover:text-white"
                        onClick={() => setNewReseller({...newReseller, credits: newReseller.credits + 1})}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </Button>
                    </div>
                    <div className="text-blue-400 text-xs">Mínimo de 10 créditos</div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Servidores (Opcional)</Label>
                  <Select value={newReseller.servers} onValueChange={(value) => setNewReseller({...newReseller, servers: value})}>
                    <SelectTrigger className="bg-[#23272f] border-gray-600 text-white focus:border-blue-500">
                      <SelectValue placeholder="Opcional" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#23272f] border-gray-600">
                      <SelectItem value="none">Opcional</SelectItem>
                      <SelectItem value="server1">Servidor 1</SelectItem>
                      <SelectItem value="server2">Servidor 2</SelectItem>
                      <SelectItem value="server3">Servidor 3</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="text-blue-400 text-xs">
                    Selecione os servidores que esse revenda pode ter acesso. Deixe em branco para permitir todos os servidores. Essa configuração afeta tanto a revenda quanto as subrevendas.
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">Revenda Master</Label>
                    <Input
                      className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                      placeholder="Nome da revenda master"
                      value={newReseller.master_reseller}
                      onChange={(e) => setNewReseller({...newReseller, master_reseller: e.target.value})}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-white">
                      Desativar login se não recarregar - em dias
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 text-gray-400 hover:text-white"
                        onClick={() => setNewReseller({...newReseller, disable_login_days: Math.max(0, newReseller.disable_login_days - 1)})}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                      </Button>
                      <Input
                        type="number"
                        className="bg-[#23272f] border-gray-600 text-white text-center placeholder-gray-400 focus:border-blue-500"
                        placeholder="0"
                        value={newReseller.disable_login_days}
                        onChange={(e) => setNewReseller({...newReseller, disable_login_days: parseInt(e.target.value) || 0})}
                        min="0"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        className="border-gray-600 text-gray-400 hover:text-white"
                        onClick={() => setNewReseller({...newReseller, disable_login_days: newReseller.disable_login_days + 1})}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </Button>
                    </div>
                    <div className="text-blue-400 text-xs">Deixe 0 para desativar essa opção</div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="monthlyReseller"
                      className="rounded border-gray-600 bg-[#23272f] text-blue-500 focus:ring-blue-500"
                      checked={newReseller.monthly_reseller}
                      onChange={(e) => setNewReseller({...newReseller, monthly_reseller: e.target.checked})}
                    />
                    <Label htmlFor="monthlyReseller" className="text-sm text-gray-300">
                      Configuração de Revenda Mensalista
                    </Label>
                  </div>
                  <div className="bg-green-600/20 border border-green-600/30 rounded-lg p-3">
                    <div className="text-green-400 text-sm">
                      Apenas você pode visualizar os detalhes pessoais deste revenda.
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-white">Informações Pessoais (Opcional)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Nome</Label>
                      <Input
                        className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="Nome completo"
                        value={newReseller.personal_name}
                        onChange={(e) => setNewReseller({...newReseller, personal_name: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">E-mail</Label>
                      <Input
                        type="email"
                        className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="email@exemplo.com"
                        value={newReseller.email}
                        onChange={(e) => setNewReseller({...newReseller, email: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">Telegram</Label>
                      <Input
                        className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="@usuario"
                        value={newReseller.telegram}
                        onChange={(e) => setNewReseller({...newReseller, telegram: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-white">WhatsApp</Label>
                      <Input
                        className="bg-[#23272f] border-gray-600 text-white placeholder-gray-400 focus:border-blue-500"
                        placeholder="55 11 99999 3333"
                        value={newReseller.whatsapp}
                        onChange={(e) => setNewReseller({...newReseller, whatsapp: e.target.value})}
                      />
                      <div className="text-blue-400 text-xs">
                        Incluindo o código do país - com ou sem espaço e traços - ex. 55 11 99999 3333
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-white">Observações (Opcional)</Label>
                  <textarea
                    rows={4}
                    placeholder="Adicione observações sobre este revendedor..."
                    className="w-full bg-[#23272f] border border-gray-600 text-white rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none placeholder-gray-400 resize-none"
                    value={newReseller.observations}
                    onChange={(e) => setNewReseller({...newReseller, observations: e.target.value})}
                  />
                </div>

                <div className="flex items-center justify-between pt-6 border-t border-gray-700">
                  <Button
                    type="button"
                    variant="outline"
                    className="border-gray-600 text-gray-400 hover:text-white"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={isAddingReseller}
                  >
                    {isAddingReseller ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                        </svg>
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total de Revendas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{revendas.length}</div>
            <div className="text-xs text-gray-400 mt-1">Revendedores cadastrados</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Revendas Ativas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{revendas.filter(r => r.status === 'active').length}</div>
            <div className="text-xs text-gray-400 mt-1">Revendedores com acesso</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{revendas.filter(r => r.permission === 'admin').length}</div>
            <div className="text-xs text-gray-400 mt-1">Contas de administrador</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Novos este Mês
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">5</div>
            <div className="text-xs text-gray-400 mt-1">Novos revendedores</div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de pesquisa */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Buscar revendedores..."
            className="pl-10 bg-[#1f2937] border-gray-700 text-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Tabela de revendedores */}
      <Card className="bg-[#1f2937] border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Lista de Revendedores</CardTitle>
          <CardDescription className="text-gray-400">
            {filteredRevendas.length} revendedores encontrados
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-gray-700">
                <TableHead className="text-white text-xs sm:text-sm">Usuário</TableHead>
                <TableHead className="text-white text-xs sm:text-sm">Permissão</TableHead>
                <TableHead className="text-white text-xs sm:text-sm">Créditos</TableHead>
                <TableHead className="text-white text-xs sm:text-sm">Status</TableHead>
                <TableHead className="hidden md:table-cell text-white text-xs sm:text-sm">Criado em</TableHead>
                <TableHead className="text-white text-xs sm:text-sm">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRevendas.map((revenda) => (
                <TableRow key={revenda.id} className="border-gray-700">
                  <TableCell className="text-white text-xs sm:text-sm">
                    <div>
                      <div className="font-medium">{revenda.username}</div>
                      {revenda.personal_name && (
                        <div className="text-xs sm:text-sm text-gray-400">{revenda.personal_name}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getPermissionColor(revenda.permission)}`}>
                      {revenda.permission}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white text-xs sm:text-sm">{revenda.credits}</TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${getStatusColor(revenda.status)}`}>
                      {revenda.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-white text-xs sm:text-sm">
                    {new Date(revenda.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 sm:gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openViewModal(revenda)}
                        className="text-blue-400 hover:text-blue-300 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditModal(revenda)}
                        className="text-green-400 hover:text-green-300 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openDeleteModal(revenda)}
                        className="text-red-400 hover:text-red-300 h-8 w-8 sm:h-9 sm:w-9 p-0"
                      >
                        <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modal de Visualização */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="bg-[#1f2937] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detalhes do Revendedor</DialogTitle>
          </DialogHeader>
          {viewingReseller && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-400">Usuário</Label>
                  <p className="text-white">{viewingReseller.username}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-400">Permissão</Label>
                  <Badge className={getPermissionColor(viewingReseller.permission)}>
                    {viewingReseller.permission}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-400">Créditos</Label>
                  <p className="text-white">{viewingReseller.credits}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-400">Status</Label>
                  <Badge className={getStatusColor(viewingReseller.status)}>
                    {viewingReseller.status}
                  </Badge>
                </div>
              </div>
              {viewingReseller.personal_name && (
                <div>
                  <Label className="text-sm font-medium text-gray-400">Nome</Label>
                  <p className="text-white">{viewingReseller.personal_name}</p>
                </div>
              )}
              {viewingReseller.email && (
                <div>
                  <Label className="text-sm font-medium text-gray-400">E-mail</Label>
                  <p className="text-white">{viewingReseller.email}</p>
                </div>
              )}
              {viewingReseller.observations && (
                <div>
                  <Label className="text-sm font-medium text-gray-400">Observações</Label>
                  <p className="text-white">{viewingReseller.observations}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal de Edição */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-[#1f2937] text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar Revendedor</DialogTitle>
          </DialogHeader>
          {editingReseller && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-white">Usuário</Label>
                  <Input
                    value={editingReseller.username}
                    onChange={(e) => setEditingReseller({...editingReseller, username: e.target.value})}
                    className="bg-[#23272f] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-white">Permissão</Label>
                  <Select value={editingReseller.permission} onValueChange={(value) => setEditingReseller({...editingReseller, permission: value as string})}>
                    <SelectTrigger className="bg-[#23272f] border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#23272f] border-gray-600">
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="reseller">Revendedor</SelectItem>
                      <SelectItem value="subreseller">Sub-Revendedor</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm font-medium text-white">Créditos</Label>
                  <Input
                    type="number"
                    value={editingReseller.credits}
                    onChange={(e) => setEditingReseller({...editingReseller, credits: parseInt(e.target.value) || 0})}
                    className="bg-[#23272f] border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium text-white">Nome</Label>
                  <Input
                    value={editingReseller.personal_name || ''}
                    onChange={(e) => setEditingReseller({...editingReseller, personal_name: e.target.value})}
                    className="bg-[#23272f] border-gray-600 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-white">E-mail</Label>
                <Input
                  type="email"
                  value={editingReseller.email || ''}
                  onChange={(e) => setEditingReseller({...editingReseller, email: e.target.value})}
                  className="bg-[#23272f] border-gray-600 text-white"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-white">Observações</Label>
                <textarea
                  value={editingReseller.observations || ''}
                  onChange={(e) => setEditingReseller({...editingReseller, observations: e.target.value})}
                  className="w-full bg-[#23272f] border border-gray-600 text-white rounded-md px-3 py-2"
                  rows={3}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditRevenda}>
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Confirmação de Exclusão */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="bg-[#1f2937] text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o revendedor "{deletingReseller?.username}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRevenda} className="bg-red-600 hover:bg-red-700">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
