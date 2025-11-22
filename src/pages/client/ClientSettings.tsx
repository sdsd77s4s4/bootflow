import { useState } from "react";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { DialogFooter } from '@/components/ui/dialog';
import { DialogWrapper } from '@/components/ui/DialogWrapper';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Bell, Link, CreditCard, Shield } from 'lucide-react';

interface Perfil {
  nome: string;
  sobrenome: string;
  email: string;
  empresa: string;
  telefone: string;
  fuso: string;
}

interface Notificacoes {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  sms: boolean;
  clientes: boolean;
  cobrancas: boolean;
  promocoes: boolean;
}

interface Integracoes {
  whatsapp: boolean;
  google: boolean;
  zapier: boolean;
}

interface Fatura {
  id: number;
  data: string;
  valor: string;
  status: string;
}

interface Senha {
  atual: string;
  nova: string;
  confirmar: string;
}

const perfisMock = {
  nome: 'João',
  sobrenome: 'Silva',
  email: 'joao@exemplo.com',
  empresa: 'Minha Empresa LTDA',
  telefone: '+55 11 99999-9999',
  fuso: 'América/São Paulo',
};

export default function ClientSettings() {
  const [tab, setTab] = useState('perfil');
  const [perfil, setPerfil] = useState<Perfil>(perfisMock);
  // Notificações
  const [notificacoes, setNotificacoes] = useState<Notificacoes>({ email: true, whatsapp: true, push: false, sms: false, clientes: true, cobrancas: true, promocoes: false });
  // Integrações
  const [integracoes, setIntegracoes] = useState<Integracoes>({ whatsapp: false, google: false, zapier: false });
  const [modalIntegracao, setModalIntegracao] = useState<string | null>(null);
  // Faturamento
  const [plano, setPlano] = useState('Pro');
  const [faturas] = useState<Fatura[]>([
    { id: 1, data: '10/06/2024', valor: 'R$ 99,90', status: 'Paga' },
    { id: 2, data: '10/05/2024', valor: 'R$ 99,90', status: 'Paga' },
    { id: 3, data: '10/04/2024', valor: 'R$ 99,90', status: 'Paga' },
  ]);
  // Segurança
  const [senha, setSenha] = useState<Senha>({ atual: '', nova: '', confirmar: '' });
  const [modal2FA, setModal2FA] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPerfil({ ...perfil, [e.target.name]: e.target.value });
  };

  const navItems = [
    { id: 'perfil', title: 'Perfil', icon: User, description: 'Suas informações pessoais.', color: 'purple' },
    { id: 'notificacoes', title: 'Notificações', icon: Bell, description: 'Como você será notificado.', color: 'green' },
    { id: 'integracoes', title: 'Integrações', icon: Link, description: 'Conecte outras ferramentas.', color: 'blue' },
    { id: 'faturamento', title: 'Faturamento', icon: CreditCard, description: 'Seu plano e faturas.', color: 'yellow' },
    { id: 'seguranca', title: 'Segurança', icon: Shield, description: 'Proteja sua conta.', color: 'red' },
  ];

  const colorClasses = {
    purple: {
      border: 'border-purple-700/40',
      shadow: 'shadow-purple-700/50',
      hoverBorder: 'hover:border-purple-700/50',
      from: 'from-purple-900/50',
      to: 'to-purple-800/30',
      icon: 'text-purple-500',
    },
    green: {
      border: 'border-green-700/40',
      shadow: 'shadow-green-700/50',
      hoverBorder: 'hover:border-green-700/50',
      from: 'from-green-900/50',
      to: 'to-green-800/30',
      icon: 'text-green-500',
    },
    blue: {
      border: 'border-blue-700/40',
      shadow: 'shadow-blue-700/50',
      hoverBorder: 'hover:border-blue-700/50',
      from: 'from-blue-900/50',
      to: 'to-blue-800/30',
      icon: 'text-blue-500',
    },
    yellow: {
      border: 'border-yellow-700/40',
      shadow: 'shadow-yellow-700/50',
      hoverBorder: 'hover:border-yellow-700/50',
      from: 'from-yellow-900/50',
      to: 'to-yellow-800/30',
      icon: 'text-yellow-500',
    },
    red: {
      border: 'border-red-700/40',
      shadow: 'shadow-red-700/50',
      hoverBorder: 'hover:border-red-700/50',
      from: 'from-red-900/50',
      to: 'to-red-800/30',
      icon: 'text-red-500',
    },
  };

  const renderContent = () => {
    switch(tab) {
      case 'perfil': 
        return <PerfilContent perfil={perfil} handleChange={handleChange} />;
      case 'notificacoes': 
        return <NotificacoesContent notificacoes={notificacoes} setNotificacoes={setNotificacoes} />;
      case 'integracoes': 
        return <IntegracoesContent integracoes={integracoes} setIntegracoes={setIntegracoes} modalIntegracao={modalIntegracao} setModalIntegracao={setModalIntegracao} />;
      case 'faturamento': 
        return <FaturamentoContent plano={plano} faturas={faturas} />;
      case 'seguranca': 
        return <SegurancaContent senha={senha} setSenha={setSenha} modal2FA={modal2FA} setModal2FA={setModal2FA} modalExcluir={modalExcluir} setModalExcluir={setModalExcluir} />;
      default: 
        return <PerfilContent perfil={perfil} handleChange={handleChange} />;
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-[#09090b] p-3 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Configurações</h1>
            <p className="text-gray-400 text-sm sm:text-base">Gerencie sua conta e integrações</p>
          </div>
          <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white px-4 sm:px-6 py-2 rounded font-semibold h-10 sm:h-auto">Salvar Alterações</Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
          {navItems.map(item => {
            const colors = colorClasses[item.color as keyof typeof colorClasses] || colorClasses.purple;
            return (
              <Card 
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`cursor-pointer transition-all duration-300 ${tab === item.id ? `${colors.border} scale-105 shadow-lg ${colors.shadow}` : `border-gray-700 ${colors.hoverBorder}`} bg-gradient-to-br ${colors.from} ${colors.to} border-2`}
              >
                <CardHeader className="flex flex-row items-center gap-4 space-y-0 p-4">
                  <item.icon className={`w-8 h-8 transition-colors ${tab === item.id ? colors.icon : 'text-gray-400'}`} />
                  <div>
                    <CardTitle className="text-md font-bold text-white">{item.title}</CardTitle>
                    <p className="text-xs text-gray-400">{item.description}</p>
                  </div>
                </CardHeader>
              </Card>
            )
          })}
        </div>
        
        <div>{renderContent()}</div>
      </div>
    </div>
  );
}

