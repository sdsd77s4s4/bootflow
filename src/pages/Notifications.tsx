import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogWrapper } from '@/components/ui/DialogWrapper';
import { Plus, Send, MessageSquare, CheckCircle2, XCircle, TrendingUp, Users, Upload, X, Image as ImageIcon } from 'lucide-react';
import { useClientes } from '@/hooks/useClientes';
import { useRevendas } from '@/hooks/useRevendas';
import { toast } from 'sonner';
import { useWhatsAppStatus } from '@/contexts/WhatsAppStatusContext';

// Definindo os tipos de status como constantes para melhor tipagem
export const TEMPLATE_STATUS = {
  ATIVO: 'Ativo',
  INATIVO: 'Inativo'
} as const;

export const HISTORICO_STATUS = {
  ENTREGUE: 'Entregue',
  LIDO: 'Lido',
  FALHA: 'Falha'
} as const;

type TemplateStatus = typeof TEMPLATE_STATUS[keyof typeof TEMPLATE_STATUS];
type HistoricoStatus = typeof HISTORICO_STATUS[keyof typeof HISTORICO_STATUS];

type Template = {
  id: number;
  nome: string;
  texto: string;
  variaveis: string[];
  status: TemplateStatus;
  envios: number;
  taxa: number;
  imagem?: string; // URL ou base64 da imagem
};

// Removendo a declaração duplicada de HistoricoStatus

type HistoricoItem = {
  id: number;
  nome: string;
  template: string;
  status: HistoricoStatus;
  data: string;
};

const templatesMock: Template[] = [
  { 
    id: 1, 
    nome: 'Confirmação de Agendamento', 
    texto: 'Olá {nome}, seu agendamento para {servico} foi confirmado para {data} às {hora}. Aguardamos você!', 
    variaveis: ['nome', 'servico', 'data', 'hora'], 
    status: 'Ativo', 
    envios: 1247, 
    taxa: 98.5 
  },
  { 
    id: 2, 
    nome: 'Lembrete de Agendamento', 
    texto: 'Oi {nome}! Lembrete: você tem um agendamento amanhã às {hora} para {servico}. Confirme sua presença!', 
    variaveis: ['nome', 'servico', 'hora'], 
    status: 'Ativo', 
    envios: 892, 
    taxa: 97.2 
  },
  { 
    id: 3, 
    nome: 'Cobrança Pendente', 
    texto: 'Olá {nome}, você tem uma cobrança pendente de {valor} para {servico}. Pague via PIX: {pix}. Obrigado!', 
    variaveis: ['nome', 'valor', 'servico', 'pix'], 
    status: 'Ativo', 
    envios: 445, 
    taxa: 96.8 
  },
  { 
    id: 4, 
    nome: 'Promoção Especial', 
    texto: 'Olá {nome}, temos uma promoção especial para você! {promocao} com {desconto}% de desconto. Válido até {validade}.', 
    variaveis: ['nome', 'promocao', 'desconto', 'validade'], 
    status: 'Inativo', 
    envios: 234, 
    taxa: 95.1 
  },
  { 
    id: 5, 
    nome: 'Aniversário', 
    texto: 'Parabéns {nome}! Que seu dia seja especial! Como presente, você tem {desconto}% de desconto em qualquer serviço. Aproveite!', 
    variaveis: ['nome', 'desconto'], 
    status: 'Ativo', 
    envios: 67, 
    taxa: 99.2 
  },
];

const historicoMock: HistoricoItem[] = [
  { id: 1, nome: 'Maria Silva', template: 'Confirmação de Agendamento', status: 'Entregue', data: '15/01/2025, 07:30' },
  { id: 2, nome: 'João Santos', template: 'Lembrete de Agendamento', status: 'Lido', data: '15/01/2025, 06:15' },
  { id: 3, nome: 'Ana Costa', template: 'Cobrança Pendente', status: 'Entregue', data: '15/01/2025, 05:45' },
  { id: 4, nome: 'Pedro Lima', template: 'Promoção Especial', status: 'Falha', data: '14/01/2025, 18:00' },
];

