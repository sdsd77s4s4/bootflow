import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart3, TrendingUp, Users, DollarSign, Eye, Download, Calendar } from "lucide-react";

// Helper to generate a CSS class for a specific width (percentage) to avoid inline styles
function ensureWidthClass(width: string) {
  if (!width) return '';
  const safe = String(width).replace(/[^a-zA-Z0-9.%-]/g, '').replace(/%/g, 'pct');
  const id = `bar-w-${safe}`;
  if (!document.getElementById(id)) {
    const style = document.createElement('style');
    style.id = id;
    style.innerHTML = `.${id} { width: ${width} !important; }`;
    document.head.appendChild(style);
  }
  return id;
}

export default function AdminAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");

  const metrics = {
    totalUsers: 1256,
    activeUsers: 892,
    revenue: 45678.90,
    growth: 12.5,
    pageViews: 45678,
    conversionRate: 3.2
  };

  const topPages = [
    { name: "Dashboard", views: 1234, growth: 15.2 },
    { name: "Produtos", views: 987, growth: 8.7 },
    { name: "Suporte", views: 756, growth: -2.1 },
    { name: "Perfil", views: 654, growth: 12.3 },
    { name: "Configurações", views: 432, growth: 5.6 }
  ];

  const userActivity = [
    { hour: "00:00", users: 45 },
    { hour: "04:00", users: 23 },
    { hour: "08:00", users: 156 },
    { hour: "12:00", users: 234 },
    { hour: "16:00", users: 198 },
    { hour: "20:00", users: 167 }
  ];

  return (
    <div className="space-y-4 sm:space-y-6 min-h-screen bg-[#09090b] p-3 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400 text-sm sm:text-base">Acompanhe métricas e performance do sistema</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 bg-[#1f2937] text-white border-none">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[#1f2937] text-white">
              <SelectItem value="1d">Hoje</SelectItem>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" className="flex items-center gap-2 bg-[#7e22ce] hover:bg-[#6d1bb7] text-white border-none h-10 sm:h-auto">
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Exportar</span>
            <span className="sm:hidden">Export</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
        <Card className="bg-gradient-to-br from-purple-900/50 to-purple-800/30 border border-purple-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Total de Usuários</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-white">{metrics.totalUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <p className="text-xs text-green-600">+{metrics.growth}%</p>
              <p className="text-xs text-gray-400">vs. período anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-900/50 to-green-800/30 border border-green-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Usuários Ativos</CardTitle>
            <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-white">{metrics.activeUsers.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <p className="text-xs text-green-600">+8.2%</p>
              <p className="text-xs text-gray-400">vs. período anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-900/50 to-blue-800/30 border border-blue-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Receita</CardTitle>
            <DollarSign className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-white">R$ {metrics.revenue.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <p className="text-xs text-green-600">+{metrics.growth}%</p>
              <p className="text-xs text-gray-400">vs. período anterior</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/30 border border-yellow-700/40 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs sm:text-sm font-medium text-gray-300">Visualizações</CardTitle>
            <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-6">
            <div className="text-lg sm:text-2xl font-bold text-white">{metrics.pageViews.toLocaleString()}</div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600" />
              <p className="text-xs text-green-600">+15.3%</p>
              <p className="text-xs text-gray-400">vs. período anterior</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Páginas Mais Visitadas</CardTitle>
            <CardDescription className="text-gray-400">
              Top 5 páginas com mais visualizações
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPages.map((page, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="border-blue-600 text-blue-400">#{index + 1}</Badge>
                    <div>
                      <p className="font-medium text-white">{page.name}</p>
                      <p className="text-sm text-gray-400">{page.views.toLocaleString()} visualizações</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className={`h-4 w-4 ${page.growth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                    <span className={`text-sm ${page.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {page.growth >= 0 ? '+' : ''}{page.growth}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Atividade por Hora</CardTitle>
            <CardDescription className="text-gray-400">
              Usuários ativos por hora do dia
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userActivity.map((activity, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium text-white">{activity.hour}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div className={`${ensureWidthClass(`${(activity.users / 250) * 100}%`)} bg-blue-600 h-2 rounded-full`} />
                    </div>
                    <span className="text-sm text-gray-400 w-12 text-right">
                      {activity.users}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Taxa de Conversão</CardTitle>
            <CardDescription className="text-gray-400">
              Conversões de visitantes em usuários
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{metrics.conversionRate}%</div>
              <p className="text-sm text-gray-400 mt-2">
                {Math.round(metrics.pageViews * (metrics.conversionRate / 100)).toLocaleString()} conversões
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Distribuição de Usuários</CardTitle>
            <CardDescription className="text-gray-400">
              Por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Plano Básico</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div className={`${ensureWidthClass('60%')} bg-green-600 h-2 rounded-full`} />
                  </div>
                  <span className="text-sm font-medium text-green-400">60%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Plano Pro</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div className={`${ensureWidthClass('30%')} bg-blue-600 h-2 rounded-full`} />
                  </div>
                  <span className="text-sm font-medium text-blue-400">30%</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Plano Enterprise</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 bg-gray-700 rounded-full h-2">
                    <div className={`${ensureWidthClass('10%')} bg-purple-600 h-2 rounded-full`} />
                  </div>
                  <span className="text-sm font-medium text-purple-400">10%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#1f2937] text-white">
          <CardHeader>
            <CardTitle className="text-white">Performance do Sistema</CardTitle>
            <CardDescription className="text-gray-400">
              Métricas de performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Tempo de Resposta</span>
                <Badge className="bg-green-100 text-green-800">245ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Uptime</span>
                <Badge className="bg-green-100 text-green-800">99.9%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Erros</span>
                <Badge className="bg-red-100 text-red-800">0.1%</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-400">Sessões Ativas</span>
                <Badge className="bg-blue-100 text-blue-800">892</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 