const PerfilContent = ({ perfil, handleChange }: { perfil: Perfil, handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-3 sm:p-6 border border-purple-700/40 mt-4">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2 flex items-center gap-2">👤 Informações Pessoais</h2>
      <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Atualize suas informações básicas</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div>
          <label className="block text-gray-300 mb-1 font-medium">Nome</label>
          <Input name="nome" value={perfil.nome} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
        </div>
        <div>
          <label className="block text-gray-300 mb-1 font-medium">Sobrenome</label>
          <Input name="sobrenome" value={perfil.sobrenome} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1 font-medium">Email</label>
        <Input name="email" value={perfil.email} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1 font-medium">Empresa</label>
        <Input name="empresa" value={perfil.empresa} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
      </div>
      <div className="mb-4">
        <label className="block text-gray-300 mb-1 font-medium">Telefone</label>
        <Input name="telefone" value={perfil.telefone} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
      </div>
      <div className="mb-2">
        <label className="block text-gray-300 mb-1 font-medium">Fuso Horário</label>
        <Input name="fuso" value={perfil.fuso} onChange={handleChange} className="bg-[#1f2937] border border-gray-700 text-white" />
      </div>
    </div>
  );
};

const NotificacoesContent = ({ notificacoes, setNotificacoes }: { notificacoes: Notificacoes, setNotificacoes: React.Dispatch<React.SetStateAction<Notificacoes>> }) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-3 sm:p-6 border border-purple-700/40 mt-4">
      <h2 className="text-lg sm:text-xl font-bold text-white mb-2">Notificações</h2>
      <p className="text-gray-400 text-sm sm:text-base mb-4 sm:mb-6">Gerencie como deseja ser avisado</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">E-mail</span>
          <Switch checked={notificacoes.email} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, email: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">WhatsApp</span>
          <Switch checked={notificacoes.whatsapp} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, whatsapp: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Push</span>
          <Switch checked={notificacoes.push} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, push: v }))} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">SMS</span>
          <Switch checked={notificacoes.sms} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, sms: v }))} />
        </div>
      </div>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-2">Alertas</span>
        <div className="flex items-center gap-4 mb-2">
          <Switch checked={notificacoes.clientes} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, clientes: v }))} />
          <span className="text-gray-300">Novos clientes</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Switch checked={notificacoes.cobrancas} onCheckedChange={v => setNotificacoes((n: Notificacoes) => ({ ...n, cobrancas: v }))} />
          <span className="text-gray-300">Cobranças</span>
        </div>
        <div className="flex items-center gap-4 mb-2">
          <Switch checked={notificacoes.promocoes} onCheckedChange={v => setNotificacoes((n: any) => ({ ...n, promocoes: v }))} />
          <span className="text-gray-300">Promoções</span>
        </div>
      </div>
      <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white mt-4">Salvar Preferências</Button>
    </div>
  );
};

