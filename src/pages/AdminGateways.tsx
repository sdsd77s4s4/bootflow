import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Server, Settings, Zap, Edit, Trash2, BarChart3, CheckCircle2, XCircle, CreditCard, TrendingUp, Cog, Play, Activity, Plus } from 'lucide-react';

interface Gateway {
  id: number;
  nome: string;
  tipo: string;
  status: 'Ativo' | 'Inativo';
  configurado: boolean;
  taxa: string;
  volume: string;
  ultimaTransacao: string;
  apiKey?: string;
  secret?: string;
  webhook?: string;
}

const gatewaysMock: Gateway[] = [
  { id: 1, nome: 'PIX', tipo: 'Pix', status: 'Ativo', configurado: true, taxa: '0.99%', volume: 'R$ 45.678,90', ultimaTransacao: '15/01/2025', apiKey: '', secret: '', webhook: '' },
  { id: 2, nome: 'Stripe', tipo: 'Cartao', status: 'Ativo', configurado: true, taxa: '2.99% + R$ 0,30', volume: 'R$ 23.456,78', ultimaTransacao: '15/01/2025', apiKey: '', secret: '', webhook: '' },
  { id: 3, nome: 'Mercado Pago', tipo: 'Cartao', status: 'Ativo', configurado: true, taxa: '1.99% + R$ 0,60', volume: 'R$ 67.890,12', ultimaTransacao: '15/01/2025', apiKey: '', secret: '', webhook: '' },
  { id: 4, nome: 'Infinitepay', tipo: 'Cartao', status: 'Ativo', configurado: true, taxa: '2.49% + R$ 0,40', volume: 'R$ 34.567,89', ultimaTransacao: '15/01/2025', apiKey: '', secret: '', webhook: '' },
  { id: 5, nome: 'OpenPix', tipo: 'Pix', status: 'Inativo', configurado: false, taxa: '0.89%', volume: 'R$ 0,00', ultimaTransacao: '-', apiKey: '', secret: '', webhook: '' },
  { id: 6, nome: 'PicPay', tipo: 'Picpay', status: 'Ativo', configurado: true, taxa: '1.49% + R$ 0,50', volume: 'R$ 28.901,45', ultimaTransacao: '15/01/2025', apiKey: '', secret: '', webhook: '' },
  { id: 7, nome: 'Asaas', tipo: 'Boleto', status: 'Ativo', configurado: true, taxa: '1.99% + R$ 2,00', volume: 'R$ 12.345,67', ultimaTransacao: '14/01/2025', apiKey: '', secret: '', webhook: '' },
];

