-- =====================================================
-- SQL SNIPPET: TABELA USERS - BOOTFLOW
-- =====================================================
-- Descrição: Cria a tabela de usuários/clientes com todas as funcionalidades
-- Data: 2024
-- Versão: 1.0
-- =====================================================

-- Criar tabela users
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

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);
CREATE INDEX IF NOT EXISTS idx_users_expiration_date ON public.users(expiration_date);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
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

-- Comentários na tabela
COMMENT ON TABLE public.users IS 'Tabela de usuários/clientes do sistema Bootflow';
COMMENT ON COLUMN public.users.id IS 'ID único do usuário (BIGSERIAL)';
COMMENT ON COLUMN public.users.name IS 'Nome completo do usuário (obrigatório)';
COMMENT ON COLUMN public.users.email IS 'Email único do usuário (obrigatório)';
COMMENT ON COLUMN public.users.password IS 'Senha do usuário (hash)';
COMMENT ON COLUMN public.users.m3u_url IS 'URL da playlist M3U do usuário';
COMMENT ON COLUMN public.users.bouquets IS 'Pacotes/bouquets do usuário';
COMMENT ON COLUMN public.users.expiration_date IS 'Data de expiração da conta';
COMMENT ON COLUMN public.users.observations IS 'Observações sobre o usuário';
COMMENT ON COLUMN public.users.created_at IS 'Data de criação do registro';
COMMENT ON COLUMN public.users.updated_at IS 'Data da última atualização';

-- View para estatísticas de usuários
CREATE OR REPLACE VIEW public.user_stats AS
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN expiration_date > NOW() THEN 1 END) as active_users,
    COUNT(CASE WHEN expiration_date <= NOW() THEN 1 END) as expired_users,
    COUNT(CASE WHEN expiration_date IS NULL THEN 1 END) as users_without_expiration
FROM public.users;

-- Função para buscar usuários por status
CREATE OR REPLACE FUNCTION public.get_users_by_status(user_status TEXT)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    email TEXT,
    expiration_date TIMESTAMP WITH TIME ZONE,
    status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        u.email,
        u.expiration_date,
        CASE 
            WHEN u.expiration_date > NOW() THEN 'Ativo'
            WHEN u.expiration_date <= NOW() THEN 'Expirado'
            ELSE 'Sem Expiração'
        END as status
    FROM public.users u
    WHERE CASE 
        WHEN user_status = 'Ativo' THEN u.expiration_date > NOW()
        WHEN user_status = 'Expirado' THEN u.expiration_date <= NOW()
        WHEN user_status = 'Sem Expiração' THEN u.expiration_date IS NULL
        ELSE true
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir dados de exemplo (opcional)
INSERT INTO public.users (name, email, password, m3u_url, bouquets, expiration_date, observations) VALUES
('João Silva', 'joao@example.com', 'password123', 'http://example.com/playlist1.m3u', 'Premium, Sports', '2024-12-31 23:59:59+00', 'Cliente fiel, sempre pontual'),
('Maria Santos', 'maria@example.com', 'password123', 'http://example.com/playlist2.m3u', 'Basic, Movies', '2024-11-30 23:59:59+00', 'Cliente nova, muito ativa'),
('Pedro Costa', 'pedro@example.com', 'password123', 'http://example.com/playlist3.m3u', 'Premium, Kids', '2024-10-31 23:59:59+00', 'Cliente experiente')
ON CONFLICT (email) DO NOTHING;

-- Verificar se a tabela foi criada corretamente
SELECT 
    'Tabela users criada com sucesso!' as status,
    COUNT(*) as total_users
FROM public.users;

-- Mostrar estrutura da tabela
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND table_schema = 'public'
ORDER BY ordinal_position; 