type FormData = {
  nome: string;
  texto: string;
  status: TemplateStatus;
  variaveis: string;
  imagem?: string; // URL ou base64 da imagem
};

type Destinatario = {
  id: string | number;
  nome: string;
  telefone: string;
  tipo?: 'cliente' | 'revenda';
};

// Definindo tipos para cliente e revenda para melhor tipagem
interface Cliente {
  id: string | number;
  name: string;
  real_name?: string;
  email?: string;
  status?: string;
}

interface Revenda {
  id: string | number;
  username: string;
  personal_name?: string;
  status?: string;
}

export default function Notifications() {
  const [templates, setTemplates] = useState<Template[]>(templatesMock);
  const [historico, setHistorico] = useState<HistoricoItem[]>(historicoMock);
  const [modal, setModal] = useState<{ type: null | 'novo' | 'editar' | 'enviar', template?: Template }>({ type: null });
  const [form, setForm] = useState<FormData>({ 
    nome: '', 
    texto: '', 
    status: 'Ativo',
    variaveis: '',
    imagem: undefined
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchDestValue, setSearchDestValue] = useState('');
  const { clientes = [] } = useClientes();
  const { revendas = [] } = useRevendas();
  const [selectedDest, setSelectedDest] = useState<Destinatario | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const { isConnected, connectionStatus } = useWhatsAppStatus();
  
  const variaveisSugeridas = ['nome', 'servico', 'data', 'hora', 'valor', 'desconto', 'validade', 'pix', 'promocao'] as const;

  // Função para lidar com upload de imagem
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor, selecione apenas arquivos de imagem');
        return;
      }
      
      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('A imagem deve ter no máximo 5MB');
        return;
      }
      
      // Converter para base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setForm({ ...form, imagem: base64String });
        setImagePreview(base64String);
      };
      reader.onerror = () => {
        toast.error('Erro ao carregar a imagem');
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para remover imagem
  const handleRemoveImage = () => {
    setForm({ ...form, imagem: undefined });
    setImagePreview(null);
  };

  // Função para renderizar o modal de novo template
  const renderNovoTemplateModal = () => (
    <div className="space-y-4 py-2">
      <div>
        <label htmlFor="template-name" className="sr-only">Nome do Template</label>
        <Input 
          id="template-name"
          placeholder="Nome do Template" 
          className="bg-gray-900 border border-gray-700 text-white rounded-lg w-full mb-3" 
          value={form.nome} 
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
          aria-label="Nome do Template"
        />
      </div>
      
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm text-gray-300">Variáveis disponíveis:</span>
          <span className="text-xs text-gray-500">Clique para inserir</span>
        </div>
        <div className="flex flex-wrap gap-2 mb-2">
          {variaveisSugeridas.map((v) => (
            <button
              key={v}
              type="button"
              className="bg-purple-900/60 text-purple-200 rounded-full px-3 py-1 text-xs font-semibold border border-purple-700 hover:bg-purple-800 hover:text-white transition"
              onClick={() => {
                const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
                if (textarea) {
                  const start = textarea.selectionStart;
                  const end = textarea.selectionEnd;
                  const before = form.texto.substring(0, start);
                  const after = form.texto.substring(end);
                  const insert = `{${v}}`;
                  setForm({ ...form, texto: before + insert + after });
                  setTimeout(() => {
                    textarea.focus();
                    textarea.selectionStart = textarea.selectionEnd = start + insert.length;
                  }, 0);
                } else {
                  setForm({ ...form, texto: form.texto + ` {${v}}` });
                }
              }}
              aria-label={`Inserir variável ${v}`}
            >
              {'{'}{v}{'}'}
            </button>
          ))}
        </div>
        
        <label htmlFor="template-textarea" className="sr-only">Texto da Mensagem</label>
        <textarea 
          id="template-textarea" 
          placeholder="Digite o texto da mensagem. Use {variaveis} para personalização." 
          rows={3} 
          className="bg-gray-900 border border-gray-700 text-white rounded-lg w-full p-2" 
          value={form.texto} 
          onChange={(e) => setForm({ ...form, texto: e.target.value })}
          aria-label="Texto da Mensagem"
        />
        
        <div className="mt-2">
          <span className="text-xs text-gray-400">Variáveis detectadas: </span>
          {Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))).length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-1">
              {Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))).map((v) => (
                <span key={v} className="bg-purple-900/60 text-purple-200 rounded-full px-3 py-1 text-xs font-semibold border border-purple-700">
                  {'{'}{v}{'}'}
                </span>
              ))}
            </div>
          ) : (
            <span className="text-xs text-gray-500">Nenhuma variável detectada. Use {'{nome}'} por exemplo.</span>
          )}
        </div>
      </div>
      
      <div className="bg-[#181825] border border-purple-800 rounded-lg p-3 text-sm text-gray-200">
        <div className="font-semibold text-purple-300 mb-1">Visualização:</div>
        <div className="whitespace-pre-line">{form.texto || 'Sua mensagem aparecerá aqui...'}</div>
      </div>
      
      <div>
        <label htmlFor="template-status" className="block text-sm font-medium text-gray-300 mb-1">Status do Template</label>
        <select 
          id="template-status"
          className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-full" 
          value={form.status} 
          onChange={(e) => setForm({ ...form, status: e.target.value as TemplateStatus })}
          aria-label="Status do Template"
        >
          <option value="Ativo">Ativo</option>
          <option value="Inativo">Inativo</option>
        </select>
      </div>
      
      <DialogFooter className="mt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={() => setModal({ type: null })}
          className="text-white border-gray-600 hover:bg-gray-700"
        >
          Cancelar
        </Button>
        <Button 
          type="button" 
          onClick={() => {
            if (form.nome && form.texto) {
              const newTemplate: Template = {
                id: templates.length + 1,
                nome: form.nome,
                texto: form.texto,
                variaveis: Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))),
                status: form.status,
                envios: 0,
                taxa: 0
              };
              setTemplates([...templates, newTemplate]);
              setForm({ nome: '', texto: '', status: 'Ativo', variaveis: '' });
              setModal({ type: null });
              toast.success('Template criado com sucesso!');
            } else {
              toast.error('Preencha todos os campos obrigatórios');
            }
          }}
          className="bg-purple-600 hover:bg-purple-700 text-white"
        >
          Salvar Template
        </Button>
      </DialogFooter>
    </div>
  );

  // Cards resumo
  const enviados = historico.length;
  const entregues = historico.filter(h => h.status === 'Entregue').length;
  const lidos = historico.filter(h => h.status === 'Lido').length;
  const falhas = historico.filter(h => h.status === 'Falha').length;
  const taxaEntrega = enviados ? ((entregues / enviados) * 100).toFixed(1) : '0.0';

  // Funções dos modais
  const handleNovo = () => {
    if (form.nome && form.texto) {
      const newTemplate: Template = {
        id: templates.length + 1,
        nome: form.nome,
        texto: form.texto,
        variaveis: Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))),
        status: form.status,
        envios: 0,
        taxa: 0,
        imagem: form.imagem
      };
      setTemplates([...templates, newTemplate]);
      setForm({ nome: '', texto: '', status: 'Ativo', variaveis: '', imagem: undefined });
      setImagePreview(null);
      setModal({ type: null });
      toast.success('Template criado com sucesso!');
    } else {
      toast.error('Preencha todos os campos obrigatórios');
    }
  };

  const handleEditar = () => {
    if (modal.template && form.nome && form.texto) {
      setTemplates(templates.map(t => 
        t.id === modal.template?.id 
          ? { 
              ...t, 
              nome: form.nome,
              texto: form.texto,
              variaveis: Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))),
              status: form.status,
              imagem: form.imagem
            } 
          : t
      ));
      setModal({ type: null });
      setForm({ nome: '', texto: '', status: 'Ativo', variaveis: '', imagem: undefined });
      setImagePreview(null);
      toast.success('Template atualizado com sucesso!');
    } else {
      toast.error('Preencha todos os campos obrigatórios');
    }
  };

  const handleEnviar = () => {
    if (modal.template && selectedDest) {
      setHistorico([
        { 
          id: historico.length + 1, 
          nome: selectedDest.nome, 
          template: modal.template.nome, 
          status: 'Entregue', 
          data: new Date().toLocaleString('pt-BR') 
        }, 
        ...historico
      ]);
      setModal({ type: null });
      toast.success('Mensagem enviada com sucesso!');
    } else {
      toast.error('Selecione um destinatário');
    }
  };

  const searchDest = typeof selectedDest === 'string' ? selectedDest : '';

  return (
    <div className="p-6 min-h-screen bg-[#09090b]">
      <div className="flex items-center gap-3 mb-2">
        <MessageSquare className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-bold text-purple-300">Notificações WhatsApp</h1>
      </div>
      <p className="text-gray-400 mb-6">Gerencie templates e envie notificações para seus clientes</p>
      
      <div className="flex justify-end gap-2 mb-4">
        <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={() => setModal({ type: 'novo' })}><Plus className="w-4 h-4 mr-2" /> Novo Template</Button>
        <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => { setModal({ type: 'enviar' }); setSelectedDest(null); setSelectedTemplate(templates[0]); }}><Send className="w-4 h-4 mr-2" /> Enviar Notificação</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Total Enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{enviados}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Entregues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-400">{entregues}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Lidos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{lidos}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-red-900/50 to-red-800/30 border border-red-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Falhas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{falhas}</div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-300">Taxa Entrega</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{taxaEntrega}%</div>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Templates */}
        <Card className="bg-[#1f2937] border border-purple-700/40">
          <CardHeader>
            <CardTitle className="text-white text-lg">Templates de Mensagem</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {templates.map(t => (
              <div key={t.id} className="bg-[#232a36] rounded-xl p-4 border border-purple-700/30 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{t.nome}</div>
                  <Badge className={t.status === 'Ativo' ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-300'}>{t.status}</Badge>
                </div>
                <div className="text-gray-300 text-sm">{t.texto}</div>
                <div className="flex flex-wrap gap-2 mt-1">
                  {t.variaveis.map((v: string) => (
                    <span key={v} className="bg-gray-800 text-purple-300 rounded-full px-3 py-1 text-xs">{v}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                  <span>{t.envios} envios</span>
                  <span>{t.taxa}% entrega</span>
                </div>
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-400" onClick={() => { 
                    setModal({ type: 'editar', template: t }); 
                    setForm({ nome: t.nome, texto: t.texto, variaveis: t.variaveis.join(','), status: t.status, imagem: t.imagem }); 
                    setImagePreview(t.imagem || null);
                  }}>Editar</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        {/* Histórico */}
        <Card className="bg-[#1f2937] border border-purple-700/40">
          <CardHeader>
            <CardTitle className="text-white text-lg">Histórico de Envios</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {historico.map(h => (
              <div key={h.id} className="bg-[#232a36] rounded-xl p-4 border border-purple-700/30 flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-white">{h.nome}</div>
                  <Badge className={h.status === 'Entregue' ? 'bg-green-700 text-green-200' : h.status === 'Lido' ? 'bg-blue-700 text-blue-200' : 'bg-red-700 text-red-200'}>{h.status}</Badge>
                </div>
                <div className="text-gray-300 text-xs">{h.template}</div>
                <div className="text-gray-400 text-xs">{h.data}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      {/* Modal Novo Template */}
      <Dialog open={modal.type === 'novo'} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setModal({ type: null });
          setForm({ nome: '', texto: '', status: 'Ativo', variaveis: '', imagem: undefined });
          setImagePreview(null);
        }
      }}>
        <DialogContent className="bg-gradient-to-br from-[#232a36] to-[#1f1930] border border-purple-700 text-white max-w-4xl w-full p-0 rounded-xl shadow-xl flex flex-col max-h-[90vh] overflow-y-auto scrollbar-hide">
          <div className="p-6 w-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Novo Template</h2>
            </div>
            <div className="space-y-4">
            <div>
              <label htmlFor="template-name" className="sr-only">Nome do Template</label>
              <Input 
                id="template-name"
                placeholder="Nome do Template" 
                className="bg-gray-900 border border-gray-700 text-white rounded-lg w-full mb-3" 
                value={form.nome} 
                onChange={e => setForm({ ...form, nome: e.target.value })}
                aria-label="Nome do Template"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-300">Variáveis disponíveis:</span>
                <span className="text-xs text-gray-500">Clique para inserir</span>
              </div>
              <div className="flex flex-wrap gap-2 mb-2">
                {['nome', 'servico', 'data', 'hora', 'valor', 'pix', 'promocao', 'desconto', 'validade'].map(v => (
                  <button
                    key={v}
                    type="button"
                    className="bg-purple-900/60 text-purple-200 rounded-full px-3 py-1 text-xs font-semibold border border-purple-700 hover:bg-purple-800 hover:text-white transition"
                    onClick={() => {
                      const textarea = document.getElementById('template-textarea') as HTMLTextAreaElement;
                      if (textarea) {
                        const start = textarea.selectionStart;
                        const end = textarea.selectionEnd;
                        const before = form.texto.substring(0, start);
                        const after = form.texto.substring(end);
                        const insert = `{${v}}`;
                        setForm({ ...form, texto: before + insert + after });
                        setTimeout(() => {
                          textarea.focus();
                          textarea.selectionStart = textarea.selectionEnd = start + insert.length;
                        }, 0);
                      } else {
                        setForm({ ...form, texto: form.texto + ` {${v}}` });
                      }
                    }}
                    aria-label={`Inserir variável ${v}`}
                  >
                    {'{'}{v}{'}'}
                  </button>
                ))}
              </div>
              
              <label htmlFor="template-textarea" className="sr-only">Texto da Mensagem</label>
              <textarea 
                id="template-textarea" 
                placeholder="Digite o texto da mensagem. Use {variaveis} para personalização." 
                rows={3} 
                className="bg-gray-900 border border-gray-700 text-white rounded-lg w-full p-2" 
                value={form.texto} 
                onChange={e => setForm({ ...form, texto: e.target.value })}
                aria-label="Texto da Mensagem"
              />
              
              <div className="mt-2">
                <span className="text-xs text-gray-400">Variáveis detectadas: </span>
                {Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))).length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Array.from(new Set((form.texto.match(/\{(.*?)\}/g) || []).map(v => v.replace(/[{}]/g, '')))).map(v => (
                      <span key={v} className="bg-purple-900/60 text-purple-200 rounded-full px-3 py-1 text-xs font-semibold border border-purple-700">
                        {'{'}{v}{'}'}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-xs text-gray-500">Nenhuma variável detectada. Use {'{nome}'} por exemplo.</span>
                )}
              </div>
            </div>
            
            {/* Área de Upload de Imagem */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Imagem do Template (Opcional)</label>
              {imagePreview || form.imagem ? (
                <div className="relative">
                  <div className="relative w-full h-48 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview || form.imagem} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors"
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Clique no X para remover a imagem</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-600 transition-colors">
                  <input
                    type="file"
                    id="image-upload"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="text-purple-400 font-medium">Clique para fazer upload</span> ou arraste a imagem aqui
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                  </label>
                </div>
              )}
            </div>
            
            <div className="bg-[#181825] border border-purple-800 rounded-lg p-3 text-sm text-gray-200">
              <div className="font-semibold text-purple-300 mb-1">Visualização:</div>
              {imagePreview || form.imagem ? (
                <div className="mb-2">
                  <img 
                    src={imagePreview || form.imagem} 
                    alt="Preview" 
                    className="w-full max-h-48 object-contain rounded mb-2"
                  />
                </div>
              ) : null}
              <div className="whitespace-pre-line">{form.texto || 'Sua mensagem aparecerá aqui...'}</div>
            </div>
            
            <div>
              <label htmlFor="template-status" className="block text-sm font-medium text-gray-300 mb-1">Status do Template</label>
              <select 
                id="template-status"
                className="bg-gray-900 border border-gray-700 text-white rounded px-3 py-2 w-full" 
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value as TemplateStatus })}
                aria-label="Status do Template"
              >
                <option value={TEMPLATE_STATUS.ATIVO}>Ativo</option>
                <option value={TEMPLATE_STATUS.INATIVO}>Inativo</option>
              </select>
            </div>
            </div>
            
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="outline" onClick={() => setModal({ type: null })} className="bg-gray-700 text-white">
                Cancelar
              </Button>
              <Button 
                className="bg-purple-600 hover:bg-purple-700 text-white" 
                onClick={handleNovo}
                disabled={!form.nome || !form.texto}
              >
                Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Modal Editar Template */}
      <Dialog open={modal.type === 'editar'} onOpenChange={(isOpen) => {
        if (!isOpen) {
          setModal({ type: null });
          // Limpa o formulário ao fechar
          setForm({ 
            nome: '', 
            texto: '', 
            status: TEMPLATE_STATUS.ATIVO,
            variaveis: '',
            imagem: undefined
          });
          setImagePreview(null);
        }
      }}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Campo Nome do Template */}
            <div className="space-y-1">
              <label htmlFor="edit-nome" className="text-sm font-medium text-gray-300">
                Nome do Template <span className="text-red-500">*</span>
              </label>
              <Input 
                id="edit-nome"
                placeholder="Digite o nome do template" 
                className="bg-gray-900 border border-gray-700 text-white" 
                value={form.nome} 
                onChange={e => setForm({ ...form, nome: e.target.value })}
                aria-required="true"
              />
            </div>

            {/* Campo Texto da Mensagem */}
            <div className="space-y-1">
              <label htmlFor="edit-texto" className="text-sm font-medium text-gray-300">
                Texto da Mensagem <span className="text-red-500">*</span>
              </label>
              <textarea
                id="edit-texto"
                placeholder="Digite o texto da mensagem"
                className="flex min-h-[80px] w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                value={form.texto}
                onChange={e => setForm({ ...form, texto: e.target.value })}
                aria-required="true"
                rows={4}
              />
            </div>

            {/* Campo Variáveis */}
            <div className="space-y-1">
              <label htmlFor="edit-variaveis" className="text-sm font-medium text-gray-300">
                Variáveis (opcional)
              </label>
              <Input 
                id="edit-variaveis"
                placeholder="Ex: nome, data, hora" 
                className="bg-gray-900 border border-gray-700 text-white" 
                value={form.variaveis} 
                onChange={e => setForm({ ...form, variaveis: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">
                Separe as variáveis por vírgula. Ex: nome, data, hora
              </p>
            </div>

            {/* Área de Upload de Imagem */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-gray-300">
                Imagem do Template (Opcional)
              </label>
              {imagePreview || form.imagem ? (
                <div className="relative">
                  <div className="relative w-full h-48 bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
                    <img 
                      src={imagePreview || form.imagem} 
                      alt="Preview" 
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-2 right-2 bg-red-600 hover:bg-red-700 text-white rounded-full p-1.5 transition-colors"
                      aria-label="Remover imagem"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Clique no X para remover a imagem</p>
                </div>
              ) : (
                <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center hover:border-purple-600 transition-colors">
                  <input
                    type="file"
                    id="image-upload-edit"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="image-upload-edit"
                    className="cursor-pointer flex flex-col items-center justify-center space-y-2"
                  >
                    <div className="w-12 h-12 bg-purple-900/30 rounded-full flex items-center justify-center">
                      <Upload className="w-6 h-6 text-purple-400" />
                    </div>
                    <div className="text-sm text-gray-300">
                      <span className="text-purple-400 font-medium">Clique para fazer upload</span> ou arraste a imagem aqui
                    </div>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF até 5MB</p>
                  </label>
                </div>
              )}
            </div>

            {/* Campo Status */}
            <div className="space-y-1">
              <label htmlFor="edit-status" className="text-sm font-medium text-gray-300">
                Status do Template
              </label>
              <select 
                id="edit-status"
                className="flex h-10 w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 text-sm text-white focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-purple-500"
                value={form.status} 
                onChange={e => setForm({ ...form, status: e.target.value as TemplateStatus })}
                aria-label="Status do Template"
              >
                <option value={TEMPLATE_STATUS.ATIVO}>Ativo</option>
                <option value={TEMPLATE_STATUS.INATIVO}>Inativo</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setModal({ type: null })} 
              className="bg-gray-700 text-white hover:bg-gray-600"
            >
              Cancelar
            </Button>
            <Button 
              type="button"
              className="bg-purple-600 hover:bg-purple-700 text-white" 
              onClick={handleEditar}
              disabled={!form.nome.trim() || !form.texto.trim()}
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal Enviar Notificação */}
      <Dialog open={modal.type === 'enviar'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Enviar Notificação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <span className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
              <span className="text-xs font-semibold">WhatsApp {isConnected ? 'Conectado' : 'Desconectado'} ({connectionStatus})</span>
            </div>
            <div>
              <label className="block text-gray-300 mb-1 font-medium">Destinatário</label>
              <Input 
                placeholder="Buscar cliente ou revenda..." 
                className="mb-2 bg-gray-900 border border-gray-700 text-white" 
                value={searchDestValue}
                onChange={e => setSearchDestValue(e.target.value)} 
              />
              <div className="max-h-40 overflow-y-auto rounded border border-gray-700 bg-[#181825] divide-y divide-gray-800">
                <div className="px-2 py-1 text-xs text-purple-400 font-bold">Clientes Ativos</div>
                {clientes.filter(c => (c.status || '').toLowerCase() === 'ativo' && (!searchDestValue || (c.real_name || c.name).toLowerCase().includes(searchDestValue.toLowerCase()))).length > 0 ? (
                  clientes.filter(c => (c.status || '').toLowerCase() === 'ativo' && (!searchDestValue || (c.real_name || c.name).toLowerCase().includes(searchDestValue.toLowerCase()))).map(c => (
                    <div 
                      key={c.id} 
                      className="px-3 py-2 hover:bg-purple-900/30 cursor-pointer flex items-center gap-2" 
                      onClick={() => setSelectedDest({ 
                        id: c.id, 
                        nome: c.real_name || c.name, 
                        telefone: c.email || '',
                        tipo: 'cliente' as const
                      })}
                    >
                      <Users className="w-4 h-4 text-purple-400" /> 
                      <span>{c.real_name || c.name} <span className="text-xs text-gray-400">({c.email})</span></span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-500">Nenhum cliente encontrado.</div>
                )}
              </div>
              <div className="max-h-40 overflow-y-auto rounded border border-gray-700 bg-[#181825] divide-y divide-gray-800 mt-2">
                <div className="px-2 py-1 text-xs text-green-400 font-bold">Revendas Ativas</div>
                {revendas.filter(r => (r.status || '').toLowerCase() === 'active' && (!searchDestValue || (r.personal_name || r.username).toLowerCase().includes(searchDestValue.toLowerCase()))).length > 0 ? (
                  revendas.filter(r => (r.status || '').toLowerCase() === 'active' && (!searchDestValue || (r.personal_name || r.username).toLowerCase().includes(searchDestValue.toLowerCase()))).map(r => (
                    <div 
                      key={r.id} 
                      className="px-3 py-2 hover:bg-green-900/30 cursor-pointer flex items-center gap-2" 
                      onClick={() => setSelectedDest({ 
                        id: r.id, 
                        nome: r.personal_name || r.username, 
                        telefone: r.email || '',
                        tipo: 'revenda' as const
                      })}
                    >
                      <Users className="w-4 h-4 text-green-400" /> 
                      <span>{r.personal_name || r.username} <span className="text-xs text-gray-400">({r.email})</span></span>
                    </div>
                  ))
                ) : (
                  <div className="px-3 py-2 text-xs text-gray-500">Nenhuma revenda encontrada.</div>
                )}
              </div>
            </div>
            {selectedDest && selectedTemplate && (
              <div className="bg-[#181825] border border-purple-800 rounded-lg p-3 text-sm text-gray-200 mt-2">
                <div className="font-semibold text-purple-300 mb-1">Mensagem:</div>
                <div className="whitespace-pre-line">
                  {Object.entries(selectedDest).reduce(
                    (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value || '')), 
                    selectedTemplate.texto
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setModal({ type: null })} 
              className="bg-gray-700 text-white"
            >
              Cancelar
            </Button>
            <Button 
              className="bg-green-600 hover:bg-green-700 text-white" 
              disabled={!selectedDest || !isConnected} 
              onClick={handleEnviar}
            >
              Enviar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}