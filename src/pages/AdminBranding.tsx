import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Paintbrush, UploadCloud, X, Check, GripVertical, Plus, Edit, Trash2, Palette, Code, Sliders, Star, Eye, ArrowLeft, BarChart3, TrendingUp, Activity, Bell, Table, Calendar, Map, FileText, PieChart, Globe, ExternalLink, Copy, Link2, Layout, Move, Settings2, Type, Image, Video, List, Grid3x3, Columns, DollarSign, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import useDashboardData from '@/hooks/useDashboardData';
import { useClientes } from '@/hooks/useClientes';
import "./AdminBranding.css";

const initialBrand = {
  name: 'Sua Empresa Ltda',
  slogan: 'Seu slogan aqui',
  description: '',
  website: 'https://suaempresa.com',
  email: 'contato@suaempresa.com',
  phone: '99999-9999',
  logo: '',
  favicon: ''
};

const initialDashboards = [
  {
    id: 1,
    name: 'Dashboard Principal',
    layout: 'Padrão',
    widgets: ['Métricas', 'Gráficos', 'Atividades Recentes', 'Notificações'],
    order: ['Métricas', 'Gráficos', 'Atividades Recentes', 'Notificações'],
    realtime: true,
    color: '#7c3aed',
  },
];

type Dashboard = {
  id: number;
  name: string;
  layout: string;
  widgets: string[];
  order: string[];
  realtime: boolean;
  color: string;
};

type PageComponent = {
  id: string;
  type: string;
  name?: string;
  config?: ComponentConfig;
  order?: number;
};
type Client = {
  name?: string;
  email?: string;
  status?: string;
};

// Tipagens para os diferentes configs de componentes do page builder
type MetricCardConfig = {
  title?: string;
  value?: string | number;
  label?: string;
  color?: string;
};

type StatsGridConfig = {
  columns?: number;
  metrics?: string[];
};

type RevenueCardConfig = {
  showGrowth?: boolean;
  period?: string;
};

type UsersTableConfig = {
  showSearch?: boolean;
  showPagination?: boolean;
  pageSize?: number;
};

type ButtonConfig = {
  text?: string;
  variant?: 'primary' | 'secondary' | 'success';
  action?: string;
  link?: string;
};

type TextConfig = {
  content?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  align?: 'left' | 'center' | 'right';
};

type ImageConfig = { src?: string; alt?: string; width?: string; height?: string };
type VideoConfig = { src?: string; autoplay?: boolean; controls?: boolean };
type ListConfig = { items?: string[]; ordered?: boolean };
type ColumnsConfig = { count?: number; gap?: string };
type FormField = { name: string; label?: string; type?: string; placeholder?: string };
type FormConfig = { fields?: FormField[]; submitText?: string; action?: string };

type ComponentConfig = Record<string, unknown>;

type Page = {
  id?: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  type: string;
  backgroundColor: string;
  textColor: string;
  primaryColor: string;
  showHeader: boolean;
  showFooter: boolean;
  customCSS: string;
  metaTitle: string;
  metaDescription: string;
  isPublished: boolean;
  components: PageComponent[];
};

type Site = {
  id: number;
  name: string;
  domain: string;
  status: 'ativo' | 'inativo';
  dashboards: number[]; // IDs dos dashboards vinculados
};

