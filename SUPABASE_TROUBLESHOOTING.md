# 🔧 Troubleshooting - Problemas de Conexão Supabase

## 🚨 Problemas Identificados

### Erro: `ERR_NAME_NOT_RESOLVED`
- **Causa**: Domínio do Supabase não está sendo resolvido
- **Possíveis motivos**:
  - Projeto foi deletado ou suspenso
  - Problema de DNS
  - URL incorreta

### Erro: `ERR_CERT_DATE_INVALID`
- **Causa**: Certificado SSL expirado ou inválido
- **Possíveis motivos**:
  - Projeto suspenso por falta de pagamento
  - Configuração incorreta do projeto

## 🔍 Diagnóstico

### 1. Verificar Configurações Atuais

**Arquivo 1**: `src/integrations/supabase/client.ts`
```typescript
const SUPABASE_URL = "https://zluggifavplgsxzbupiq.supabase.co";
```

**Arquivo 2**: `src/lib/supabase.ts`
```typescript
const supabaseUrl = "https://tgffflpfilsxikqhnkuj.supabase.co";
```

**Problema**: URLs diferentes estão sendo usadas!

### 2. Verificar Status do Projeto

1. Acesse [supabase.com](https://supabase.com)
2. Faça login na sua conta
3. Verifique se o projeto `zluggifavplgsxzbupiq` existe e está ativo

## 🛠️ Soluções

### Solução 1: Verificar e Corrigir Configurações

#### Passo 1: Verificar Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=https://zluggifavplgsxzbupiq.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdWdnaWZhdnBsZ3N4emJ1cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0MTgsImV4cCI6MjA2ODY2OTQxOH0.WTwWCO09lVv3JIcI49WX4Ho7cPv6WNUlv5AzsjEBN14
```

#### Passo 2: Unificar Configurações
Atualizar `src/lib/supabase.ts` para usar as variáveis de ambiente:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zluggifavplgsxzbupiq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdWdnaWZhdnBsZ3N4emJ1cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0MTgsImV4cCI6MjA2ODY2OTQxOH0.WTwWCO09lVv3JIcI49WX4Ho7cPv6WNUlv5AzsjEBN14";
```

### Solução 2: Criar Novo Projeto Supabase

Se o projeto atual não existe mais:

#### Passo 1: Criar Novo Projeto
1. Acesse [supabase.com](https://supabase.com)
2. Clique em **"New Project"**
3. Escolha sua organização
4. Nome: `bootflow-new`
5. Senha: (senha forte para o banco)
6. Região: (escolha próxima)
7. Clique em **"Create new project"**

#### Passo 2: Obter Novas Credenciais
1. No dashboard, vá para **Settings > API**
2. Copie:
   - **Project URL**
   - **anon public** (chave anônima)

#### Passo 3: Atualizar Configurações
Atualizar o arquivo `.env`:

```env
VITE_SUPABASE_URL=sua_nova_project_url
VITE_SUPABASE_ANON_KEY=sua_nova_anon_key
```

#### Passo 4: Executar Migrações
1. Vá para **SQL Editor** no novo projeto
2. Execute o código SQL que forneci anteriormente

### Solução 3: Usar Projeto Alternativo

Se você tem outro projeto Supabase funcionando:

#### Passo 1: Verificar Projeto Ativo
Teste a URL: `https://tgffflpfilsxikqhnkuj.supabase.co`

#### Passo 2: Atualizar Configurações
Usar as credenciais do projeto que funciona:

```env
VITE_SUPABASE_URL=https://tgffflpfilsxikqhnkuj.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_do_projeto_que_funciona
```

## 🧪 Testes

### Teste 1: Verificar Conexão
```bash
# Testar se a URL responde
curl -I https://zluggifavplgsxzbupiq.supabase.co
```

### Teste 2: Verificar Certificado
```bash
# Verificar certificado SSL
openssl s_client -connect zluggifavplgsxzbupiq.supabase.co:443 -servername zluggifavplgsxzbupiq.supabase.co
```

### Teste 3: Testar no Browser
1. Abra o DevTools (F12)
2. Vá para a aba **Network**
3. Recarregue a página
4. Verifique se as requisições para o Supabase estão funcionando

## 🔄 Próximos Passos

1. **Verificar** se o projeto Supabase existe
2. **Criar novo projeto** se necessário
3. **Atualizar** as configurações
4. **Executar** as migrações SQL
5. **Testar** a conexão

## 📞 Suporte

Se os problemas persistirem:

1. **Verifique os logs** no dashboard do Supabase
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Consulte a documentação** oficial do Supabase
4. **Entre em contato** com o suporte do Supabase

## ✅ Checklist de Resolução

- [ ] Verificar se o projeto Supabase existe
- [ ] Criar novo projeto se necessário
- [ ] Atualizar variáveis de ambiente
- [ ] Unificar configurações
- [ ] Executar migrações SQL
- [ ] Testar conexão
- [ ] Verificar autenticação
- [ ] Testar operações CRUD 