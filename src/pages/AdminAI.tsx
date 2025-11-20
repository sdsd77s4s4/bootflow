import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { Play, Mic, UploadCloud, Plus, Volume2, CheckCircle2, Copy, Type } from 'lucide-react';

const perfisMock = [
  { id: 1, nome: 'Maria - Vendas', desc: 'Voz feminina, calorosa e profissional', genero: 'Feminina', tom: 'Profissional', uso: 1247, status: 'ativa' },
  { id: 2, nome: 'João - Suporte', desc: 'Voz masculina, amigável e prestativa', genero: 'Masculina', tom: 'Amigável', uso: 856, status: 'ativa' },
  { id: 3, nome: 'Ana - Corporativo', desc: 'Voz feminina, formal e clara', genero: 'Feminina', tom: 'Formal', uso: 432, status: 'ativa' },
  { id: 4, nome: 'Pedro - Executivo', desc: 'Voz masculina, autoritativa e confiante', genero: 'Masculina', tom: 'Autoritativo', uso: 298, status: 'ativa' },
  { id: 5, nome: 'Sofia - Educacional', desc: 'Voz feminina, paciente e didática', genero: 'Feminina', tom: 'Didática', uso: 567, status: 'ativa' },
  { id: 6, nome: 'Carlos - Técnico', desc: 'Voz masculina, precisa e técnica', genero: 'Masculina', tom: 'Técnico', uso: 345, status: 'ativa' },
  { id: 7, nome: 'Lúcia - Marketing', desc: 'Voz feminina, entusiasta e persuasiva', genero: 'Feminina', tom: 'Persuasiva', uso: 789, status: 'ativa' },
];

const transcricoesMock = [
  { id: 1, nome: 'cliente_reclamacao_001.mp3', tempo: '2:34', status: 'processado', sentimento: 'negativo', texto: 'Olá, estou ligando porque meu pedido ainda não chegou...', resumo: 'Cliente reclama sobre atraso na entrega', data: '2 horas atrás' },
  { id: 2, nome: 'feedback_positivo_002.mp3', tempo: '1:45', status: 'processando', sentimento: '', texto: '...', resumo: '', data: '15 min atrás' },
  { id: 3, nome: 'duvida_produto_003.mp3', tempo: '3:12', status: 'processado', sentimento: 'neutro', texto: 'Gostaria de saber mais detalhes sobre o plano Pro...', resumo: 'Interessado no plano Pro, quer detalhes sobre IA', data: '1 hora atrás' },
];