const AdminBranding: React.FC = () => {
    // Estado para gestão de sites/marcas
    const [sites, setSites] = useState<Site[]>([]);
    const [siteModal, setSiteModal] = useState(false);
    const [editingSite, setEditingSite] = useState<Site | null>(null);
    const [siteForm, setSiteForm] = useState<Partial<Site>>({ name: '', domain: '', status: 'ativo', dashboards: [] });

  const [tab, setTab] = useState('marca');
  const [brand, setBrand] = useState(initialBrand);
  const [originalBrand, setOriginalBrand] = useState(initialBrand);
  const [hasChanges, setHasChanges] = useState(false);
  const [logoModal, setLogoModal] = useState(false);
  const [faviconModal, setFaviconModal] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [dashboards, setDashboards] = useState<Dashboard[]>(initialDashboards as Dashboard[]);
  const [dashboardModal, setDashboardModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<Dashboard | null>(null);
  const [viewingDashboard, setViewingDashboard] = useState<Dashboard | null>(null);
  const [dashboardForm, setDashboardForm] = useState({
    name: '',
    layout: 'Padrão',
    widgets: ['Métricas'],
    order: ['Métricas'],
    realtime: true,
    color: '#7c3aed',
  });
  
  // Estados para páginas personalizadas
  const [customPages, setCustomPages] = useState<Page[]>([]);
  const [pageModal, setPageModal] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [viewingPage, setViewingPage] = useState<Page | null>(null);
  const [pageForm, setPageForm] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    type: 'afiliado', // afiliado, landing, promoção, etc
    backgroundColor: '#ffffff',
    textColor: '#000000',
    primaryColor: '#7c3aed',
    showHeader: true,
    showFooter: true,
    customCSS: '',
    metaTitle: '',
    metaDescription: '',
    isPublished: false,
    components: [] as PageComponent[], // Array de componentes do page builder
  });
  
  const [builderMode, setBuilderMode] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<PageComponent | null>(null);
  
  // Hooks para dados reais
  const { stats } = useDashboardData();
  const { clientes } = useClientes();
  
  // Sensores para drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  // Carregar dados salvos do localStorage ao montar o componente
  useEffect(() => {
    const savedBrand = localStorage.getItem('brand-config');
    if (savedBrand) {
      try {
        const parsedBrand = JSON.parse(savedBrand);
        setBrand(parsedBrand);
        setOriginalBrand(parsedBrand);
      } catch (error) {
        console.error('Erro ao carregar configuração de marca:', error);
      }
    }
    
    // Carregar dashboards salvos
    const savedDashboards = localStorage.getItem('custom-dashboards');
    if (savedDashboards) {
      try {
        const parsedDashboards = JSON.parse(savedDashboards);
        setDashboards(parsedDashboards);
      } catch (error) {
        console.error('Erro ao carregar dashboards:', error);
      }
    }
    
    // Carregar páginas personalizadas
    const savedPages = localStorage.getItem('custom-pages');
    if (savedPages) {
      try {
        const parsedPages = JSON.parse(savedPages);
        setCustomPages(parsedPages);
      } catch (error) {
        console.error('Erro ao carregar páginas:', error);
      }
    }
  }, []);

  // Verificar mudanças
  useEffect(() => {
    const changed = JSON.stringify(brand) !== JSON.stringify(originalBrand);
    setHasChanges(changed);
  }, [brand, originalBrand]);

  // Função para validar campos obrigatórios
  const validateBrand = () => {
    if (!brand.name.trim()) {
      toast.error('O nome da empresa é obrigatório');
      return false;
    }
    if (!brand.website.trim()) {
      toast.error('O website é obrigatório');
      return false;
    }
    if (!brand.email.trim()) {
      toast.error('O e-mail é obrigatório');
      return false;
    }
    if (!brand.phone.trim()) {
      toast.error('O telefone é obrigatório');
      return false;
    }
    // Validar formato de e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(brand.email)) {
      toast.error('E-mail inválido');
      return false;
    }
    // Validar formato de website
    const websiteRegex = /^https?:\/\/.+/;
    if (!websiteRegex.test(brand.website)) {
      toast.error('Website deve começar com http:// ou https://');
      return false;
    }
    return true;
  };

  // Função para salvar configuração
  const handleSave = () => {
    if (!validateBrand()) {
      return;
    }
    
    try {
      localStorage.setItem('brand-config', JSON.stringify(brand));
      setOriginalBrand(brand);
      setHasChanges(false);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  // Função para cancelar mudanças
  const handleCancel = () => {
    setBrand(originalBrand);
    setHasChanges(false);
    toast.info('Alterações descartadas');
  };

  // Função para upload de logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamanho (1MB máximo)
      if (file.size > 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 1MB');
        return;
      }
      
      // Validar tipo
      if (!file.type.match(/image\/(png|jpeg|jpg)/)) {
        toast.error('Apenas arquivos PNG ou JPG são permitidos');
        return;
      }
      
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrand({ ...brand, logo: reader.result as string });
        setLogoModal(false);
        toast.success('Logo carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para upload de favicon
  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validar tamanho (1MB máximo)
      if (file.size > 1024 * 1024) {
        toast.error('O arquivo deve ter no máximo 1MB');
        return;
      }
      
      // Validar tipo
      if (!file.type.match(/image\/(png|x-icon|vnd.microsoft.icon)/)) {
        toast.error('Apenas arquivos PNG ou ICO são permitidos');
        return;
      }
      
      setFaviconFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrand({ ...brand, favicon: reader.result as string });
        setFaviconModal(false);
        toast.success('Favicon carregado com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  // Funções para manipular dashboards
  const openNewDashboard = () => {
    setEditingDashboard(null);
    setDashboardForm({
      name: '',
      layout: 'Padrão',
      widgets: ['Métricas'],
      order: ['Métricas'],
      realtime: true,
      color: '#7c3aed',
    });
    setDashboardModal(true);
  };
  const openEditDashboard = (db: Dashboard | null) => {
    if (!db) return;
    setEditingDashboard(db);
    setDashboardForm({
      name: db.name,
      layout: db.layout,
      widgets: db.widgets,
      order: db.order,
      realtime: db.realtime,
      color: db.color,
    });
    setDashboardModal(true);
  };
  const saveDashboard = () => {
    if (!dashboardForm.name.trim()) {
      toast.error('O nome do dashboard é obrigatório');
      return;
    }
    
    let updatedDashboards;
    let savedDashboard;
    
    if (editingDashboard) {
      savedDashboard = { ...editingDashboard, ...dashboardForm };
      updatedDashboards = dashboards.map(db => 
        db.id === editingDashboard.id ? savedDashboard : db
      );
      toast.success('Dashboard atualizado com sucesso!');
    } else {
      savedDashboard = { ...dashboardForm, id: Date.now() };
      updatedDashboards = [
        ...dashboards,
        savedDashboard,
      ];
      toast.success('Dashboard criado com sucesso!');
    }
    
    setDashboards(updatedDashboards);
    // Salvar no localStorage
    localStorage.setItem('custom-dashboards', JSON.stringify(updatedDashboards));
    setDashboardModal(false);
    
    // Mostrar o dashboard criado/editado automaticamente
    setViewingDashboard(savedDashboard);
  };
  const removeDashboard = (id: number) => {
    const updatedDashboards = dashboards.filter(db => db.id !== id);
    setDashboards(updatedDashboards);
    // Salvar no localStorage
    localStorage.setItem('custom-dashboards', JSON.stringify(updatedDashboards));
    toast.success('Dashboard removido com sucesso!');
  };
  // Drag & drop simples para ordem dos widgets
  const moveWidget = (from: number, to: number) => {
    const newOrder = [...dashboardForm.order];
    const [removed] = newOrder.splice(from, 1);
    newOrder.splice(to, 0, removed);
    setDashboardForm({ ...dashboardForm, order: newOrder });
  };

  // Função para renderizar widgets do dashboard
  const renderWidget = (widgetName: string, index: number) => {
    const widgetIcons: Record<string, React.ComponentType<unknown>> = {
      'Métricas': BarChart3,
      'Gráficos': TrendingUp,
      'Atividades Recentes': Activity,
      'Notificações': Bell,
      'Tabelas': Table,
      'Calendário': Calendar,
      'Mapas': Map,
      'Relatórios': FileText,
      'Análises': PieChart,
    };

    const Icon = widgetIcons[widgetName] || BarChart3;
    const mockData = {
      'Métricas': { value: '1.234', label: 'Total de Vendas', change: '+12%' },
      'Gráficos': { value: 'R$ 45.678', label: 'Receita Mensal', change: '+8%' },
      'Atividades Recentes': { value: '23', label: 'Atividades Hoje', change: '+5' },
      'Notificações': { value: '7', label: 'Novas Notificações', change: 'Novas' },
      'Tabelas': { value: '156', label: 'Registros', change: 'Atualizado' },
      'Calendário': { value: '12', label: 'Eventos', change: 'Este Mês' },
      'Mapas': { value: '8', label: 'Localizações', change: 'Ativas' },
      'Relatórios': { value: '45', label: 'Relatórios', change: 'Disponíveis' },
      'Análises': { value: '89%', label: 'Performance', change: '+3%' },
    };

    const data = mockData[widgetName as keyof typeof mockData] || { value: '0', label: widgetName, change: '' };

    return (
      <Card 
        key={index}
        className="bg-[#181e29] border border-gray-700 hover:border-purple-500 transition-all"
        style={{ borderTopColor: viewingDashboard?.color }}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className="w-5 h-5" style={{ color: viewingDashboard?.color }} />
              <CardTitle className="text-white text-base">{widgetName}</CardTitle>
            </div>
            {viewingDashboard?.realtime && (
              <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded animate-pulse">
                Live
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-3xl font-bold" style={{ color: viewingDashboard?.color }}>
              {data.value}
            </div>
            <div className="text-sm text-gray-400">{data.label}</div>
            {data.change && (
              <div className="text-xs text-green-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                {data.change}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Funções para gerenciar páginas personalizadas
  // Componentes disponíveis para o page builder
  const availableComponents = [
    { id: 'metric-card', name: 'Card de Métrica', icon: BarChart3, category: 'Métricas' },
    { id: 'stats-grid', name: 'Grid de Estatísticas', icon: Grid3x3, category: 'Métricas' },
    { id: 'revenue-card', name: 'Card de Receita', icon: DollarSign, category: 'Financeiro' },
    { id: 'users-table', name: 'Tabela de Usuários', icon: Table, category: 'Dados' },
    { id: 'chart', name: 'Gráfico', icon: TrendingUp, category: 'Visualização' },
    { id: 'form', name: 'Formulário', icon: Type, category: 'Interação' },
    { id: 'button', name: 'Botão', icon: Settings2, category: 'Interação' },
    { id: 'text', name: 'Texto', icon: Type, category: 'Conteúdo' },
    { id: 'image', name: 'Imagem', icon: Image, category: 'Mídia' },
    { id: 'video', name: 'Vídeo', icon: Video, category: 'Mídia' },
    { id: 'list', name: 'Lista', icon: List, category: 'Conteúdo' },
    { id: 'columns', name: 'Colunas', icon: Columns, category: 'Layout' },
  ];

  const openNewPage = () => {
    setEditingPage(null);
    setBuilderMode(false);
    setPageForm({
      title: '',
      slug: '',
      description: '',
      content: '',
      type: 'afiliado',
      backgroundColor: '#ffffff',
      textColor: '#000000',
      primaryColor: '#7c3aed',
      showHeader: true,
      showFooter: true,
      customCSS: '',
      metaTitle: '',
      metaDescription: '',
      isPublished: false,
      components: [],
    });
    setPageModal(true);
  };

  const openEditPage = (page: Page | null) => {
    if (!page) return;
    setEditingPage(page);
    setPageForm({ 
      ...page,
      components: page.components || []
    } as Page);
    setBuilderMode(false);
    setPageModal(true);
  };

  // Adicionar componente à página
  const addComponent = (componentType: string) => {
    const component = availableComponents.find(c => c.id === componentType);
    if (!component) return;

    const newComponent = {
      id: `comp-${Date.now()}`,
      type: componentType,
      name: component.name,
      config: getDefaultComponentConfig(componentType),
      order: pageForm.components.length,
    };

    setPageForm({
      ...pageForm,
      components: [...pageForm.components, newComponent]
    });
  };

  // Obter configuração padrão do componente
  const getDefaultComponentConfig = (type: string) => {
    switch (type) {
      case 'metric-card':
        return { title: 'Métrica', value: '0', label: 'Descrição', color: pageForm.primaryColor };
      case 'stats-grid':
        return { columns: 3, metrics: ['totalUsers', 'totalRevenue', 'activeClients'] };
      case 'revenue-card':
        return { showGrowth: true, period: 'month' };
      case 'users-table':
        return { showSearch: true, showPagination: true, pageSize: 10 };
      case 'chart':
        return { type: 'line', dataSource: 'revenue', period: 'month' };
      case 'form':
        return { fields: [], submitText: 'Enviar', action: '' };
      case 'button':
        return { text: 'Clique aqui', variant: 'primary', action: '', link: '' };
      case 'text':
        return { content: 'Digite seu texto aqui', size: 'medium', align: 'left' };
      case 'image':
        return { src: '', alt: '', width: '100%', height: 'auto' };
      case 'video':
        return { src: '', autoplay: false, controls: true };
      case 'list':
        return { items: [], ordered: false };
      case 'columns':
        return { count: 2, gap: 'medium' };
      default:
        return {};
    }
  };

  // Remover componente
  const removeComponent = (componentId: string) => {
    setPageForm({
      ...pageForm,
      components: pageForm.components.filter(c => c.id !== componentId)
    });
    if (selectedComponent?.id === componentId) {
      setSelectedComponent(null);
    }
  };

  // Atualizar componente
  const updateComponent = (componentId: string, config: Partial<ComponentConfig>) => {
    setPageForm({
      ...pageForm,
      components: pageForm.components.map(c => 
        c.id === componentId ? { ...c, config: { ...c.config, ...config } } : c
      )
    });
  };

  // Reordenar componentes (drag and drop)
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = pageForm.components.findIndex((c: PageComponent) => c.id === active.id);
    const newIndex = pageForm.components.findIndex((c: PageComponent) => c.id === over.id);

    const newComponents = [...pageForm.components];
    const [removed] = newComponents.splice(oldIndex, 1);
    newComponents.splice(newIndex, 0, removed);

    setPageForm({
      ...pageForm,
      components: newComponents.map((c, index) => ({ ...c, order: index }))
    });
  };

  const savePage = () => {
    if (!pageForm.title.trim() || !pageForm.slug.trim()) {
      toast.error('Título e URL são obrigatórios');
      return;
    }

    // Validar slug (apenas letras, números, hífens e underscores)
    const slugRegex = /^[a-z0-9-_]+$/;
    if (!slugRegex.test(pageForm.slug)) {
      toast.error('A URL deve conter apenas letras minúsculas, números, hífens e underscores');
      return;
    }

    // Verificar se o slug já existe (exceto se estiver editando a mesma página)
    const slugExists = customPages.some(
      p => p.slug === pageForm.slug && (!editingPage || p.id !== editingPage.id)
    );
    if (slugExists) {
      toast.error('Esta URL já está em uso. Escolha outra.');
      return;
    }

    let updatedPages;
    let savedPage;

    if (editingPage) {
      savedPage = { ...editingPage, ...pageForm };
      updatedPages = customPages.map(p => 
        p.id === editingPage.id ? savedPage : p
      );
      toast.success('Página atualizada com sucesso!');
    } else {
      savedPage = { ...pageForm, id: Date.now(), createdAt: new Date().toISOString() };
      updatedPages = [...customPages, savedPage];
      toast.success('Página criada com sucesso!');
    }

    setCustomPages(updatedPages);
    localStorage.setItem('custom-pages', JSON.stringify(updatedPages));
    setPageModal(false);
  };

  const removePage = (id: number) => {
    const updatedPages = customPages.filter(p => p.id !== id);
    setCustomPages(updatedPages);
    localStorage.setItem('custom-pages', JSON.stringify(updatedPages));
    toast.success('Página removida com sucesso!');
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const copyPageUrl = (slug: string) => {
    const url = `${window.location.origin}/page/${slug}`;
    navigator.clipboard.writeText(url);
    toast.success('URL copiada para a área de transferência!');
  };

  // Componente SortableItem para drag and drop
  type SortableComponentItemProps = {
    component: PageComponent;
    onSelect: (c: PageComponent) => void;
    onRemove: (id: string) => void;
  };
  const SortableComponentItem = ({ component, onSelect, onRemove }: SortableComponentItemProps) => {
    const {
      attributes,
      listeners,
      setNodeRef,
      transform,
      transition,
      isDragging,
    } = useSortable({ id: component.id });

    const style = {
      transform: CSS.Transform.toString(transform),
      transition,
      opacity: isDragging ? 0.5 : 1,
    };

    return (
      <div
        ref={setNodeRef}
        style={style}
        className={`relative group border-2 rounded-lg p-4 mb-3 cursor-pointer transition-all ${
          selectedComponent?.id === component.id
            ? 'border-blue-500 bg-blue-900/20'
            : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
        }`}
        onClick={() => onSelect(component)}
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <GripVertical
              {...attributes}
              {...listeners}
              className="w-5 h-5 text-gray-500 cursor-move hover:text-gray-300"
            />
            <span className="font-semibold text-white">{component.name}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove(component.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-400 hover:text-red-300"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
        <div className="text-xs text-gray-400">Tipo: {component.type}</div>
      </div>
    );
  };

  // Renderizar componente na preview
  const renderComponent = (component: PageComponent) => {
    const { type } = component as PageComponent;
    const config = (component.config ?? ({} as ComponentConfig));

    switch (type) {
      case 'metric-card': {
        const metricConfig = config as Record<string, unknown>;
        return (
          <Card className="bg-[#181e29] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white text-sm">{metricConfig.title as string || 'Métrica'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ color: metricConfig.color as string || pageForm.primaryColor }}>
                {metricConfig.value as string || '0'}
              </div>
              <div className="text-sm text-gray-400 mt-1">{metricConfig.label as string || 'Descrição'}</div>
            </CardContent>
          </Card>
        );
      }

      case 'stats-grid': {
        const statsConfig = config as Record<string, unknown>;
        const gridCols = (statsConfig.columns as number) === 2 ? 'grid-cols-2' : (statsConfig.columns as number) === 4 ? 'grid-cols-4' : 'grid-cols-3';
        return (
          <div className={`grid ${gridCols} gap-4`}>
            {(statsConfig.metrics as string[])?.map((metric: string, idx: number) => {
              const metricData: Record<string, { value: string | number; label: string; icon: React.ComponentType<Record<string, unknown>> }> = {
                totalUsers: { value: stats?.totalUsers || 0, label: 'Total de Usuários', icon: Users },
                totalRevenue: { value: `R$ ${stats?.totalRevenue?.toLocaleString('pt-BR') || '0'}`, label: 'Receita Total', icon: DollarSign },
                activeClients: { value: stats?.activeClients || 0, label: 'Clientes Ativos', icon: Users },
              };
              const data = metricData[metric] || { value: '0', label: metric, icon: BarChart3 };
              const Icon = data.icon;
              return (
                <Card key={idx} className="bg-[#181e29] border border-gray-700">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-white">{data.value}</div>
                        <div className="text-xs text-gray-400 mt-1">{data.label}</div>
                      </div>
                      <Icon className="w-8 h-8 text-blue-400 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        );

      }
      case 'revenue-card': {
        const revenueConfig = config as Record<string, unknown>;
        return (
          <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700">
            <CardHeader>
              <CardTitle className="text-green-300">Receita</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold text-white mb-2">
                R$ {stats?.totalRevenue?.toLocaleString('pt-BR') || '0'}
              </div>
              {revenueConfig.showGrowth && (
                <div className="text-sm text-green-400 flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  Crescimento este mês
                </div>
              )}
            </CardContent>
          </Card>
        );
      }

      case 'users-table': {
        const usersConfig = config as Record<string, unknown>;
        return (
          <Card className="bg-[#181e29] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700">
                      <th className="text-left p-2 text-gray-400">Nome</th>
                      <th className="text-left p-2 text-gray-400">Email</th>
                      <th className="text-left p-2 text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientes.slice(0, (usersConfig.pageSize as number) || 5).map((cliente: { name?: string; email?: string; status?: string }, idx: number) => (
                      <tr key={idx} className="border-b border-gray-800">
                        <td className="p-2 text-white">{cliente.name || 'N/A'}</td>
                        <td className="p-2 text-gray-400">{cliente.email || 'N/A'}</td>
                        <td className="p-2">
                          <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs">
                            {cliente.status || 'Ativo'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'chart': {
        const chartConfig = config as Record<string, unknown>;
        return (
          <Card className="bg-[#181e29] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Gráfico - {chartConfig.type as string || 'Line'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-center justify-center bg-gray-900/50 rounded border border-gray-800">
                <div className="text-center text-gray-400">
                  <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Gráfico {chartConfig.type as string || 'Line'}</p>
                  <p className="text-xs">Fonte: {chartConfig.dataSource as string || 'revenue'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'form': {
        const formConfig = config as Record<string, unknown>;
        return (
          <Card className="bg-[#181e29] border border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Formulário</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {formConfig.fields ? (
                  (formConfig.fields as Array<{ label?: string; type?: string; placeholder?: string }>).map((field, idx: number) => (
                    <div key={idx} className="space-y-1">
                      <Label className="text-gray-300">{field.label}</Label>
                      <Input
                        type={field.type || 'text'}
                        placeholder={field.placeholder}
                        className="bg-gray-900 border-gray-700 text-white"
                      />
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-sm">Nenhum campo configurado. Edite o componente para adicionar campos.</p>
                )}
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  {formConfig.submitText as string || 'Enviar'}
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      }

      case 'button': {
        const buttonConfig = config as Record<string, unknown>;
        return (
          <Button
            className={`w-full ${
              buttonConfig.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' :
              buttonConfig.variant === 'secondary' ? 'bg-gray-600 hover:bg-gray-700' :
              'bg-green-600 hover:bg-green-700'
            } text-white`}
            onClick={() => {
              if (buttonConfig.link) window.open(buttonConfig.link as string, '_blank');
              if (buttonConfig.action) toast.info(`Ação: ${buttonConfig.action as string}`);
            }}
          >
            {buttonConfig.text as string || 'Clique aqui'}
          </Button>
        );
      }

      case 'text': {
        const textConfig = config as Record<string, unknown>;
        const textSizes: Record<string, string> = { small: 'text-sm', medium: 'text-base', large: 'text-lg', xlarge: 'text-2xl' };
        const textAligns: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };
        return (
          <div className={`${textSizes[textConfig.size as string || 'medium']} ${textAligns[textConfig.align as string || 'left']} text-white`}>
            {textConfig.content as string || 'Digite seu texto aqui'}
          </div>
        );

      }
      case 'image': {
        const imageConfig = config as Record<string, unknown>;
        return imageConfig.src ? (
          <img
            src={imageConfig.src as string}
            alt={imageConfig.alt as string || ''}
            style={{ width: imageConfig.width as string || '100%', height: imageConfig.height as string || 'auto' }}
            className="rounded-lg"
          />
        ) : (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-400">
            <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma imagem configurada</p>
          </div>
        );
      }

      case 'video': {
        const videoConfig = config as Record<string, unknown>;
        return videoConfig.src ? (
          <video
            src={videoConfig.src as string}
            controls={videoConfig.controls as boolean}
            autoPlay={videoConfig.autoplay as boolean}
            className="w-full rounded-lg"
          />
        ) : (
          <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center text-gray-400">
            <Video className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum vídeo configurado</p>
          </div>
        );
      }

      case 'list': {
        const listConfig = config as Record<string, unknown>;
        return listConfig.ordered ? (
          <ol className="list-decimal list-inside">
            {(listConfig.items as string[])?.length > 0 ? (
              (listConfig.items as string[]).map((item: string, idx: number) => (
                <li key={idx} className="text-white mb-1">{item}</li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">Nenhum item na lista. Edite o componente para adicionar itens.</li>
            )}
          </ol>
        ) : (
          <ul className="list-disc list-inside">
            {(listConfig.items as string[])?.length > 0 ? (
              (listConfig.items as string[]).map((item: string, idx: number) => (
                <li key={idx} className="text-white mb-1">{item}</li>
              ))
            ) : (
              <li className="text-gray-400 text-sm">Nenhum item na lista. Edite o componente para adicionar itens.</li>
            )}
          </ul>
        );
      }

      case 'columns': {
        const columnsConfig = config as Record<string, unknown>;
        const colCount = (columnsConfig.count as number) || 2;
        return (
          <div className={`grid grid-cols-${colCount} gap-${columnsConfig.gap as string || 'medium'}`}>
            {Array.from({ length: colCount }).map((_, idx) => (
              <div key={idx} className="border border-gray-700 rounded p-4 bg-gray-900/30">
                <p className="text-gray-400 text-sm">Coluna {idx + 1}</p>
              </div>
            ))}
          </div>
        );

      }
      default:
        return (
          <div className="border border-gray-700 rounded p-4 text-gray-400 text-center">
            Componente desconhecido: {type}
          </div>
        );
    }
  };

  // Componente PageBuilderContent
  type PageBuilderContentProps = {
    pageForm: Page;
    setPageForm: (p: Page) => void;
    availableComponents: typeof availableComponents;
    addComponent: (t: string) => void;
    removeComponent: (id: string) => void;
    updateComponent: (id: string, cfg: Partial<ComponentConfig>) => void;
    selectedComponent: PageComponent | null;
    setSelectedComponent: (c: PageComponent | null) => void;
    handleDragEnd: (e: DragEndEvent) => void;
    sensors: ReturnType<typeof useSensors> | undefined;
    stats: { totalUsers?: number; totalRevenue?: number; activeClients?: number } | undefined;
    clientes: Client[];
    generateSlug: (t: string) => string;
    renderComponent: (c: PageComponent) => JSX.Element | null;
  };

  const PageBuilderContent = ({
    pageForm,
    setPageForm,
    availableComponents,
    addComponent,
    removeComponent,
    updateComponent,
    selectedComponent,
    setSelectedComponent,
    handleDragEnd,
    sensors,
    stats,
    clientes,
    generateSlug,
    renderComponent,
  }: PageBuilderContentProps) => {
    const categories = Array.from(new Set(availableComponents.map((c) => c.category)));

    return (
      <div className="flex h-[calc(95vh-100px)]">
        {/* Sidebar de Componentes */}
        <div className="w-64 border-r border-gray-700 bg-[#1a1f2e] overflow-y-auto">
          <div className="p-4 border-b border-gray-700">
            <h3 className="font-semibold text-white mb-2">Componentes</h3>
            <Input
              placeholder="Buscar..."
              className="bg-gray-900 border-gray-700 text-white text-sm"
            />
          </div>
          <div className="p-4 space-y-4">
            {categories.map((category: string) => (
              <div key={category}>
                <h4 className="text-xs font-semibold text-gray-400 uppercase mb-2">{category}</h4>
                <div className="space-y-1">
                  {availableComponents
                    .filter((c) => c.category === category)
                    .map((component) => (
                      <button
                        key={component.id}
                        onClick={() => addComponent(component.id)}
                        className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-800 text-left text-sm text-gray-300 hover:text-white transition-colors"
                      >
                        {React.createElement(component.icon, { className: "w-4 h-4" })}
                        {component.name}
                      </button>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área de Edição/Preview */}
        <div className="flex-1 flex flex-col">
          {/* Tabs: Informações Básicas e Preview */}
          <Tabs defaultValue="preview" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4">
              <TabsTrigger value="info">Informações</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="flex-1 overflow-y-auto p-6">
              <div className="space-y-4 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <Label htmlFor="page-title" className="text-gray-300">Título <span className="text-red-400">*</span></Label>
                      <Input
                        id="page-title"
                        value={pageForm.title}
                        onChange={(e) => {
                          setPageForm({
                            ...pageForm,
                            title: e.target.value,
                            slug: pageForm.slug || generateSlug(e.target.value),
                          });
                        }}
                        className="bg-gray-900 border-gray-700 text-white"
                        placeholder="Título da página"
                        title="Título da página"
                      />
                    </div>
                  <div className="space-y-2">
                    <Label htmlFor="page-slug" className="text-gray-300">URL <span className="text-red-400">*</span></Label>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-400 text-sm">/page/</span>
                      <Input
                        id="page-slug"
                        value={pageForm.slug}
                        onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase() })}
                        className="flex-1 bg-gray-900 border-gray-700 text-white"
                        placeholder="slug-da-pagina"
                        title="Parte final da URL (slug)"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="page-description" className="text-gray-300">Descrição</Label>
                  <Input
                    id="page-description"
                    value={pageForm.description}
                    onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
                    className="bg-gray-900 border-gray-700 text-white"
                    placeholder="Breve descrição da página"
                    title="Descrição da página"
                  />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cor de Fundo</Label>
                    <div className="flex gap-2">
                        <input
                          aria-label="Selecionar cor de fundo"
                          type="color"
                          value={pageForm.backgroundColor}
                          onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                          className="w-12 h-10 rounded border border-gray-700"
                        />
                        <Input
                          id="page-bg-hex"
                          value={pageForm.backgroundColor}
                          onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                          className="flex-1 bg-gray-900 border-gray-700 text-white"
                          placeholder="#000000"
                          title="Cor de fundo (hex)"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cor do Texto</Label>
                    <div className="flex gap-2">
                      <input
                        aria-label="Selecionar cor do texto"
                        type="color"
                        value={pageForm.textColor}
                        onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-700"
                      />
                      <Input
                        id="page-text-hex"
                        value={pageForm.textColor}
                        onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                        className="flex-1 bg-gray-900 border-gray-700 text-white"
                        placeholder="#ffffff"
                        title="Cor do texto (hex)"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Cor Primária</Label>
                    <div className="flex gap-2">
                      <input
                        aria-label="Selecionar cor primária"
                        type="color"
                        value={pageForm.primaryColor}
                        onChange={(e) => setPageForm({ ...pageForm, primaryColor: e.target.value })}
                        className="w-12 h-10 rounded border border-gray-700"
                      />
                      <Input
                        id="page-primary-hex"
                        value={pageForm.primaryColor}
                        onChange={(e) => setPageForm({ ...pageForm, primaryColor: e.target.value })}
                        className="flex-1 bg-gray-900 border-gray-700 text-white"
                        placeholder="#7c3aed"
                        title="Cor primária (hex)"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-y-auto p-6">
              <div
                className="min-h-full p-8 rounded-lg"
                style={{
                  backgroundColor: pageForm.backgroundColor,
                  color: pageForm.textColor,
                }}
              >
                {pageForm.components.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Layout className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">Nenhum componente adicionado</p>
                    <p className="text-sm">Arraste componentes da barra lateral para começar</p>
                  </div>
                ) : (
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                  >
                    <SortableContext
                      items={pageForm.components.map((c: PageComponent) => c.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {pageForm.components
                        .sort((a: PageComponent, b: PageComponent) => (a.order || 0) - (b.order || 0))
                        .map((component: PageComponent) => (
                          <div key={component.id} className="mb-4">
                            {renderComponent(component)}
                          </div>
                        ))}
                    </SortableContext>
                  </DndContext>
                )}
              </div>
            </TabsContent>
          </Tabs>

          {/* Lista de Componentes (Lateral Direita) */}
          <div className="w-80 border-l border-gray-700 bg-[#1a1f2e] overflow-y-auto">
            <div className="p-4 border-b border-gray-700">
              <h3 className="font-semibold text-white">Componentes da Página</h3>
            </div>
            <div className="p-4">
              {pageForm.components.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">
                  Nenhum componente adicionado
                </p>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={pageForm.components.map((c: PageComponent) => c.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {pageForm.components
                      .sort((a: PageComponent, b: PageComponent) => (a.order || 0) - (b.order || 0))
                      .map((component: PageComponent) => (
                        <SortableComponentItem
                          key={component.id}
                          component={component}
                          onSelect={setSelectedComponent}
                          onRemove={removeComponent}
                        />
                      ))}
                  </SortableContext>
                </DndContext>
              )}
            </div>
          </div>
        </div>

        {/* Painel de Propriedades */}
        {selectedComponent && (
          <div className="w-80 border-l border-gray-700 bg-[#1a1f2e] overflow-y-auto">
            <div className="p-4 border-b border-gray-700 flex items-center justify-between">
              <h3 className="font-semibold text-white">Propriedades</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedComponent(null)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-4">
              <ComponentPropertiesEditor
                component={selectedComponent}
                onUpdate={(config) => updateComponent(selectedComponent!.id, config)}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  // Editor de Propriedades do Componente
  type ComponentPropertiesEditorProps = {
    component: PageComponent;
    onUpdate: (cfg: Partial<ComponentConfig>) => void;
  };
  const ComponentPropertiesEditor = ({ component, onUpdate }: ComponentPropertiesEditorProps) => {
    const { type } = component;
    const config = (component.config ?? ({} as ComponentConfig));

    const updateConfig = (key: string, value: unknown) => {
      onUpdate({ [key]: value } as Partial<ComponentConfig>);
    };

    switch (type) {
      case 'metric-card':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Título</Label>
              <Input
                value={config.title || ''}
                onChange={(e) => updateConfig('title', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                title="Título da métrica"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Valor</Label>
              <Input
                value={config.value || ''}
                onChange={(e) => updateConfig('value', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                title="Valor da métrica"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Label</Label>
              <Input
                value={config.label || ''}
                onChange={(e) => updateConfig('label', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                title="Rótulo da métrica"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Cor</Label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={config.color || pageForm.primaryColor}
                  onChange={(e) => updateConfig('color', e.target.value)}
                  className="w-12 h-10 rounded border border-gray-700"
                  title="Selecionar cor"
                />
                <Input
                  value={config.color || pageForm.primaryColor}
                  onChange={(e) => updateConfig('color', e.target.value)}
                  className="flex-1 bg-gray-900 border-gray-700 text-white"
                  title="Hex da cor"
                />
              </div>
            </div>
          </>
        );

      case 'stats-grid':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Colunas</Label>
              <select
                value={config.columns || 3}
                onChange={(e) => updateConfig('columns', parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Número de colunas"
              >
                <option value={2}>2 Colunas</option>
                <option value={3}>3 Colunas</option>
                <option value={4}>4 Colunas</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Métricas</Label>
              <div className="space-y-2">
                {['totalUsers', 'totalRevenue', 'activeClients'].map((metric) => (
                  <label key={metric} className="flex items-center gap-2 text-sm text-gray-300">
                    <input
                      type="checkbox"
                      checked={config.metrics?.includes(metric) || false}
                      onChange={(e) => {
                        const current = config.metrics || [];
                        const updated = e.target.checked
                          ? [...current, metric]
                          : current.filter((m: string) => m !== metric);
                        updateConfig('metrics', updated);
                      }}
                      className="accent-blue-500"
                    />
                    {metric}
                  </label>
                ))}
              </div>
            </div>
          </>
        );

      case 'button':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Texto</Label>
              <Input
                value={config.text || ''}
                onChange={(e) => updateConfig('text', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                title="Texto do botão"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Variante</Label>
              <select
                value={config.variant || 'primary'}
                onChange={(e) => updateConfig('variant', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Variante do botão"
              >
                <option value="primary">Primário</option>
                <option value="secondary">Secundário</option>
                <option value="success">Sucesso</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Link (URL)</Label>
              <Input
                value={config.link || ''}
                onChange={(e) => updateConfig('link', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="https://..."
                title="URL de destino"
              />
            </div>
          </>
        );

      case 'text':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Conteúdo</Label>
              <textarea
                value={config.content || ''}
                onChange={(e) => updateConfig('content', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 min-h-[100px] focus:border-blue-500 focus:outline-none"
                title="Conteúdo do texto"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Tamanho</Label>
              <select
                value={config.size || 'medium'}
                onChange={(e) => updateConfig('size', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Tamanho do texto"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
                <option value="xlarge">Extra Grande</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Alinhamento</Label>
              <select
                value={config.align || 'left'}
                onChange={(e) => updateConfig('align', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Alinhamento do texto"
              >
                <option value="left">Esquerda</option>
                <option value="center">Centro</option>
                <option value="right">Direita</option>
              </select>
            </div>
          </>
        );

      case 'revenue-card':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Mostrar Crescimento</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showGrowth || false}
                  onChange={(e) => updateConfig('showGrowth', e.target.checked)}
                  className="accent-blue-500"
                  title="Mostrar indicador de crescimento"
                />
                <span className="text-sm text-gray-300">Exibir indicador de crescimento</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Período</Label>
              <select
                value={config.period || 'month'}
                onChange={(e) => updateConfig('period', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar período"
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
              </select>
            </div>
          </>
        );

      case 'users-table':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Mostrar Busca</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showSearch || false}
                  onChange={(e) => updateConfig('showSearch', e.target.checked)}
                  className="accent-blue-500"
                  title="Habilitar campo de busca"
                />
                <span className="text-sm text-gray-300">Habilitar campo de busca</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Mostrar Paginação</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.showPagination || false}
                  onChange={(e) => updateConfig('showPagination', e.target.checked)}
                  className="accent-blue-500"
                  title="Habilitar paginação"
                />
                <span className="text-sm text-gray-300">Habilitar paginação</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Itens por Página</Label>
              <Input
                type="number"
                value={config.pageSize || 10}
                onChange={(e) => updateConfig('pageSize', parseInt(e.target.value) || 10)}
                className="bg-gray-900 border-gray-700 text-white"
                min="1"
                max="100"
              />
            </div>
          </>
        );

      case 'chart':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Tipo de Gráfico</Label>
              <select
                value={config.type || 'line'}
                onChange={(e) => updateConfig('type', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar tipo de gráfico"
              >
                <option value="line">Linha</option>
                <option value="bar">Barras</option>
                <option value="pie">Pizza</option>
                <option value="area">Área</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Fonte de Dados</Label>
              <select
                value={config.dataSource || 'revenue'}
                onChange={(e) => updateConfig('dataSource', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar fonte de dados"
              >
                <option value="revenue">Receita</option>
                <option value="users">Usuários</option>
                <option value="clients">Clientes</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Período</Label>
              <select
                value={config.period || 'month'}
                onChange={(e) => updateConfig('period', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar período do gráfico"
              >
                <option value="day">Dia</option>
                <option value="week">Semana</option>
                <option value="month">Mês</option>
                <option value="year">Ano</option>
              </select>
            </div>
          </>
        );

      case 'form':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Texto do Botão</Label>
              <Input
                value={config.submitText || 'Enviar'}
                onChange={(e) => updateConfig('submitText', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Ação (URL)</Label>
              <Input
                value={config.action || ''}
                onChange={(e) => updateConfig('action', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="/api/submit"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Campos do Formulário</Label>
              <p className="text-xs text-gray-400">Adicione campos editando o componente diretamente no código.</p>
            </div>
          </>
        );

      case 'image':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">URL da Imagem</Label>
              <Input
                value={config.src || ''}
                onChange={(e) => updateConfig('src', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Texto Alternativo</Label>
              <Input
                value={config.alt || ''}
                onChange={(e) => updateConfig('alt', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-300">Largura</Label>
                <Input
                  value={config.width || '100%'}
                  onChange={(e) => updateConfig('width', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300">Altura</Label>
                <Input
                  value={config.height || 'auto'}
                  onChange={(e) => updateConfig('height', e.target.value)}
                  className="bg-gray-900 border-gray-700 text-white"
                />
              </div>
            </div>
          </>
        );

      case 'video':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">URL do Vídeo</Label>
              <Input
                value={config.src || ''}
                onChange={(e) => updateConfig('src', e.target.value)}
                className="bg-gray-900 border-gray-700 text-white"
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Controles</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.controls !== false}
                  onChange={(e) => updateConfig('controls', e.target.checked)}
                  className="accent-blue-500"
                  title="Mostrar controles do vídeo"
                />
                <span className="text-sm text-gray-300">Mostrar controles</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Autoplay</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.autoplay || false}
                  onChange={(e) => updateConfig('autoplay', e.target.checked)}
                  className="accent-blue-500"
                  title="Reproduzir vídeo automaticamente"
                />
                <span className="text-sm text-gray-300">Reproduzir automaticamente</span>
              </div>
            </div>
          </>
        );

      case 'list':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Lista Ordenada</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={config.ordered || false}
                  onChange={(e) => updateConfig('ordered', e.target.checked)}
                  className="accent-blue-500"
                  title="Lista ordenada (numerada)"
                />
                <span className="text-sm text-gray-300">Usar numeração</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Itens da Lista (um por linha)</Label>
              <textarea
                value={config.items?.join('\n') || ''}
                onChange={(e) => {
                  const items = e.target.value.split('\n').filter(item => item.trim());
                  updateConfig('items', items);
                }}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 min-h-[100px] focus:border-blue-500 focus:outline-none"
                placeholder="Item 1&#10;Item 2&#10;Item 3"
              />
            </div>
          </>
        );

      case 'columns':
        return (
          <>
            <div className="space-y-2">
              <Label className="text-gray-300">Número de Colunas</Label>
              <select
                value={config.count || 2}
                onChange={(e) => updateConfig('count', parseInt(e.target.value))}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar número de colunas"
              >
                <option value={2}>2 Colunas</option>
                <option value={3}>3 Colunas</option>
                <option value={4}>4 Colunas</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-300">Espaçamento</Label>
              <select
                value={config.gap || 'medium'}
                onChange={(e) => updateConfig('gap', e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2"
                title="Selecionar espaçamento entre colunas"
              >
                <option value="small">Pequeno</option>
                <option value="medium">Médio</option>
                <option value="large">Grande</option>
              </select>
            </div>
          </>
        );

      default:
        return (
          <div className="text-gray-400 text-sm">
            Propriedades específicas para este componente em breve.
          </div>
        );
    }
  };

  const navItems = [
    { id: 'marca', title: 'Marca', icon: Paintbrush, description: 'Logo, nome e informações.', color: 'purple' },
    { id: 'visual', title: 'Visual', icon: Palette, description: 'Cores, fontes e temas.', color: 'green' },
    { id: 'avancado', title: 'Avançado', icon: Code, description: 'Domínio, scripts e SEO.', color: 'blue' },
    { id: 'funcionalidades', title: 'Funcionalidades', icon: Sliders, description: 'Módulos e integrações.', color: 'yellow' },
    { id: 'whitelabel', title: 'WhiteLabel', icon: Star, description: 'Sua marca própria.', color: 'red' },
    { id: 'sites', title: 'Gestão de Sites', icon: Globe, description: 'Gerencie múltiplos sites/marcas.', color: 'green' },
    { id: 'paginas', title: 'Páginas', icon: Globe, description: 'Criar páginas personalizadas.', color: 'blue' },
  ];
  // CRUD de sites
  const openNewSite = () => {
    setEditingSite(null);
    setSiteForm({ name: '', domain: '', status: 'ativo', dashboards: [] });
    setSiteModal(true);
  };
  const openEditSite = (site: Site) => {
    setEditingSite(site);
    setSiteForm(site);
    setSiteModal(true);
  };
  const saveSite = () => {
    if (!siteForm.name?.trim() || !siteForm.domain?.trim()) {
      toast.error('Nome e domínio são obrigatórios');
      return;
    }
    let updatedSites;
    let savedSite;
    if (editingSite) {
      savedSite = { ...editingSite, ...siteForm } as Site;
      updatedSites = sites.map(s => s.id === editingSite.id ? savedSite : s);
      toast.success('Site atualizado com sucesso!');
    } else {
      savedSite = { ...siteForm, id: Date.now(), dashboards: siteForm.dashboards || [] } as Site;
      updatedSites = [...sites, savedSite];
      toast.success('Site criado com sucesso!');
    }
    setSites(updatedSites);
    setSiteModal(false);
  };
  const removeSite = (id: number) => {
    const updatedSites = sites.filter(s => s.id !== id);
    setSites(updatedSites);
    toast.success('Site removido com sucesso!');
  };


  const colorClasses = {
    purple: {
      border: 'border-purple-500',
      shadow: 'shadow-purple-500/20',
      hoverBorder: 'hover:border-purple-600',
      from: 'from-purple-900/30',
      to: 'to-purple-800/20',
      icon: 'text-purple-400'
    },
    green: {
      border: 'border-green-500',
      shadow: 'shadow-green-500/20',
      hoverBorder: 'hover:border-green-600',
      from: 'from-green-900/30',
      to: 'to-green-800/20',
      icon: 'text-green-400'
    },
    blue: {
      border: 'border-blue-500',
      shadow: 'shadow-blue-500/20',
      hoverBorder: 'hover:border-blue-600',
      from: 'from-blue-900/30',
      to: 'to-blue-800/20',
      icon: 'text-blue-400'
    },
    yellow: {
      border: 'border-yellow-500',
      shadow: 'shadow-yellow-500/20',
      hoverBorder: 'hover:border-yellow-600',
      from: 'from-yellow-900/30',
      to: 'to-yellow-800/20',
      icon: 'text-yellow-400'
    },
    red: {
      border: 'border-red-500',
      shadow: 'shadow-red-500/20',
      hoverBorder: 'hover:border-red-600',
      from: 'from-red-900/30',
      to: 'to-red-800/20',
      icon: 'text-red-400'
    }
  };

  // Se estiver visualizando um dashboard, mostrar a visualização
  if (viewingDashboard) {
    const getGridCols = (layout: string) => {
      switch (layout) {
        case 'Compacto': return 'grid-cols-1 md:grid-cols-3 lg:grid-cols-4';
        case 'Espaçado': return 'grid-cols-1 md:grid-cols-2';
        case 'Grid': return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
        case 'Lista': return 'grid-cols-1';
        default: return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
      }
    };

    return (
      <div className="max-w-full w-full h-full overflow-auto p-4">
        {/* Header do Dashboard */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => setViewingDashboard(null)}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: viewingDashboard.color }}
                  />
                  {viewingDashboard.name}
                </h1>
                <p className="text-gray-400 text-sm mt-1">
                  Layout: {viewingDashboard.layout} • {viewingDashboard.widgets.length} Widgets
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => openEditDashboard(viewingDashboard)}
                className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
            </div>
          </div>
        </div>

        {/* Renderização dos Widgets */}
        <div className={`grid ${getGridCols(viewingDashboard.layout)} gap-4`}>
          {viewingDashboard.order.map((widget: string, index: number) => 
            renderWidget(widget, index)
          )}
        </div>

        {/* Mensagem se não houver widgets */}
        {viewingDashboard.order.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <BarChart3 className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg">Nenhum widget configurado</p>
            <p className="text-sm">Edite este dashboard para adicionar widgets</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-full w-full h-full overflow-auto p-4">
      <div className="flex items-center space-x-3 mb-2">
        <Paintbrush className="w-7 h-7 text-purple-400" />
        <h1 className="text-3xl font-bold text-white">Customizar Marca</h1>
      </div>
      <p className="text-gray-400 mb-6">Personalize a aparência e identidade da sua plataforma</p>
      
      {/* Navegação por Cards */}
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

      {/* Conteúdo Renderizado */}
      <div>
        {tab === 'marca' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Coluna principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações da Empresa */}
              <Card className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-purple-300 font-semibold text-lg">Informações da Empresa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="company-name" className="text-gray-300 font-medium">
                        Nome da Empresa <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        id="company-name"
                        value={brand.name} 
                        onChange={e => setBrand({ ...brand, name: e.target.value })} 
                        className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500" 
                        placeholder="Digite o nome da empresa"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="slogan" className="text-gray-300 font-medium">
                        Slogan
                      </Label>
                      <Input 
                        id="slogan"
                        value={brand.slogan} 
                        onChange={e => setBrand({ ...brand, slogan: e.target.value })} 
                        className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500" 
                        placeholder="Digite o slogan da empresa"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-gray-300 font-medium">
                      Descrição
                    </Label>
                    <textarea 
                      id="description"
                      value={brand.description} 
                      onChange={e => setBrand({ ...brand, description: e.target.value })} 
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-2 min-h-[80px] focus:border-purple-500 focus:outline-none resize-y" 
                      placeholder="Descreva sua empresa..."
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-gray-300 font-medium">
                        Website <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        id="website"
                        type="url"
                        value={brand.website} 
                        onChange={e => setBrand({ ...brand, website: e.target.value })} 
                        className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500" 
                        placeholder="https://exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-300 font-medium">
                        E-mail <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        id="email"
                        type="email"
                        value={brand.email} 
                        onChange={e => setBrand({ ...brand, email: e.target.value })} 
                        className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500" 
                        placeholder="contato@exemplo.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-gray-300 font-medium">
                        Telefone <span className="text-red-400">*</span>
                      </Label>
                      <Input 
                        id="phone"
                        value={brand.phone} 
                        onChange={e => setBrand({ ...brand, phone: e.target.value })} 
                        className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500" 
                        placeholder="(00) 00000-0000"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
              {/* Logos e Ícones */}
              <Card className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 shadow-lg">
                <CardHeader>
                  <CardTitle className="text-purple-300 font-semibold text-lg">Logos e Ícones</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Logo */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-500/40 rounded-xl p-6 bg-[#181e29] hover:border-purple-500 transition-colors">
                      {brand.logo ? (
                        <div className="mb-4">
                          <img src={brand.logo} alt="Logo" className="h-20 max-w-full object-contain mb-2 rounded" />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 text-white border-0 mt-2"
                            onClick={() => {
                              setBrand({ ...brand, logo: '' });
                              setLogoFile(null);
                              toast.info('Logo removido');
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-12 h-12 text-purple-400 mb-3" />
                          <p className="text-gray-400 text-xs mb-4 text-center">
                            Clique para fazer upload<br />
                            PNG, JPG até 1MB
                          </p>
                        </>
                      )}
                      <Button 
                        className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white w-full" 
                        onClick={() => setLogoModal(true)}
                      >
                        {brand.logo ? 'Alterar Logo' : 'Selecionar Logo'}
                      </Button>
                    </div>
                    {/* Favicon */}
                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-purple-500/40 rounded-xl p-6 bg-[#181e29] hover:border-purple-500 transition-colors">
                      {brand.favicon ? (
                        <div className="mb-4">
                          <img src={brand.favicon} alt="Favicon" className="h-12 w-12 mb-2 rounded" />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-red-600 hover:bg-red-700 text-white border-0 mt-2"
                            onClick={() => {
                              setBrand({ ...brand, favicon: '' });
                              setFaviconFile(null);
                              toast.info('Favicon removido');
                            }}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Remover
                          </Button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud className="w-12 h-12 text-purple-400 mb-3" />
                          <p className="text-gray-400 text-xs mb-4 text-center">
                            Clique para fazer upload<br />
                            ICO, PNG até 1MB
                          </p>
                        </>
                      )}
                      <Button 
                        className="bg-[#7e22ce] hover:bg-[#6d1bb7] text-white w-full" 
                        onClick={() => setFaviconModal(true)}
                      >
                        {brand.favicon ? 'Alterar Favicon' : 'Selecionar Favicon'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            {/* Coluna Preview */}
            <div className="space-y-6">
              <Card className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 shadow-lg min-w-[260px]">
                <CardHeader>
                  <CardTitle className="text-purple-300 font-semibold text-lg">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-[#181e29] rounded-lg p-4 flex flex-col items-center space-y-4">
                    {/* Simulação de navegador */}
                    <div className="w-full bg-gray-800 rounded-t-lg p-2 flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div className="w-3 h-3 rounded-full bg-yellow-500" />
                      <div className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    
                    {/* Preview do header */}
                    <div className="w-full bg-white rounded-b-lg p-4 shadow-lg">
                      <div className="flex items-center gap-3 mb-3">
                        {brand.logo ? (
                          <img src={brand.logo} alt="Logo" className="h-8 max-w-[120px] object-contain" />
                        ) : (
                          <div className="h-8 w-32 bg-gray-300 rounded flex items-center justify-center">
                            <span className="text-xs font-bold text-gray-600">Logo</span>
                          </div>
                        )}
                        {brand.favicon && (
                          <img src={brand.favicon} alt="Favicon" className="h-6 w-6" />
                        )}
                      </div>
                      <h2 className="text-lg font-bold text-gray-800 mb-1">{brand.name || 'Nome da Empresa'}</h2>
                      {brand.slogan && (
                        <p className="text-sm text-gray-600 mb-2">{brand.slogan}</p>
                      )}
                      {brand.description && (
                        <p className="text-xs text-gray-500 line-clamp-2">{brand.description}</p>
                      )}
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500 space-y-1">
                          <div><strong>Website:</strong> {brand.website || 'Não informado'}</div>
                          <div><strong>E-mail:</strong> {brand.email || 'Não informado'}</div>
                          <div><strong>Telefone:</strong> {brand.phone || 'Não informado'}</div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Informações do template */}
                    <div className="text-xs text-gray-400 space-y-1 w-full">
                      <div className="flex justify-between">
                        <span>Template:</span>
                        <span className="text-gray-300">Moderno</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Fonte:</span>
                        <span className="text-gray-300">Inter</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Idioma:</span>
                        <span className="text-gray-300">Português (BR)</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {/* Botões de ação */}
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={handleSave}
                  disabled={!hasChanges}
                  className={`w-full px-6 py-2 rounded font-semibold transition-all ${
                    hasChanges 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                      : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {hasChanges ? (
                    <>
                      <Check className="w-4 h-4 mr-2 inline" />
                      Salvar Configuração
                    </>
                  ) : (
                    'Nenhuma alteração'
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={!hasChanges}
                  className={`w-full px-6 py-2 rounded font-semibold transition-all ${
                    hasChanges 
                      ? 'bg-gray-700 hover:bg-gray-600 text-white border-gray-600' 
                      : 'bg-gray-800 text-gray-500 border-gray-700 cursor-not-allowed'
                  }`}
                >
                  <X className="w-4 h-4 mr-2 inline" />
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        )}
        {tab === 'visual' && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 shadow-lg">
              <span className="block text-purple-300 font-semibold mb-4 text-lg">Cores e Aparência</span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Cor Primária</label>
                  <input id="brand-primary-color" title="Cor Primária" aria-label="Cor Primária" type="color" className="w-12 h-12 p-0 border-none bg-transparent" />
                </div>
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Cor Secundária</label>
                  <input id="brand-secondary-color" title="Cor Secundária" aria-label="Cor Secundária" type="color" className="w-12 h-12 p-0 border-none bg-transparent" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-300 mb-1 font-medium">Fonte</label>
                  <select className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2" title="Selecionar fonte">
                    <option>Inter</option>
                    <option>Roboto</option>
                    <option>Montserrat</option>
                    <option>Poppins</option>
                  </select>
                </div>
                <div className="flex items-center gap-3 mt-6">
                  <input id="brand-dark-mode" title="Modo escuro" aria-label="Modo escuro" type="checkbox" className="accent-purple-500" />
                  <label htmlFor="brand-dark-mode" className="text-gray-300">Modo escuro</label>
                </div>
              </div>
              <div className="mt-6">
                <span className="block text-gray-400 mb-2">Preview</span>
                <div className="rounded-lg bg-[#181e29] p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-purple-600" />
                  <div className="flex-1">
                    <div className="h-3 w-2/3 bg-purple-400 rounded mb-1" />
                    <div className="h-3 w-1/2 bg-purple-200 rounded" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {tab === 'avancado' && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 shadow-lg">
              <span className="block text-purple-300 font-semibold mb-4 text-lg">Configurações Avançadas</span>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Domínio Personalizado</label>
                <Input placeholder="https://seudominio.com" className="bg-gray-900 border border-gray-700 text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Google Analytics</label>
                <Input placeholder="UA-XXXXXX-X" className="bg-gray-900 border border-gray-700 text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Scripts Customizados</label>
                <textarea className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 min-h-[60px]" placeholder="Cole aqui seu script..."></textarea>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <input id="enable-cdn" title="Ativar CDN de performance" aria-label="Ativar CDN de performance" type="checkbox" className="accent-purple-500" />
                <label htmlFor="enable-cdn" className="text-gray-300">Ativar CDN de performance</label>
              </div>
            </div>
          </div>
        )}
        {tab === 'funcionalidades' && (
          <div className="space-y-6">
            {/* Módulos e Funcionalidades */}
            <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 shadow-lg">
              <span className="block text-purple-300 font-semibold mb-4 text-lg">Módulos e Funcionalidades</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" defaultChecked title="Módulo E-commerce" />
                  <span className="text-gray-300">E-commerce</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" defaultChecked title="Módulo Gamificação" />
                  <span className="text-gray-300">Gamificação</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" title="Módulo Notificações" />
                  <span className="text-gray-300">Notificações</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" title="Módulo Exportação de Dados" />
                  <span className="text-gray-300">Exportação de Dados</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" title="Módulo Relatórios Avançados" />
                  <span className="text-gray-300">Relatórios Avançados</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="accent-purple-500" defaultChecked title="Módulo Chatbot IA" />
                  <span className="text-gray-300">Chatbot IA</span>
                </div>
              </div>
            </div>

            {/* Dashboards Personalizados */}
            <div className="rounded-2xl border border-purple-700/40 bg-gradient-to-br from-purple-900/50 to-purple-800/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="block text-purple-300 font-semibold text-lg">Dashboards Personalizados</span>
                <Button 
                  onClick={openNewDashboard}
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Dashboard
                </Button>
              </div>
              
              {dashboards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p className="mb-2">Nenhum dashboard personalizado criado ainda.</p>
                  <p className="text-sm">Clique em "Novo Dashboard" para criar um.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboards.map((dashboard) => (
                    <Card 
                      key={dashboard.id} 
                      className="bg-[#181e29] border border-gray-700 hover:border-purple-500 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base mb-1">{dashboard.name}</CardTitle>
                            <p className="text-xs text-gray-400">Layout: {dashboard.layout}</p>
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: dashboard.color }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-gray-400 font-medium">Widgets:</p>
                          <div className="flex flex-wrap gap-1">
                            {dashboard.widgets.slice(0, 3).map((widget, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 bg-purple-900/30 text-purple-300 rounded"
                              >
                                {widget}
                              </span>
                            ))}
                            {dashboard.widgets.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                                +{dashboard.widgets.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          {dashboard.realtime && (
                            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">
                              Tempo Real
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingDashboard(dashboard)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white border-purple-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDashboard(dashboard)}
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este dashboard?')) {
                                removeDashboard(dashboard.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'whitelabel' && (
          <div className="max-w-2xl space-y-6">
            <div className="rounded-2xl border border-green-700/40 bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 shadow-lg">
              <span className="block text-green-300 font-semibold mb-4 text-lg">Configurações WhiteLabel</span>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Remover menção à plataforma original</label>
                <input id="whitelabel-remove-mention" title="Remover menção à plataforma original" aria-label="Remover menção à plataforma original" type="checkbox" className="accent-green-500" />
                <label htmlFor="whitelabel-remove-mention" className="ml-2 text-gray-400 text-sm">Oculta qualquer referência à Symphonic Growth Hub</label>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Domínio personalizado exclusivo</label>
                <Input placeholder="https://seudominioexclusivo.com" className="bg-gray-900 border border-gray-700 text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">E-mail de suporte personalizado</label>
                <Input placeholder="suporte@seudominio.com" className="bg-gray-900 border border-gray-700 text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Rodapé customizado</label>
                <textarea className="w-full bg-gray-900 border border-gray-700 text-white rounded p-2 min-h-[60px]" placeholder="Texto do rodapé, links, copyright..."></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Cores e logotipo exclusivos</label>
                <div className="flex gap-4 items-center mt-2">
                  <input id="whitelabel-color" title="Cor Whitelabel" aria-label="Cor Whitelabel" type="color" className="w-10 h-10 p-0 border-none bg-transparent" />
                  <Button className="bg-green-600 hover:bg-green-700 text-white">Upload Logo</Button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-gray-300 mb-1 font-medium">Remover links de documentação padrão</label>
                <input id="whitelabel-remove-links" title="Remover links de documentação padrão" aria-label="Remover links de documentação padrão" type="checkbox" className="accent-green-500" />
              </div>
              <div className="flex justify-end gap-2 mt-6">
                <Button variant="outline" className="bg-gray-700 text-white px-6 py-2 rounded font-semibold">Cancelar</Button>
                <Button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-semibold">Salvar WhiteLabel</Button>
              </div>
            </div>

            {/* Dashboards Personalizados */}
            <div className="rounded-2xl border border-green-700/40 bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="block text-green-300 font-semibold text-lg">Dashboards Personalizados</span>
                <Button 
                  onClick={openNewDashboard}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Dashboard
                </Button>
              </div>
              
              {dashboards.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">Nenhum dashboard personalizado criado ainda.</p>
                  <p className="text-sm">Clique em "Novo Dashboard" para criar um dashboard personalizado.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {dashboards.map((dashboard) => (
                    <Card 
                      key={dashboard.id} 
                      className="bg-[#181e29] border border-gray-700 hover:border-green-500 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base mb-1">{dashboard.name}</CardTitle>
                            <p className="text-xs text-gray-400">Layout: {dashboard.layout}</p>
                          </div>
                          <div 
                            className="w-4 h-4 rounded-full border-2 border-white"
                            style={{ backgroundColor: dashboard.color }}
                          />
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-2 mb-4">
                          <p className="text-xs text-gray-400 font-medium">Widgets:</p>
                          <div className="flex flex-wrap gap-1">
                            {dashboard.widgets.slice(0, 3).map((widget, idx) => (
                              <span 
                                key={idx}
                                className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded"
                              >
                                {widget}
                              </span>
                            ))}
                            {dashboard.widgets.length > 3 && (
                              <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                                +{dashboard.widgets.length - 3}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 mb-4">
                          {dashboard.realtime && (
                            <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">
                              Tempo Real
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingDashboard(dashboard)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white border-green-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDashboard(dashboard)}
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover este dashboard?')) {
                                removeDashboard(dashboard.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        {tab === 'sites' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-green-700/40 bg-gradient-to-br from-green-900/50 to-green-800/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <span className="block text-green-300 font-semibold text-lg">Gestão de Sites/Marcas</span>
                <Button onClick={openNewSite} className="bg-green-600 hover:bg-green-700 text-white">
                  <Plus className="w-4 h-4 mr-2" /> Novo Site/Marca
                </Button>
              </div>
              {sites.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="mb-2">Nenhum site/marca cadastrado ainda.</p>
                  <p className="text-sm">Clique em "Novo Site/Marca" para adicionar.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {sites.map(site => (
                    <Card key={site.id} className="bg-[#181e29] border border-gray-700 hover:border-green-500 transition-colors">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base mb-1">{site.name}</CardTitle>
                            <p className="text-xs text-gray-400">Domínio: {site.domain}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`text-xs px-2 py-1 rounded ${site.status === 'ativo' ? 'bg-green-900/30 text-green-300' : 'bg-gray-700 text-gray-400'}`}>{site.status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
                            </div>
                            <div className="mt-2">
                              <span className="text-xs text-gray-400">Dashboards vinculados:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {site.dashboards.length === 0 ? (
                                  <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">Nenhum</span>
                                ) : (
                                  site.dashboards.map(did => {
                                    const db = dashboards.find(d => d.id === did);
                                    return db ? (
                                      <span key={did} className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">{db.name}</span>
                                    ) : null;
                                  })
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditSite(site)} className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => { if (confirm('Remover este site/marca?')) removeSite(site.id); }} className="bg-red-600 hover:bg-red-700 text-white border-red-600">
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            {/* Modal de Site/Marca */}
            <Dialog open={siteModal} onOpenChange={setSiteModal}>
              <DialogContent className="bg-[#232a36] border border-green-700 text-white max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">{editingSite ? 'Editar Site/Marca' : 'Novo Site/Marca'}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label className="text-gray-300">Nome <span className="text-red-400">*</span></Label>
                    <Input value={siteForm.name || ''} onChange={e => setSiteForm({ ...siteForm, name: e.target.value })} className="bg-gray-900 border-gray-700 text-white" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Domínio <span className="text-red-400">*</span></Label>
                    <Input value={siteForm.domain || ''} onChange={e => setSiteForm({ ...siteForm, domain: e.target.value })} className="bg-gray-900 border-gray-700 text-white" placeholder="https://seudominio.com" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Status</Label>
                    <select value={siteForm.status} onChange={e => setSiteForm({ ...siteForm, status: e.target.value as 'ativo' | 'inativo' })} className="w-full bg-gray-900 border border-gray-700 text-white rounded px-3 py-2" title="Selecionar status do site">
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-gray-300">Dashboards vinculados</Label>
                    <div className="flex flex-wrap gap-2">
                      {dashboards.map(db => (
                        <label key={db.id} className="flex items-center gap-1 text-xs text-gray-300 bg-gray-800 px-2 py-1 rounded cursor-pointer">
                          <input type="checkbox" checked={siteForm.dashboards?.includes(db.id)} onChange={e => {
                            const checked = e.target.checked;
                            setSiteForm(form => ({
                              ...form,
                                                           dashboards: checked
                                ? [...(form.dashboards || []), db.id]
                                : (form.dashboards || []).filter(id => id !== db.id)
                            }));
                          }} className="accent-green-500" />
                          {db.name}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setSiteModal(false)} className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600">Cancelar</Button>
                  <Button onClick={saveSite} className="bg-green-600 hover:bg-green-700 text-white">{editingSite ? 'Salvar Alterações' : 'Criar Site/Marca'}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
        {tab === 'paginas' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-blue-700/40 bg-gradient-to-br from-blue-900/50 to-blue-800/30 p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <span className="block text-blue-300 font-semibold text-lg mb-1">Páginas Personalizadas</span>
                  <p className="text-gray-400 text-sm">Crie páginas de afiliados, landing pages e outras páginas personalizadas</p>
                </div>
                <Button 
                  onClick={openNewPage}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Página
                </Button>
              </div>
              
              {customPages.length === 0 ? (
                <div className="text-center py-12 text-gray-400">
                  <Globe className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p className="mb-2 text-lg">Nenhuma página personalizada criada ainda.</p>
                  <p className="text-sm mb-4">Crie páginas de afiliados, landing pages ou outras páginas personalizadas.</p>
                  <Button 
                    onClick={openNewPage}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Criar Primeira Página
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {customPages.map((page) => (
                    <Card 
                      key={page.id} 
                      className="bg-[#181e29] border border-gray-700 hover:border-blue-500 transition-colors"
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-white text-base mb-1">{page.title}</CardTitle>
                            <p className="text-xs text-gray-400 mb-2">{page.description || 'Sem descrição'}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-300 rounded capitalize">
                                {page.type}
                              </span>
                              {page.isPublished ? (
                                <span className="text-xs px-2 py-1 bg-green-900/30 text-green-300 rounded">
                                  Publicada
                                </span>
                              ) : (
                                <span className="text-xs px-2 py-1 bg-gray-700 text-gray-400 rounded">
                                  Rascunho
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Link2 className="w-3 h-3" />
                            <span className="truncate">/{page.slug}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyPageUrl(page.slug)}
                              className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setViewingPage(page)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Visualizar
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditPage(page)}
                            className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm('Tem certeza que deseja remover esta página?')) {
                                removePage(page.id);
                              }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Modal de upload de logo */}
      <Dialog open={logoModal} onOpenChange={setLogoModal}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Selecionar Logo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <UploadCloud className="w-16 h-16 text-purple-400" />
            <div className="text-center">
              <p className="text-gray-300 mb-2">Selecione uma imagem para o logo</p>
              <p className="text-xs text-gray-400">Formatos aceitos: PNG, JPG</p>
              <p className="text-xs text-gray-400">Tamanho máximo: 1MB</p>
            </div>
            <input 
              type="file" 
              accept="image/png,image/jpeg,image/jpg" 
              onChange={handleLogoUpload} 
              className="hidden" 
              id="logo-upload" 
            />
            <label 
              htmlFor="logo-upload" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors font-medium"
            >
              Escolher arquivo
            </label>
            {logoFile && (
              <div className="mt-2 text-xs text-green-400">
                Arquivo selecionado: {logoFile.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setLogoModal(false);
                setLogoFile(null);
              }} 
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Modal de upload de favicon */}
      <Dialog open={faviconModal} onOpenChange={setFaviconModal}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Selecionar Favicon</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-6">
            <UploadCloud className="w-16 h-16 text-purple-400" />
            <div className="text-center">
              <p className="text-gray-300 mb-2">Selecione uma imagem para o favicon</p>
              <p className="text-xs text-gray-400">Formatos aceitos: PNG, ICO</p>
              <p className="text-xs text-gray-400">Tamanho máximo: 1MB</p>
              <p className="text-xs text-gray-400 mt-1">Recomendado: 32x32 ou 16x16 pixels</p>
            </div>
            <input 
              type="file" 
              accept="image/png,image/x-icon,image/vnd.microsoft.icon" 
              onChange={handleFaviconUpload} 
              className="hidden" 
              id="favicon-upload" 
            />
            <label 
              htmlFor="favicon-upload" 
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg cursor-pointer transition-colors font-medium"
            >
              Escolher arquivo
            </label>
            {faviconFile && (
              <div className="mt-2 text-xs text-green-400">
                Arquivo selecionado: {faviconFile.name}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setFaviconModal(false);
                setFaviconFile(null);
              }} 
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancelar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Dashboard Personalizado */}
      <Dialog open={dashboardModal} onOpenChange={setDashboardModal}>
        <DialogContent className="bg-[#232a36] border border-purple-700 text-white max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingDashboard ? 'Editar Dashboard' : 'Criar Novo Dashboard'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {/* Nome do Dashboard */}
            <div className="space-y-2">
              <Label htmlFor="dashboard-name" className="text-gray-300 font-medium">
                Nome do Dashboard <span className="text-red-400">*</span>
              </Label>
              <Input
                id="dashboard-name"
                value={dashboardForm.name}
                onChange={(e) => setDashboardForm({ ...dashboardForm, name: e.target.value })}
                className="bg-gray-900 border border-gray-700 text-white focus:border-purple-500"
                placeholder="Ex: Dashboard de Vendas"
              />
            </div>

            {/* Layout */}
            <div className="space-y-2">
              <Label htmlFor="dashboard-layout" className="text-gray-300 font-medium">
                Layout
              </Label>
              <select
                id="dashboard-layout"
                value={dashboardForm.layout}
                onChange={(e) => setDashboardForm({ ...dashboardForm, layout: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:border-purple-500 focus:outline-none"
              >
                <option value="Padrão">Padrão</option>
                <option value="Compacto">Compacto</option>
                <option value="Espaçado">Espaçado</option>
                <option value="Grid">Grid</option>
                <option value="Lista">Lista</option>
              </select>
            </div>

            {/* Widgets Disponíveis */}
            <div className="space-y-2">
              <Label className="text-gray-300 font-medium">Widgets Disponíveis</Label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {['Métricas', 'Gráficos', 'Atividades Recentes', 'Notificações', 'Tabelas', 'Calendário', 'Mapas', 'Relatórios', 'Análises'].map((widget) => (
                  <div
                    key={widget}
                    className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                      dashboardForm.widgets.includes(widget)
                        ? 'bg-purple-900/30 border-purple-500 text-purple-300'
                        : 'bg-gray-900 border-gray-700 text-gray-300 hover:border-gray-600'
                    }`}
                    onClick={() => {
                      const newWidgets = dashboardForm.widgets.includes(widget)
                        ? dashboardForm.widgets.filter((w) => w !== widget)
                        : [...dashboardForm.widgets, widget];
                      setDashboardForm({ ...dashboardForm, widgets: newWidgets, order: newWidgets });
                    }}
                  >
                    <input
                      type="checkbox"
                      aria-label={widget}
                      checked={dashboardForm.widgets.includes(widget)}
                      onChange={() => {}}
                      className="accent-purple-500"
                    />
                    <span className="text-sm">{widget}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ordem dos Widgets */}
            {dashboardForm.widgets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Ordem dos Widgets</Label>
                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 space-y-2">
                  {dashboardForm.order.map((widget, index) => (
                    <div
                      key={widget}
                      className="flex items-center gap-3 p-2 bg-gray-800 rounded border border-gray-700"
                    >
                      <GripVertical className="w-5 h-5 text-gray-500 cursor-move" />
                      <span className="flex-1 text-gray-300">{widget}</span>
                      {index > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveWidget(index, index - 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          ↑
                        </Button>
                      )}
                      {index < dashboardForm.order.length - 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => moveWidget(index, index + 1)}
                          className="text-gray-400 hover:text-white"
                        >
                          ↓
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cor e Configurações */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dashboard-color" className="text-gray-300 font-medium">
                  Cor do Tema
                </Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    id="dashboard-color"
                    value={dashboardForm.color}
                    onChange={(e) => setDashboardForm({ ...dashboardForm, color: e.target.value })}
                    className="w-16 h-12 rounded border border-gray-700 cursor-pointer"
                  />
                  <Input
                    value={dashboardForm.color}
                    onChange={(e) => setDashboardForm({ ...dashboardForm, color: e.target.value })}
                    className="flex-1 bg-gray-900 border border-gray-700 text-white focus:border-purple-500"
                    placeholder="#7c3aed"
                    title="Cor do dashboard em formato hexadecimal"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-gray-300 font-medium">Configurações</Label>
                <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="dashboard-realtime"
                    checked={dashboardForm.realtime}
                    onChange={(e) => setDashboardForm({ ...dashboardForm, realtime: e.target.checked })}
                    className="accent-purple-500"
                    title="Habilitar atualização em tempo real do dashboard"
                  />
                  <Label htmlFor="dashboard-realtime" className="text-gray-300 cursor-pointer">
                    Atualização em Tempo Real
                  </Label>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDashboardModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={saveDashboard}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              {editingDashboard ? 'Salvar Alterações' : 'Criar Dashboard'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Página Personalizada com Page Builder */}
      <Dialog open={pageModal} onOpenChange={setPageModal}>
        <DialogContent className="bg-[#232a36] border border-blue-700 text-white max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
          <DialogHeader className="p-6 border-b border-gray-700">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-bold">
                {editingPage ? 'Editar Página' : 'Criar Nova Página'}
              </DialogTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setBuilderMode(!builderMode)}
                  className={builderMode ? 'bg-blue-600 text-white' : 'bg-gray-700 text-white'}
                >
                  <Layout className="w-4 h-4 mr-2" />
                  {builderMode ? 'Modo Simples' : 'Page Builder'}
                </Button>
              </div>
            </div>
          </DialogHeader>
          
          {builderMode ? (
            <>
              <PageBuilderContent
                pageForm={pageForm}
                setPageForm={setPageForm}
                availableComponents={availableComponents}
                addComponent={addComponent}
                removeComponent={removeComponent}
                updateComponent={updateComponent}
                selectedComponent={selectedComponent}
                setSelectedComponent={setSelectedComponent}
                handleDragEnd={handleDragEnd}
                sensors={sensors}
                stats={stats}
                clientes={clientes}
                generateSlug={generateSlug}
                renderComponent={renderComponent}
              />
              <DialogFooter className="p-4 border-t border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setPageModal(false)}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={savePage}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {editingPage ? 'Salvar Alterações' : 'Criar Página'}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
            <div className="space-y-6 py-4 p-6 overflow-y-auto max-h-[calc(95vh-100px)]">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">Informações Básicas</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-title" className="text-gray-300 font-medium">
                    Título da Página <span className="text-red-400">*</span>
                  </Label>
                  <Input
                    id="page-title"
                    value={pageForm.title}
                    onChange={(e) => {
                      setPageForm({ 
                        ...pageForm, 
                        title: e.target.value,
                        slug: pageForm.slug || generateSlug(e.target.value)
                      });
                    }}
                    className="bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                    placeholder="Título da página"
                    title="Título da página"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="page-slug" className="text-gray-300 font-medium">
                    URL (slug) <span className="text-red-400">*</span>
                  </Label>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">/page/</span>
                    <Input
                      id="page-slug"
                      value={pageForm.slug}
                      onChange={(e) => setPageForm({ ...pageForm, slug: e.target.value.toLowerCase() })}
                      className="flex-1 bg-gray-900 border border-gray-700 text-white"
                      placeholder="pagina-afiliados"
                      title="Parte final da URL (slug)"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPageForm({ ...pageForm, slug: generateSlug(pageForm.title) })}
                      className="text-blue-400 hover:text-blue-300"
                    >
                      <Link2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-description" className="text-gray-300 font-medium">
                  Descrição
                </Label>
                <Input
                  id="page-description"
                  value={pageForm.description}
                  onChange={(e) => setPageForm({ ...pageForm, description: e.target.value })}
                  className="bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                  placeholder="Breve descrição da página"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-type" className="text-gray-300 font-medium">
                  Tipo de Página
                </Label>
                <select
                  id="page-type"
                  value={pageForm.type}
                  onChange={(e) => setPageForm({ ...pageForm, type: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:border-blue-500 focus:outline-none"
                >
                  <option value="afiliado">Afiliado</option>
                  <option value="landing">Landing Page</option>
                  <option value="promocao">Promoção</option>
                  <option value="sobre">Sobre</option>
                  <option value="contato">Contato</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">Conteúdo</h3>
              
              <div className="space-y-2">
                <Label htmlFor="page-content" className="text-gray-300 font-medium">
                  Conteúdo da Página (HTML permitido)
                </Label>
                <textarea
                  id="page-content"
                  value={pageForm.content}
                  onChange={(e) => setPageForm({ ...pageForm, content: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 min-h-[200px] focus:border-blue-500 focus:outline-none font-mono text-sm"
                  placeholder="Digite o conteúdo da página. HTML é permitido."
                />
                <p className="text-xs text-gray-400">
                  Você pode usar HTML para formatar o conteúdo. Ex: &lt;h1&gt;Título&lt;/h1&gt;, &lt;p&gt;Parágrafo&lt;/p&gt;, &lt;a href="#"&gt;Link&lt;/a&gt;
                </p>
              </div>
            </div>

            {/* Personalização Visual */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">Personalização Visual</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="page-bg-color" className="text-gray-300 font-medium">
                    Cor de Fundo
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="page-bg-color"
                      value={pageForm.backgroundColor}
                      onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                      className="w-12 h-12 rounded border border-gray-700 cursor-pointer"
                    />
                    <Input
                      value={pageForm.backgroundColor}
                      onChange={(e) => setPageForm({ ...pageForm, backgroundColor: e.target.value })}
                      className="flex-1 bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                      title="Cor de fundo da página em formato hexadecimal"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-text-color" className="text-gray-300 font-medium">
                    Cor do Texto
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="page-text-color"
                      value={pageForm.textColor}
                      onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                      className="w-12 h-12 rounded border border-gray-700 cursor-pointer"
                    />
                    <Input
                      value={pageForm.textColor}
                      onChange={(e) => setPageForm({ ...pageForm, textColor: e.target.value })}
                      className="flex-1 bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="page-primary-color" className="text-gray-300 font-medium">
                    Cor Primária
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      id="page-primary-color"
                      value={pageForm.primaryColor}
                      onChange={(e) => setPageForm({ ...pageForm, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded border border-gray-700 cursor-pointer"
                    />
                    <Input
                      value={pageForm.primaryColor}
                      onChange={(e) => setPageForm({ ...pageForm, primaryColor: e.target.value })}
                      className="flex-1 bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="page-show-header"
                    checked={pageForm.showHeader}
                    onChange={(e) => setPageForm({ ...pageForm, showHeader: e.target.checked })}
                    className="accent-blue-500"
                  />
                  <Label htmlFor="page-show-header" className="text-gray-300 cursor-pointer">
                    Mostrar Cabeçalho
                  </Label>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
                  <input
                    type="checkbox"
                    id="page-show-footer"
                    checked={pageForm.showFooter}
                    onChange={(e) => setPageForm({ ...pageForm, showFooter: e.target.checked })}
                    className="accent-blue-500"
                  />
                  <Label htmlFor="page-show-footer" className="text-gray-300 cursor-pointer">
                    Mostrar Rodapé
                  </Label>
                </div>
              </div>
            </div>

            {/* SEO */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-300">SEO</h3>
              
              <div className="space-y-2">
                <Label htmlFor="page-meta-title" className="text-gray-300 font-medium">
                  Meta Título (SEO)
                </Label>
                <Input
                  id="page-meta-title"
                  value={pageForm.metaTitle}
                  onChange={(e) => setPageForm({ ...pageForm, metaTitle: e.target.value })}
                  className="bg-gray-900 border border-gray-700 text-white focus:border-blue-500"
                  placeholder="Título para SEO (aparece nos resultados de busca)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="page-meta-description" className="text-gray-300 font-medium">
                  Meta Descrição (SEO)
                </Label>
                <textarea
                  id="page-meta-description"
                  value={pageForm.metaDescription}
                  onChange={(e) => setPageForm({ ...pageForm, metaDescription: e.target.value })}
                  className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 min-h-[80px] focus:border-blue-500 focus:outline-none"
                  placeholder="Descrição para SEO (aparece nos resultados de busca)"
                />
              </div>
            </div>

            {/* CSS Personalizado */}
            <div className="space-y-2">
              <Label htmlFor="page-custom-css" className="text-gray-300 font-medium">
                CSS Personalizado
              </Label>
              <textarea
                id="page-custom-css"
                value={pageForm.customCSS}
                onChange={(e) => setPageForm({ ...pageForm, customCSS: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 min-h-[100px] focus:border-blue-500 focus:outline-none font-mono text-sm"
                placeholder="/* Adicione CSS personalizado aqui */"
              />
            </div>

            {/* Publicação */}
            <div className="flex items-center gap-3 p-3 bg-gray-900 border border-gray-700 rounded-lg">
              <input
                type="checkbox"
                id="page-is-published"
                checked={pageForm.isPublished}
                onChange={(e) => setPageForm({ ...pageForm, isPublished: e.target.checked })}
                className="accent-blue-500"
              />
              <Label htmlFor="page-is-published" className="text-gray-300 cursor-pointer">
                Publicar página (tornar acessível publicamente)
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setPageModal(false)}
              className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
            >
              Cancelar
            </Button>
            <Button
              onClick={savePage}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {editingPage ? 'Salvar Alterações' : 'Criar Página'}
            </Button>
          </DialogFooter>
          </>
          )}
        </DialogContent>
      </Dialog>

      {/* Visualização de Página */}
      {viewingPage && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => setViewingPage(null)}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Voltar
                </Button>
                <h2 className="text-xl font-bold text-gray-800">{viewingPage.title}</h2>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    copyPageUrl(viewingPage.slug);
                  }}
                  className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copiar URL
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setViewingPage(null);
                    openEditPage(viewingPage);
                  }}
                  className="bg-gray-700 hover:bg-gray-600 text-white border-gray-600"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
              </div>
            </div>
            <div 
              className="p-8"
              style={{
                backgroundColor: viewingPage.backgroundColor,
                color: viewingPage.textColor,
              }}
            >
              {viewingPage.showHeader && (
                <header className="mb-8 pb-4 border-b" style={{ borderColor: viewingPage.primaryColor }}>
                  <h1 className="text-4xl font-bold mb-2" style={{ color: viewingPage.primaryColor }}>
                    {viewingPage.title}
                  </h1>
                  {viewingPage.description && (
                    <p className="text-lg opacity-80">{viewingPage.description}</p>
                  )}
                </header>
              )}
              
              {/* Renderizar componentes do page builder se existirem */}
              {viewingPage.components && viewingPage.components.length > 0 ? (
                <div className="space-y-6">
                  {viewingPage.components
                    .sort((a: PageComponent, b: PageComponent) => (a.order || 0) - (b.order || 0))
                    .map((component: PageComponent) => {
                      // Criar uma função de renderização local que usa viewingPage
                      const renderViewingComponent = (comp: PageComponent) => {
                        const { type } = comp;
                        const config = (comp.config ?? ({} as ComponentConfig));
                        switch (type) {
                          case 'metric-card':
                            return (
                              <Card className="bg-[#181e29] border border-gray-700">
                                <CardHeader>
                                  <CardTitle className="text-white text-sm">{config.title || 'Métrica'}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-3xl font-bold" style={{ color: config.color || viewingPage.primaryColor }}>
                                    {config.value || '0'}
                                  </div>
                                  <div className="text-sm text-gray-400 mt-1">{config.label || 'Descrição'}</div>
                                </CardContent>
                              </Card>
                            );
                          case 'stats-grid': {
                            const gridCols = config.columns === 2 ? 'grid-cols-2' : config.columns === 4 ? 'grid-cols-4' : 'grid-cols-3';
                            return (
                              <div className={`grid ${gridCols} gap-4`}>
                                {config.metrics?.map((metric: string, idx: number) => {
                                  const metricData: Record<string, { value: string | number; label: string; icon: React.ComponentType<Record<string, unknown>> }> = {
                                    totalUsers: { value: stats?.totalUsers || 0, label: 'Total de Usuários', icon: Users },
                                    totalRevenue: { value: `R$ ${stats?.totalRevenue?.toLocaleString('pt-BR') || '0'}`, label: 'Receita Total', icon: DollarSign },
                                    activeClients: { value: stats?.activeClients || 0, label: 'Clientes Ativos', icon: Users },
                                  };
                                  const data = metricData[metric] || { value: '0', label: metric, icon: BarChart3 };
                                  const Icon = data.icon;
                                  return (
                                    <Card key={idx} className="bg-[#181e29] border border-gray-700">
                                      <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                          <div>
                                            <div className="text-2xl font-bold text-white">{data.value}</div>
                                            <div className="text-xs text-gray-400 mt-1">{data.label}</div>
                                          </div>
                                          <Icon className="w-8 h-8 text-blue-400 opacity-50" />
                                        </div>
                                      </CardContent>
                                    </Card>
                                  );
                                })}
                              </div>
                            );
                          }
                          case 'revenue-card':
                            return (
                              <Card className="bg-gradient-to-br from-green-900/30 to-green-800/20 border border-green-700">
                                <CardHeader>
                                  <CardTitle className="text-green-300">Receita</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="text-4xl font-bold text-white mb-2">
                                    R$ {stats?.totalRevenue?.toLocaleString('pt-BR') || '0'}
                                  </div>
                                  {config.showGrowth && (
                                    <div className="text-sm text-green-400 flex items-center gap-1">
                                      <TrendingUp className="w-4 h-4" />
                                      Crescimento este mês
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            );
                          case 'users-table':
                            return (
                              <Card className="bg-[#181e29] border border-gray-700">
                                <CardHeader>
                                  <CardTitle className="text-white">Usuários</CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                      <thead>
                                        <tr className="border-b border-gray-700">
                                          <th className="text-left p-2 text-gray-400">Nome</th>
                                          <th className="text-left p-2 text-gray-400">Email</th>
                                          <th className="text-left p-2 text-gray-400">Status</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {clientes.slice(0, (config.pageSize as number) || 5).map((cliente: Client, idx: number) => (
                                          <tr key={idx} className="border-b border-gray-800">
                                            <td className="p-2 text-white">{cliente.name || 'N/A'}</td>
                                            <td className="p-2 text-gray-400">{cliente.email || 'N/A'}</td>
                                            <td className="p-2">
                                              <span className="px-2 py-1 bg-green-900/30 text-green-300 rounded text-xs">
                                                {cliente.status || 'Ativo'}
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          case 'button':
                            return (
                              <Button
                                className={`w-full ${
                                  config.variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' :
                                  config.variant === 'secondary' ? 'bg-gray-600 hover:bg-gray-700' :
                                  'bg-green-600 hover:bg-green-700'
                                } text-white`}
                                onClick={() => {
                                  if (config.link) window.open(config.link, '_blank');
                                  if (config.action) toast.info(`Ação: ${config.action}`);
                                }}
                              >
                                {config.text || 'Clique aqui'}
                              </Button>
                            );
                          case 'text': {
                            const textSizes: Record<string, string> = { small: 'text-sm', medium: 'text-base', large: 'text-lg', xlarge: 'text-2xl' };
                            const textAligns: Record<string, string> = { left: 'text-left', center: 'text-center', right: 'text-right' };
                            return (
                              <div className={`${textSizes[config.size || 'medium']} ${textAligns[config.align || 'left']}`} style={{ color: viewingPage.textColor }}>
                                {config.content || 'Digite seu texto aqui'}
                              </div>
                            );
                          }
                          default:
                            return renderComponent(comp);
                        }
                      };
                      return (
                        <div key={component.id}>
                          {renderViewingComponent(component)}
                        </div>
                      );
                    })}
                </div>
              ) : (
                /* Fallback para conteúdo HTML se não houver componentes */
                <div 
                  dangerouslySetInnerHTML={{ __html: viewingPage.content || '<p>Nenhum conteúdo adicionado ainda.</p>' }}
                  style={{ color: viewingPage.textColor }}
                />
              )}
              
              {viewingPage.showFooter && (
                <footer className="mt-8 pt-4 border-t" style={{ borderColor: viewingPage.primaryColor }}>
                  <p className="text-sm opacity-60">© {new Date().getFullYear()} {brand.name || 'Sua Empresa'}</p>
                </footer>
              )}
              {viewingPage.customCSS && (
                <style>{viewingPage.customCSS}</style>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBranding;