-- =====================================================
-- TABELA USERS - SNIPPET SIMPLES
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

-- Índices básicos
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_expiration_date ON public.users(expiration_date);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON public.users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Políticas básicas
CREATE POLICY "Users can view own data" ON public.users
    FOR SELECT USING (auth.uid()::text = email);

CREATE POLICY "Admins can manage all users" ON public.users
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.auth_users 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Dados de exemplo
INSERT INTO public.users (name, email, password, m3u_url, bouquets, expiration_date, observations) VALUES
('João Silva', 'joao@example.com', 'password123', 'http://example.com/playlist1.m3u', 'Premium, Sports', '2024-12-31 23:59:59+00', 'Cliente fiel'),
('Maria Santos', 'maria@example.com', 'password123', 'http://example.com/playlist2.m3u', 'Basic, Movies', '2024-11-30 23:59:59+00', 'Cliente nova')
ON CONFLICT (email) DO NOTHING;

-- Verificar criação
SELECT 'Tabela users criada!' as status, COUNT(*) as total_users FROM public.users; 