export default function AdminGateways() {
  const [gateways, setGateways] = useState<Gateway[]>(gatewaysMock);
  const [modal, setModal] = useState<{ type: null | 'testar' | 'editar' | 'configurar' | 'desativar', gateway?: Gateway }>({ type: null });
  const [form, setForm] = useState({ nome: '', tipo: '', taxa: '' });
  const [config, setConfig] = useState({ apiKey: '', secret: '', webhook: '' });
  const [testValue, setTestValue] = useState('');

  // Cards resumo (zerados para modo real)
  const total = 0;
  const ativos = 0;
  const configurados = 0;
  const volumeMensal = 'R$ 0,00';
  const transacoes = 0;

  // Funções dos modais
  const handleTestar = () => {
    setTestValue('');
    setModal({ type: null });
  };
  const handleEditar = () => {
    if (!modal.gateway) return;
    setGateways(gateways.map(g => g.id === modal.gateway!.id ? { ...g, nome: form.nome, tipo: form.tipo, taxa: form.taxa } : g));
    setModal({ type: null });
  };
  const handleConfigurar = () => {
    if (!modal.gateway) return;
    // Save credentials into the gateway object
    setGateways(prev => prev.map(g => g.id === modal.gateway!.id ? {
      ...g,
      configurado: true,
      status: 'Ativo',
      apiKey: config.apiKey || '',
      secret: config.secret || '',
      webhook: config.webhook || ''
    } : g));

    // persist to localStorage
    try {
      const raw = localStorage.getItem('gateways_credentials');
      const map = raw ? JSON.parse(raw) : {};
      map[modal.gateway!.id] = { apiKey: config.apiKey || '', secret: config.secret || '', webhook: config.webhook || '', configurado: true };
      localStorage.setItem('gateways_credentials', JSON.stringify(map));
    } catch (err) {
      console.error('Erro ao salvar credenciais dos gateways:', err);
    }

    setConfig({ apiKey: '', secret: '', webhook: '' });
    setModal({ type: null });
  };
  const handleDesativar = () => {
    if (!modal.gateway) return;
    setGateways(gateways.map(g => g.id === modal.gateway!.id ? { ...g, status: 'Inativo' } : g));
    setModal({ type: null });
  };

  // Load saved credentials from localStorage (mapping gatewayId -> creds)
  useEffect(() => {
    try {
      const raw = localStorage.getItem('gateways_credentials');
      if (raw) {
        const map = JSON.parse(raw) as Record<string, { apiKey?: string; secret?: string; webhook?: string; configurado?: boolean }>;
        if (map) {
          setGateways(prev => prev.map(g => {
            const saved = map[g.id];
            if (saved) {
              return { ...g, apiKey: saved.apiKey || '', secret: saved.secret || '', webhook: saved.webhook || '', configurado: saved.configurado ?? g.configurado };
            }
            return g;
          }));
        }
      }
    } catch (err) {
      console.error('Erro ao carregar credenciais dos gateways:', err);
    }
  }, []);

  return (
    <div className="p-6 min-h-screen bg-[#09090b]">
      <div className="flex items-center gap-3 mb-2">
        <Server className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-bold text-green-400">Gateways de Pagamento</h1>
      </div>
      <p className="text-gray-400 mb-6">Configure e gerencie seus gateways de pagamento</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{total}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Ativos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{ativos}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Configurados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{configurados}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Volume Mensal</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{volumeMensal}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-pink-900/50 to-pink-800/30 border border-pink-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Transações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-pink-400">{transacoes}</div>
          </CardContent>
        </Card>
      </div>
      {/* Tabela de gateways */}
      <Card className="bg-[#181e29] border border-purple-700/40">
        <CardHeader>
          <CardTitle className="text-white text-lg">Gateways Configurados</CardTitle>
          <p className="text-gray-400 text-sm">Gerencie seus métodos de pagamento</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Gateway</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Taxa</TableHead>
                <TableHead>Volume Mensal</TableHead>
                <TableHead>Última Transação</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {gateways.map(g => (
                <TableRow key={g.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white font-bold">
                        <CheckCircle2 className={g.configurado ? 'text-green-400' : 'text-gray-400'} />
                      </div>
                      <div>
                        <div className="font-semibold text-white">{g.nome}</div>
                        <div className="text-xs text-gray-400">{g.configurado ? 'Configurado' : 'Não configurado'}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-300">{g.tipo}</TableCell>
                  <TableCell>
                    {g.status === 'Ativo' && <Badge className="bg-green-700 text-green-200">Ativo</Badge>}
                    {g.status === 'Inativo' && <Badge className="bg-gray-700 text-gray-300">Inativo</Badge>}
                  </TableCell>
                  <TableCell className="text-gray-300">{g.taxa}</TableCell>
                  <TableCell className="font-bold text-white">{g.volume}</TableCell>
                  <TableCell className="text-gray-300">{g.ultimaTransacao}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      {g.configurado ? (
                        <>
                          <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => { setModal({ type: 'testar', gateway: g }); setTestValue(''); }}>
                            <Play className="w-4 h-4 mr-1" /> Testar
                          </Button>
                          <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-400" onClick={() => { setModal({ type: 'editar', gateway: g }); setForm({ nome: g.nome, tipo: g.tipo, taxa: g.taxa }); }}>
                            <Cog className="w-4 h-4 mr-1" /> Editar
                          </Button>
                          <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => setModal({ type: 'desativar', gateway: g })}>
                            <XCircle className="w-4 h-4 mr-1" /> Desativar
                          </Button>
                        </>
                      ) : (
                        <Button size="sm" className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={() => { setModal({ type: 'configurar', gateway: g }); setConfig({ apiKey: g.apiKey || '', secret: g.secret || '', webhook: g.webhook || '' }); }}>
                          Configurar
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      {/* Modal Testar Gateway */}
      <Dialog open={modal.type === 'testar'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Gateway: {modal.gateway?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p>Simule uma transação de teste para validar a integração do gateway.</p>
            <Input placeholder="Valor da transação" className="bg-gray-900 border border-gray-700 text-white" type="number" value={testValue} onChange={e => setTestValue(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ type: null })} className="bg-gray-700 text-white">Cancelar</Button>
            <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleTestar}>Testar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Editar Gateway */}
      <Dialog open={modal.type === 'editar'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Gateway: {modal.gateway?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Nome" className="bg-gray-900 border border-gray-700 text-white" value={form.nome} onChange={e => setForm({ ...form, nome: e.target.value })} />
            <Input placeholder="Tipo" className="bg-gray-900 border border-gray-700 text-white" value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value })} />
            <Input placeholder="Taxa" className="bg-gray-900 border border-gray-700 text-white" value={form.taxa} onChange={e => setForm({ ...form, taxa: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ type: null })} className="bg-gray-700 text-white">Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleEditar}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Configurar Gateway */}
      <Dialog open={modal.type === 'configurar'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Configurar Gateway: {modal.gateway?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <Input placeholder="Chave/API Key" className="bg-gray-900 border border-gray-700 text-white" value={config.apiKey} onChange={e => setConfig({ ...config, apiKey: e.target.value })} />
            <Input placeholder="Secret/Token" className="bg-gray-900 border border-gray-700 text-white" value={config.secret} onChange={e => setConfig({ ...config, secret: e.target.value })} />
            <Input placeholder="Webhook URL" className="bg-gray-900 border border-gray-700 text-white" value={config.webhook} onChange={e => setConfig({ ...config, webhook: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ type: null })} className="bg-gray-700 text-white">Cancelar</Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleConfigurar}>Salvar Configuração</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Desativar Gateway */}
      <Dialog open={modal.type === 'desativar'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Desativar Gateway: {modal.gateway?.nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p>Tem certeza que deseja desativar este gateway? As transações por ele serão bloqueadas.</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModal({ type: null })} className="bg-gray-700 text-white">Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleDesativar}>Desativar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 