export default function AdminAI() {
  const [tab, setTab] = useState<'tts' | 'gravar' | 'clonar'>('tts');
  const [voz, setVoz] = useState('');
  const [texto, setTexto] = useState('');
  const [velocidade, setVelocidade] = useState(1);
  const [tom, setTom] = useState(1);
  const [modal, setModal] = useState<{ type: null | 'upload' | 'novaVoz' | 'testarVoz' | 'detalhes' | 'editarVoz' | 'excluirVoz' | 'gravarVoz' | 'clonarVoz', data?: any }>({ type: null });
  const [perfis, setPerfis] = useState(perfisMock);
  const [transcricoes, setTranscricoes] = useState(transcricoesMock);
  // Persistência local
  useEffect(() => {
    try {
      const saved = localStorage.getItem('voice-perfis');
      if (saved) setPerfis(JSON.parse(saved));
    } catch (e) {
      // ignore
    }
    try {
      const savedT = localStorage.getItem('voice-transcricoes');
      if (savedT) setTranscricoes(JSON.parse(savedT));
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try { localStorage.setItem('voice-perfis', JSON.stringify(perfis)); } catch (e) {}
  }, [perfis]);

  useEffect(() => {
    try { localStorage.setItem('voice-transcricoes', JSON.stringify(transcricoes)); } catch (e) {}
  }, [transcricoes]);
  const [novoPerfil, setNovoPerfil] = useState({ nome: '', genero: '', tom: '', status: 'ativa' });
  const [editPerfil, setEditPerfil] = useState({ nome: '', genero: '', tom: '', status: 'ativa' });
  const [loadingAudio, setLoadingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [gravando, setGravando] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [clonando, setClonando] = useState(false);

  // CRUD Perfis de Voz
  const handleAddPerfil = () => {
    setPerfis([
      ...perfis,
      { id: Date.now(), ...novoPerfil, uso: 0, desc: '', status: novoPerfil.status }
    ]);
    setNovoPerfil({ nome: '', genero: '', tom: '', status: 'ativa' });
    setModal({ type: null });
  };
  const handleEditPerfil = () => {
    setPerfis(perfis.map(p => p.id === modal.data.id ? { ...p, ...editPerfil } : p));
    setModal({ type: null });
  };
  const handleExcluirPerfil = () => {
    setPerfis(perfis.filter(p => p.id !== modal.data.id));
    setModal({ type: null });
  };
  const handleToggleAtivo = (id: number) => {
    setPerfis(perfis.map(p => p.id === id ? { ...p, status: p.status === 'ativa' ? 'inativa' : 'ativa' } : p));
  };

  // Simulação de geração de áudio
  const handleGerarAudio = () => {
    setLoadingAudio(true);
    setTimeout(() => {
      // Simulação: usar sample mp3 como áudio gerado
      setAudioUrl('https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3');
      setLoadingAudio(false);
    }, 1500);
  };
  const handlePreviewAudio = () => {
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  // Upload e processamento de arquivo de áudio (simulado)
  const handleAudioFileUpload = async (file?: File | null) => {
    if (!file) return;
    const id = Date.now();
    const reader = new FileReader();
    // Adiciona entrada inicial com status processando
    setTranscricoes(prev => [{ id, nome: file.name, tempo: '0:00', status: 'processando', sentimento: '', texto: '', resumo: '', data: 'agora' }, ...prev]);
    reader.onload = () => {
      // Simula envio e processamento
      setTimeout(() => {
        const fakeText = `Transcrição automática de ${file.name}: (texto simulado)`;
        setTranscricoes(prev => prev.map(t => t.id === id ? { ...t, status: 'processado', tempo: '1:23', texto: fakeText, resumo: 'Resumo automático gerado', sentimento: 'neutro' } : t));
      }, 2200);
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTranscription = (t: any) => {
    const content = `Arquivo: ${t.nome}\nData: ${t.data}\nResumo: ${t.resumo || ''}\n\nTranscrição:\n${t.texto || ''}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${t.nome}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  // Simulação de gravação de voz
  const handleIniciarGravacao = () => {
    setGravando(true);
    setTimeout(() => {
      setAudioBlob(new Blob());
      setGravando(false);
    }, 2000);
  };
  const handleSalvarGravacao = () => {
    setPerfis([
      ...perfis,
      { id: Date.now(), nome: 'Nova Voz Gravada', genero: 'Personalizada', tom: 'Gravada', uso: 0, desc: 'Voz gravada pelo usuário', status: 'ativa' }
    ]);
    setAudioBlob(null);
    setModal({ type: null });
  };
  // Simulação de clonagem de voz
  const handleClonarVoz = () => {
    setClonando(true);
    setTimeout(() => {
      setPerfis([
        ...perfis,
        { id: Date.now(), nome: 'Voz Clonada', genero: 'Personalizada', tom: 'Clonada', uso: 0, desc: 'Voz clonada via upload', status: 'ativa' }
      ]);
      setClonando(false);
      setModal({ type: null });
    }, 2000);
  };

  const handleCardClick = (cardId: string) => {
    if (cardId === 'gravar') {
      setModal({ type: 'gravarVoz' });
    } else if (cardId === 'clonar') {
      setModal({ type: 'clonarVoz' });
    } else {
      setTab(cardId as 'tts' | 'gravar' | 'clonar');
    }
  };

  const navItems = [
    { id: 'tts', title: 'Estúdio de Voz', icon: Type, description: 'Converta texto em fala.', color: 'purple' },
    { id: 'gravar', title: 'Gravar Voz', icon: Mic, description: 'Grave um novo perfil de voz.', color: 'green' },
    { id: 'clonar', title: 'Clonar Voz', icon: Copy, description: 'Clone uma voz a partir de um áudio.', color: 'blue' },
  ];

  const colorClasses = {
    purple: {
      border: 'border-purple-700/40',
      shadow: 'shadow-purple-700/50',
      hoverBorder: 'hover:border-purple-700/50',
      from: 'from-purple-900/50',
      to: 'to-purple-800/30',
      icon: 'text-purple-400',
    },
    green: {
      border: 'border-green-700/40',
      shadow: 'shadow-green-700/50',
      hoverBorder: 'hover:border-green-700/50',
      from: 'from-green-900/50',
      to: 'to-green-800/30',
      icon: 'text-green-400',
    },
    blue: {
      border: 'border-blue-700/40',
      shadow: 'shadow-blue-700/50',
      hoverBorder: 'hover:border-blue-700/50',
      from: 'from-blue-900/50',
      to: 'to-blue-800/30',
      icon: 'text-blue-400',
    },
  };

  return (
    <div className="max-w-full w-full h-full overflow-auto p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Voice Center</h1>
          <p className="text-gray-400">Crie vozes personalizadas e processe áudios com IA</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2 bg-[#1f2937] text-white border-none" onClick={() => setModal({ type: 'upload' })}><UploadCloud className="w-4 h-4" /> Upload Áudio</Button>
          <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white flex items-center gap-2" onClick={() => setModal({ type: 'novaVoz' })}><Plus className="w-4 h-4" /> Nova Voz IA</Button>
        </div>
      </div>
      
      {/* Navegação por Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {navItems.map(item => {
          const colors = colorClasses[item.color as keyof typeof colorClasses] || colorClasses.purple;
          return (
            <Card 
              key={item.id}
              onClick={() => handleCardClick(item.id)}
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

      {/* Conteúdo Principal (visível quando 'tts' está ativo) */}
      {tab === 'tts' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Estúdio de Voz */}
          <Card className="md:col-span-2 bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
            <CardHeader>
              <CardTitle className="text-lg text-white">3a7 Estúdio de Voz</CardTitle>
              <p className="text-gray-400">Crie e personalize vozes para seus bots</p>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4">
                <Button variant={tab === 'tts' ? 'default' : 'outline'} className={tab === 'tts' ? 'bg-[#7e22ce] text-white flex-1' : 'bg-[#1f2937] text-white flex-1'} onClick={() => setTab('tts')}>Text-to-Speech</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white flex-1" onClick={() => { setTab('gravar'); setModal({ type: 'gravarVoz' }); }}>Gravar Voz</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white flex-1" onClick={() => { setTab('clonar'); setModal({ type: 'clonarVoz' }); }}>Clonar Voz</Button>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Selecionar Voz</label>
                <select className="w-full bg-[#1f2937] border border-gray-700 text-white rounded px-3 py-2" value={voz} onChange={e => setVoz(e.target.value)}>
                  <option value="">Escolha uma voz</option>
                  {perfis.map(p => <option key={p.id} value={p.nome}>{p.nome}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Texto para Falar</label>
                <Textarea className="w-full bg-[#1f2937] border border-gray-700 text-white rounded" value={texto} onChange={e => setTexto(e.target.value)} placeholder="Digite o texto que você quer converter em áudio..." />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>{texto.length} caracteres • {texto.split(' ').filter(Boolean).length} palavras</span>
                  <span>Duração estimada: 0:00</span>
                </div>
              </div>
              <div className="flex gap-6 mb-4">
                <div className="flex-1">
                  <label className="block text-gray-300 mb-1 font-medium">Velocidade: {velocidade}x</label>
                  <Slider min={0.5} max={2} step={0.1} value={[velocidade]} onValueChange={v => setVelocidade(v[0])} />
                </div>
                <div className="flex-1">
                  <label className="block text-gray-300 mb-1 font-medium">Tom: {tom}</label>
                  <Slider min={-2} max={2} step={1} value={[tom]} onValueChange={v => setTom(v[0])} />
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white" onClick={handleGerarAudio} disabled={loadingAudio}>{loadingAudio ? 'Gerando...' : 'Gerar Áudio'}</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white" onClick={handlePreviewAudio} disabled={!audioUrl}>Preview</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white" disabled={!audioUrl}>Download</Button>
                <Button variant="outline" className="bg-[#1f2937] text-white" onClick={() => setModal({ type: 'testarVoz' })}>Testar Vozes</Button>
              </div>
            </CardContent>
          </Card>
          {/* Perfis de Voz */}
          <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40">
            <CardHeader>
              <CardTitle className="text-lg text-white">Perfis de Voz</CardTitle>
              <p className="text-gray-400">Suas vozes personalizadas</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white w-full mb-2" onClick={() => setModal({ type: 'novaVoz' })}>Adicionar Nova Voz</Button>
              {perfis.map(p => (
                <div key={p.id} className="bg-[#232a36] rounded-xl p-3 border border-green-700/20 flex flex-col gap-1">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-white">{p.nome}</div>
                    <div className="flex gap-2 items-center">
                      <Badge className={p.status === 'ativa' ? 'bg-green-700 text-green-200' : 'bg-gray-700 text-gray-300'}>{p.status}</Badge>
                      <Button size="icon" variant="ghost" onClick={() => handleToggleAtivo(p.id)} title={p.status === 'ativa' ? 'Desativar' : 'Ativar'}>
                        <CheckCircle2 className={p.status === 'ativa' ? 'text-green-400' : 'text-gray-400'} />
                      </Button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400">{p.desc}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-gray-400 mt-1">
                    <span>Idioma: pt-BR</span>
                    <span>Gênero: {p.genero}</span>
                    <span>Tom: {p.tom}</span>
                    <span>Uso: {p.uso}x</span>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => setModal({ type: 'testarVoz', data: p })}><Play className="w-4 h-4 mr-1" /> Teste</Button>
                    <Button size="sm" variant="outline" className="border-yellow-600 text-yellow-400" onClick={() => { setEditPerfil({ nome: p.nome, genero: p.genero, tom: p.tom, status: p.status }); setModal({ type: 'editarVoz', data: p }); }}>Editar</Button>
                    <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => setModal({ type: 'excluirVoz', data: p })}>Excluir</Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transcrições de Áudio (sempre visível) */}
      <div className="mb-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40">
          <CardHeader>
            <CardTitle className="text-lg text-gray-900 dark:text-white">Transcrições de Áudio</CardTitle>
            <p className="text-gray-500 dark:text-gray-400">Áudios processados com IA e resumos automáticos</p>
          </CardHeader>
          <CardContent className="space-y-4">
            {transcricoes.map(t => (
              <div key={t.id} className="bg-[#f1f5f9] dark:bg-[#181e29] rounded-xl p-4 border border-purple-700/20 flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Volume2 className="w-5 h-5 text-purple-400" />
                  <span className="font-semibold text-gray-900 dark:text-white">{t.nome}</span>
                  <span className="text-xs text-gray-400">{t.tempo} • {t.data}</span>
                  <Badge className={t.status === 'processado' ? 'bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-200' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-200'}>{t.status}</Badge>
                  {t.sentimento && <Badge className={t.sentimento === 'negativo' ? 'bg-red-100 text-red-800 dark:bg-red-700 dark:text-red-200' : t.sentimento === 'neutro' ? 'bg-blue-100 text-blue-800 dark:bg-blue-700 dark:text-blue-200' : ''}>{t.sentimento}</Badge>}
                </div>
                <div className="text-gray-700 dark:text-gray-200 text-sm">"{t.texto}"</div>
                {t.resumo && <div className="bg-blue-50 dark:bg-blue-900/40 rounded p-2 text-xs text-blue-800 dark:text-blue-200 mt-2">Resumo: {t.resumo}</div>}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" variant="outline" className="border-blue-600 text-blue-400" onClick={() => setModal({ type: 'detalhes', data: t })}>Detalhes</Button>
                  <Button size="sm" variant="outline" className="border-green-600 text-green-400" onClick={() => downloadTranscription(t)}>Download</Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
      
      {/* Modals */}
      <Dialog open={modal.type === 'upload'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Upload de Áudio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" accept="audio/*" className="bg-gray-900 border border-gray-700 text-white" onChange={e => handleAudioFileUpload(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setModal({ type: null })}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modal.type === 'novaVoz'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Voz IA</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Input placeholder="Nome da Voz" className="bg-gray-900 border border-gray-700 text-white" value={novoPerfil.nome} onChange={e => setNovoPerfil({ ...novoPerfil, nome: e.target.value })} />
            <Input placeholder="Gênero" className="bg-gray-900 border border-gray-700 text-white" value={novoPerfil.genero} onChange={e => setNovoPerfil({ ...novoPerfil, genero: e.target.value })} />
            <Input placeholder="Tom" className="bg-gray-900 border border-gray-700 text-white" value={novoPerfil.tom} onChange={e => setNovoPerfil({ ...novoPerfil, tom: e.target.value })} />
          </div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleAddPerfil}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modal.type === 'editarVoz'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Perfil de Voz</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <Input placeholder="Nome da Voz" className="bg-gray-900 border border-gray-700 text-white" value={editPerfil.nome} onChange={e => setEditPerfil({ ...editPerfil, nome: e.target.value })} />
            <Input placeholder="Gênero" className="bg-gray-900 border border-gray-700 text-white" value={editPerfil.genero} onChange={e => setEditPerfil({ ...editPerfil, genero: e.target.value })} />
            <Input placeholder="Tom" className="bg-gray-900 border border-gray-700 text-white" value={editPerfil.tom} onChange={e => setEditPerfil({ ...editPerfil, tom: e.target.value })} />
          </div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleEditPerfil}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modal.type === 'excluirVoz'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Excluir Perfil de Voz</DialogTitle>
          </DialogHeader>
          <div className="py-4">Tem certeza que deseja excluir este perfil de voz?</div>
          <DialogFooter>
            <Button className="bg-gray-700 text-white" onClick={() => setModal({ type: null })}>Cancelar</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" onClick={handleExcluirPerfil}>Excluir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modal.type === 'testarVoz'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Testar Voz</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Textarea placeholder="Digite um texto para testar a voz..." className="bg-gray-900 border border-gray-700 text-white" />
          </div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setModal({ type: null })}>Ouvir</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={modal.type === 'detalhes'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Detalhes do Áudio</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div><b>Arquivo:</b> {modal.data?.nome}</div>
            <div><b>Status:</b> {modal.data?.status}</div>
            <div><b>Sentimento:</b> {modal.data?.sentimento}</div>
            <div><b>Resumo:</b> {modal.data?.resumo}</div>
            <div className="mt-2 text-xs text-gray-300">{modal.data?.texto}</div>
          </div>
          <DialogFooter>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={() => setModal({ type: null })}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Gravar Voz */}
      <Dialog open={modal.type === 'gravarVoz'} onOpenChange={() => { setModal({ type: null }); setAudioBlob(null); setGravando(false); }}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Gravar Nova Voz</DialogTitle>
          </DialogHeader>
          <div className="py-4 flex flex-col items-center gap-4">
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleIniciarGravacao} disabled={gravando}>{gravando ? 'Gravando...' : 'Iniciar Gravação'}</Button>
            {audioBlob && <span className="text-green-400">Gravação pronta!</span>}
          </div>
          <DialogFooter>
            <Button className="bg-gray-700 text-white" onClick={() => setModal({ type: null })}>Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleSalvarGravacao} disabled={!audioBlob}>Salvar Voz</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Modal Clonar Voz */}
      <Dialog open={modal.type === 'clonarVoz'} onOpenChange={() => setModal({ type: null })}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle>Clonar Voz</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input type="file" accept="audio/*" className="bg-gray-900 border border-gray-700 text-white" onChange={e => handleAudioFileUpload(e.target.files?.[0] ?? null)} />
          </div>
          <DialogFooter>
            <Button className="bg-gray-700 text-white" onClick={() => setModal({ type: null })}>Cancelar</Button>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white" onClick={handleClonarVoz} disabled={clonando}>{clonando ? 'Clonando...' : 'Clonar Voz'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 