# 🚀 Configuração de Novo Projeto Supabase

## 📋 Passos para Resolver os Problemas de Conexão

### **Passo 1: Criar Novo Projeto Supabase**

1. **Acesse** [supabase.com](https://supabase.com)
2. **Faça login** na sua conta
3. **Clique em "New Project"**
4. **Configure**:
   - **Nome**: `bootflow-new`
   - **Senha do banco**: (senha forte)
   - **Região**: (escolha próxima ao Brasil)
   - **Clique em "Create new project"**

### **Passo 2: Obter Credenciais**

Após criar o projeto:

1. **Vá para Settings > API**
2. **Copie**:
   - **Project URL** (ex: `https://abc123.supabase.co`)
   - **anon public** (chave anônima)

### **Passo 3: Criar Arquivo .env**

Crie um arquivo `.env` na raiz do projeto:

```env
VITE_SUPABASE_URL=sua_nova_project_url_aqui
VITE_SUPABASE_ANON_KEY=sua_nova_anon_key_aqui
```

### **Passo 4: Executar Migrações SQL**

1. **Vá para SQL Editor** no novo projeto
2. **Clique em "New Query"**
3. **Cole e execute** o código SQL completo:

```sql
-- =====================================================
-- MIGRAÇÃO INICIAL - SCHEMA BOOTFLOW
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- TABELA: users (Usuários/Clientes)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT,
    m3u_url TEXT,
    bouquets TEXT,
    expiration_date TIMESTAMP WITH TIME ZONE,
    observations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: resellers (Revendedores)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.resellers (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    password TEXT,
    permission TEXT DEFAULT 'reseller',
    credits INTEGER DEFAULT 0,
    personal_name TEXT,
    status TEXT DEFAULT 'Ativo',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    force_password_change TEXT,
    servers TEXT,
    master_reseller TEXT,
    disable_login_days INTEGER DEFAULT 0,
    monthly_reseller BOOLEAN DEFAULT false,
    telegram TEXT,
    whatsapp TEXT,
    observations TEXT
);

-- =====================================================
-- TABELA: cobrancas (Cobranças)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.cobrancas (
    id BIGSERIAL PRIMARY KEY,
    cliente TEXT NOT NULL,
    email TEXT,
    descricao TEXT,
    valor DECIMAL(10,2),
    vencimento TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'Pendente',
    tipo TEXT,
    gateway TEXT,
    formapagamento TEXT,
    tentativas INTEGER DEFAULT 0,
    ultimatentativa TIMESTAMP WITH TIME ZONE,
    proximatentativa TIMESTAMP WITH TIME ZONE,
    observacoes TEXT,
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TABELA: auth_users (Usuários de Autenticação)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.auth_users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'user',
    profile_completed BOOLEAN DEFAULT false,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para users
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_expiration_date ON public.users(expiration_date);

-- Índices para resellers
CREATE INDEX IF NOT EXISTS idx_resellers_email ON public.resellers(email);
CREATE INDEX IF NOT EXISTS idx_resellers_username ON public.resellers(username);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON public.resellers(status);

-- Índices para cobrancas
CREATE INDEX IF NOT EXISTS idx_cobrancas_email ON public.cobrancas(email);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON public.cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_vencimento ON public.cobrancas(vencimento);

-- Índices para auth_users
CREATE INDEX IF NOT EXISTS idx_auth_users_role ON public.auth_users(role);

-- =====================================================
-- FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para users
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para resellers
CREATE TRIGGER update_resellers_updated_at 
    BEFORE UPDATE ON public.resellers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para cobrancas
CREATE TRIGGER update_cobrancas_updated_at 
    BEFORE UPDATE ON public.cobrancas 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger para auth_users
CREATE TRIGGER update_auth_users_updated_at 
    BEFORE UPDATE ON public.auth_users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para criar registro em auth_users quando usuário se registra
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.auth_users (id, role, profile_completed)
    VALUES (NEW.id, 'user', false);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para criar auth_users automaticamente
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VIEWS PARA ESTATÍSTICAS
-- =====================================================

-- View para estatísticas de usuários
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN expiration_date > NOW() THEN 1 END) as active_users,
    COUNT(CASE WHEN expiration_date <= NOW() THEN 1 END) as expired_users,
    COUNT(CASE WHEN expiration_date IS NULL THEN 1 END) as users_without_expiration
FROM public.users;

-- View para estatísticas de cobranças
CREATE OR REPLACE VIEW public.charge_stats AS
SELECT 
    COUNT(*) as total_charges,
    COUNT(CASE WHEN status = 'Pago' THEN 1 END) as paid_charges,
    COUNT(CASE WHEN status = 'Pendente' THEN 1 END) as pending_charges,
    COUNT(CASE WHEN status = 'Vencido' THEN 1 END) as overdue_charges,
    SUM(CASE WHEN status = 'Pago' THEN valor ELSE 0 END) as total_paid_amount,
    SUM(CASE WHEN status = 'Pendente' THEN valor ELSE 0 END) as total_pending_amount
FROM public.cobrancas;

-- =====================================================
-- HABILITAR RLS (Row Level Security)
-- =====================================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_users ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLÍTICAS RLS PARA USERS
-- =====================================================

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = email);

-- Admins podem ver todos os usuários
CREATE POLICY "Admins can view all users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem inserir usuários
CREATE POLICY "Admins can insert users" ON public.users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem atualizar usuários
CREATE POLICY "Admins can update users" ON public.users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Admins podem deletar usuários
CREATE POLICY "Admins can delete users" ON public.users
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS RLS PARA RESELLERS
-- =====================================================

-- Revendedores podem ver apenas seus próprios dados
CREATE POLICY "Resellers can view own data" ON public.resellers
    FOR SELECT USING (auth.uid()::text = email);

-- Admins podem gerenciar todos os revendedores
CREATE POLICY "Admins can manage all resellers" ON public.resellers
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS RLS PARA COBRANCAS
-- =====================================================

-- Usuários podem ver cobranças relacionadas ao seu email
CREATE POLICY "Users can view own charges" ON public.cobrancas
    FOR SELECT USING (auth.uid()::text = email);

-- Admins podem gerenciar todas as cobranças
CREATE POLICY "Admins can manage all charges" ON public.cobrancas
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- POLÍTICAS RLS PARA AUTH_USERS
-- =====================================================

-- Usuários podem ver apenas seus próprios dados
CREATE POLICY "Users can view own auth data" ON public.auth_users
    FOR SELECT USING (id = auth.uid());

-- Admins podem gerenciar todos os dados de autenticação
CREATE POLICY "Admins can manage all auth data" ON public.auth_users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- =====================================================
-- DADOS DE EXEMPLO
-- =====================================================

-- Inserir usuários de exemplo
INSERT INTO public.users (name, email, password, m3u_url, bouquets, expiration_date, observations) VALUES
('João Silva', 'joao@example.com', 'password123', 'http://example.com/playlist1.m3u', 'Premium, Sports', '2024-12-31 23:59:59+00', 'Cliente fiel, sempre pontual'),
('Maria Santos', 'maria@example.com', 'password123', 'http://example.com/playlist2.m3u', 'Basic, Movies', '2024-11-30 23:59:59+00', 'Cliente nova, muito ativa'),
('Pedro Costa', 'pedro@example.com', 'password123', 'http://example.com/playlist3.m3u', 'Premium, Kids', '2024-10-31 23:59:59+00', 'Cliente experiente'),
('Ana Oliveira', 'ana@example.com', 'password123', 'http://example.com/playlist4.m3u', 'Basic, News', '2024-09-30 23:59:59+00', 'Cliente antiga'),
('Carlos Lima', 'carlos@example.com', 'password123', 'http://example.com/playlist5.m3u', 'Premium, All', '2024-08-31 23:59:59+00', 'Cliente VIP')
ON CONFLICT (email) DO NOTHING;

-- Inserir revendedores de exemplo
INSERT INTO public.resellers (username, email, password, personal_name, permission, credits, status, observations) VALUES
('revenda1', 'revenda1@example.com', 'password123', 'Revenda Central', 'reseller', 1000, 'Ativo', 'Revenda principal'),
('revenda2', 'revenda2@example.com', 'password123', 'Revenda Norte', 'reseller', 500, 'Ativo', 'Revenda regional'),
('revenda3', 'revenda3@example.com', 'password123', 'Revenda Sul', 'reseller', 750, 'Ativo', 'Revenda especializada'),
('revenda4', 'revenda4@example.com', 'password123', 'Revenda Leste', 'reseller', 300, 'Inativo', 'Revenda temporária')
ON CONFLICT (email) DO NOTHING;

-- Inserir cobranças de exemplo
INSERT INTO public.cobrancas (cliente, email, descricao, valor, vencimento, status, tipo, gateway, formapagamento, observacoes) VALUES
('João Silva', 'joao@example.com', 'Mensalidade Premium', 29.90, '2024-01-15 23:59:59+00', 'Pago', 'Mensal', 'Pix', 'Pix', 'Pagamento realizado'),
('Maria Santos', 'maria@example.com', 'Mensalidade Basic', 19.90, '2024-01-20 23:59:59+00', 'Pendente', 'Mensal', 'Cartão', 'Crédito', 'Aguardando pagamento'),
('Pedro Costa', 'pedro@example.com', 'Mensalidade Premium', 29.90, '2024-01-10 23:59:59+00', 'Vencido', 'Mensal', 'Boleto', 'Boleto', 'Cobrança vencida'),
('Ana Oliveira', 'ana@example.com', 'Mensalidade Basic', 19.90, '2024-01-25 23:59:59+00', 'Pendente', 'Mensal', 'Pix', 'Pix', 'Nova cobrança'),
('Carlos Lima', 'carlos@example.com', 'Mensalidade Premium', 29.90, '2024-01-30 23:59:59+00', 'Pendente', 'Mensal', 'Cartão', 'Débito', 'Cliente VIP'),
('João Silva', 'joao@example.com', 'Mensalidade Premium', 29.90, '2024-02-15 23:59:59+00', 'Pendente', 'Mensal', 'Pix', 'Pix', 'Próxima mensalidade'),
('Maria Santos', 'maria@example.com', 'Mensalidade Basic', 19.90, '2024-02-20 23:59:59+00', 'Pendente', 'Mensal', 'Cartão', 'Crédito', 'Próxima mensalidade')
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================

-- Verificar se todas as tabelas foram criadas
SELECT 
    'Schema criado com sucesso!' as status,
    (SELECT COUNT(*) FROM public.users) as total_users,
    (SELECT COUNT(*) FROM public.resellers) as total_resellers,
    (SELECT COUNT(*) FROM public.cobrancas) as total_cobrancas;

-- Mostrar estrutura das tabelas criadas
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'resellers', 'cobrancas', 'auth_users')
ORDER BY table_name, ordinal_position;

-- Verificar políticas RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **Passo 5: Testar Conexão**

1. **Reinicie** o servidor de desenvolvimento
2. **Abra** o DevTools (F12)
3. **Verifique** se não há mais erros de conexão

### **Passo 6: Criar Usuário Admin**

1. **Registre** um usuário através da interface (`/auth`)
2. **Execute** no SQL Editor:

```sql
-- Substitua 'EMAIL_DO_USUARIO' pelo email registrado
UPDATE public.auth_users 
SET role = 'admin' 
WHERE id = (
    SELECT id FROM auth.users 
    WHERE email = 'EMAIL_DO_USUARIO'
);
```

## ✅ Checklist de Configuração

- [ ] Criar novo projeto Supabase
- [ ] Obter credenciais (URL e chave)
- [ ] Criar arquivo .env
- [ ] Executar migrações SQL
- [ ] Testar conexão
- [ ] Criar usuário admin
- [ ] Testar autenticação
- [ ] Testar operações CRUD

## 🎯 Resultado Esperado

Após seguir estes passos:
- ✅ Erros de conexão resolvidos
- ✅ Tabelas criadas com dados de exemplo
- ✅ Autenticação funcionando
- ✅ Operações CRUD funcionando
- ✅ Políticas de segurança ativas

**🚀 Pronto! Seu novo projeto Supabase estará funcionando perfeitamente!** 