const IntegracoesContent = ({ integracoes, setIntegracoes, modalIntegracao, setModalIntegracao }: { integracoes: any, setIntegracoes: any, modalIntegracao: string | null, setModalIntegracao: any }) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/40 mt-4">
      <h2 className="text-xl font-bold text-white mb-2">Integrações</h2>
      <p className="text-gray-400 mb-6">Conecte com outros sistemas</p>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-gray-300">WhatsApp</span>
          <Button size="sm" className={integracoes.whatsapp ? 'bg-green-600' : 'bg-[#1f2937] text-white'} onClick={() => setModalIntegracao('whatsapp')}>{integracoes.whatsapp ? 'Desconectar' : 'Conectar'}</Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Google Calendar</span>
          <Button size="sm" className={integracoes.google ? 'bg-green-600' : 'bg-[#1f2937] text-white'} onClick={() => setModalIntegracao('google')}>{integracoes.google ? 'Desconectar' : 'Conectar'}</Button>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-gray-300">Zapier</span>
          <Button size="sm" className={integracoes.zapier ? 'bg-green-600' : 'bg-[#1f2937] text-white'} onClick={() => setModalIntegracao('zapier')}>{integracoes.zapier ? 'Desconectar' : 'Conectar'}</Button>
        </div>
      </div>
      <DialogWrapper 
        title="Configurar Integração"
        description="Insira as credenciais necessárias para a integração"
        className="bg-[#1f2937] border border-purple-700 text-white max-w-md"
        open={!!modalIntegracao}
        onOpenChange={(open) => !open && setModalIntegracao(null)}
      >
        <div className="py-4">
          <Input 
            placeholder="Token/API Key" 
            className="bg-[#1f2937] border border-gray-700 text-white" 
            aria-label="Token ou chave de API para a integração"
          />
        </div>
        <DialogFooter>
          <Button 
            className="bg-[#1f2937] text-white hover:bg-gray-600" 
            onClick={() => setModalIntegracao(null)}
            aria-label="Cancelar e fechar o diálogo"
          >
            Cancelar
          </Button>
          <Button 
            className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" 
            onClick={() => { 
              setIntegracoes((i: any) => ({ ...i, [modalIntegracao!]: !i[modalIntegracao!] })); 
              setModalIntegracao(null); 
            }}
            aria-label={`${integracoes[modalIntegracao!] ? 'Desconectar' : 'Conectar'} a integração`}
          >
            {integracoes[modalIntegracao!] ? 'Desconectar' : 'Conectar'}
          </Button>
        </DialogFooter>
      </DialogWrapper>
    </div>
  );
};

const FaturamentoContent = ({ plano, faturas }: { plano: string, faturas: any[] }) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/40 mt-4">
      <h2 className="text-xl font-bold text-white mb-2">Faturamento</h2>
      <p className="text-gray-400 mb-6">Gerencie seu plano e pagamentos</p>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-1">Plano Atual</span>
        <div className="flex items-center gap-2">
          <span className="text-[#7e22ce] font-bold">{plano}</span>
          <Button size="sm" variant="outline" className="border-[#7e22ce] text-[#7e22ce]">Alterar Plano</Button>
        </div>
      </div>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-1">Histórico de Faturas</span>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-gray-400">
                <th className="px-2 py-1 text-left">Data</th>
                <th className="px-2 py-1 text-left">Valor</th>
                <th className="px-2 py-1 text-left">Status</th>
                <th className="px-2 py-1 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map(f => (
                <tr key={f.id} className="border-b border-gray-700/20">
                  <td className="px-2 py-1 text-white">{f.data}</td>
                  <td className="px-2 py-1 text-white">{f.valor}</td>
                  <td className="px-2 py-1 text-white">{f.status}</td>
                  <td className="px-2 py-1"><Button size="sm" variant="outline" className="border-blue-600 text-blue-600">Download</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white">Atualizar Dados de Pagamento</Button>
    </div>
  );
};

const SegurancaContent = ({ senha, setSenha, modal2FA, setModal2FA, modalExcluir, setModalExcluir }: { senha: any, setSenha: any, modal2FA: boolean, setModal2FA: any, modalExcluir: boolean, setModalExcluir: any }) => {
  return (
    <div className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 rounded-xl p-6 border border-purple-700/40 mt-4">
      <h2 className="text-xl font-bold text-white mb-2">Segurança</h2>
      <p className="text-gray-400 mb-6">Proteja sua conta</p>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-1">Alterar Senha</span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-2">
          <Input type="password" placeholder="Senha Atual" value={senha.atual} onChange={e => setSenha((s: any) => ({ ...s, atual: e.target.value }))} className="bg-[#1f2937] border border-gray-700 text-white" />
          <Input type="password" placeholder="Nova Senha" value={senha.nova} onChange={e => setSenha((s: any) => ({ ...s, nova: e.target.value }))} className="bg-[#1f2937] border border-gray-700 text-white" />
          <Input type="password" placeholder="Confirmar Nova Senha" value={senha.confirmar} onChange={e => setSenha((s: any) => ({ ...s, confirmar: e.target.value }))} className="bg-[#1f2937] border border-gray-700 text-white" />
        </div>
        <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white">Salvar Nova Senha</Button>
      </div>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-1">Autenticação 2FA</span>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setModal2FA(true)}>Ativar 2FA</Button>
      </div>
      <div className="mb-4">
        <span className="block text-gray-300 font-medium mb-1">Exportar Dados</span>
        <Button className="bg-[#1f2937] text-white">Exportar</Button>
      </div>
      <div className="mb-4">
        <span className="block text-red-600 font-medium mb-1">Excluir Conta</span>
        <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={() => setModalExcluir(true)}>Excluir Conta</Button>
      </div>
      {/* Modal 2FA */}
      <DialogWrapper
        title="Ativar Autenticação 2FA"
        description="Escaneie o QR Code no seu aplicativo autenticador para configurar a verificação em duas etapas."
        className="bg-[#232a36] border border-purple-700 text-white max-w-md"
        open={modal2FA}
        onOpenChange={setModal2FA}
      >
        <div className="py-4 flex flex-col items-center">
          <div className="bg-white p-4 mb-4">
            {/* Espaço para o QR Code */}
            <div className="w-48 h-48 bg-gray-200 flex items-center justify-center text-gray-500">
              [QR Code]
            </div>
          </div>
          <p className="text-sm text-gray-300 mb-4 text-center">
            Escaneie este código QR com seu aplicativo autenticador ou insira manualmente o código abaixo:
          </p>
          <div className="bg-[#1f2937] p-3 rounded-md font-mono text-sm mb-4">
            ABC1 DEF2 GHI3 JKL4
          </div>
        </div>
      </DialogWrapper>
      {/* Modal Excluir Conta */}
      <DialogWrapper
        title="Excluir Conta"
        description="Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão permanentemente removidos."
        className="bg-[#232a36] border border-red-700 text-white max-w-md"
        open={modalExcluir}
        onOpenChange={setModalExcluir}
      >
        <div className="py-4">
          <p className="text-red-400 mb-4">⚠️ Esta ação não pode ser desfeita. Todos os seus dados serão permanentemente removidos.</p>
          <div className="mb-4">
            <label htmlFor="confirm-delete" className="block text-gray-300 mb-2">
              Digite "EXCLUIR" para confirmar:
            </label>
            <Input
              id="confirm-delete"
              placeholder="Digite EXCLUIR"
              className="bg-[#1f2937] border border-gray-700 text-white"
              aria-label="Confirmação para excluir a conta"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              className="bg-[#1f2937] text-white hover:bg-gray-600"
              onClick={() => setModalExcluir(false)}
              aria-label="Cancelar e manter a conta"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={() => {
                // Lógica para excluir a conta
                setModalExcluir(false);
              }}
              aria-label="Confirmar exclusão da conta"
            >
              Sim, Excluir Minha Conta
            </Button>
          </div>
        </div>
      </DialogWrapper>
    </div>
  );
};
