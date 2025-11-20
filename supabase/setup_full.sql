-- ============================================
-- BOOTFLOW - SUPABASE FULL SETUP
-- Arquivo consolidado para executar no SQL Editor do Supabase
-- Inclui: extensão pgcrypto, profiles (auth), tabelas (users,resellers,cobrancas), triggers e políticas RLS
-- Execute em um projeto Supabase novo ou em um ambiente de desenvolvimento.
-- Faça backup antes em produção.
-- ============================================

-- Necessário para gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================
-- 1) TABELA profiles (vinculada a auth.users)
-- ==============================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'reseller', 'client')),
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- ==============================
-- 2) FUNÇÃO DE AUDIT: update_updated_at_column
-- (usada por triggers nas tabelas abaixo)
-- ==============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- trigger para profiles
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
CREATE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================
-- 3) TRIGGER: criar profile automaticamente quando user é criado
-- ==============================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'client'),
    NEW.raw_user_meta_data->>'full_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==============================
-- 4) TABELAS da aplicação
--    users, resellers, cobrancas, views compatibilidade
-- ==============================

-- USERS (clientes)
CREATE TABLE IF NOT EXISTS public.users (
  id BIGSERIAL PRIMARY KEY,
  server VARCHAR(100),
  plan VARCHAR(50) NOT NULL CHECK (plan IN ('Mensal', 'Trimestral', 'Semestral', 'Anual')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'Ativo' CHECK (status IN ('Ativo', 'Inativo', 'Suspenso', 'Pendente')),
  expiration_date DATE NOT NULL,
  devices INTEGER DEFAULT 0,
  credits INTEGER DEFAULT 0,
  password VARCHAR(255),
  bouquets TEXT,
  real_name VARCHAR(255),
  whatsapp VARCHAR(20),
  telegram VARCHAR(100),
  observations TEXT,
  notes TEXT,
  m3u_url TEXT,
  renewal_date DATE,
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- RESELLERS (revendas)
CREATE TABLE IF NOT EXISTS public.resellers (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255),
  permission VARCHAR(50) DEFAULT 'reseller',
  credits INTEGER DEFAULT 10,
  personal_name VARCHAR(255),
  status VARCHAR(50) DEFAULT 'Ativo',
  force_password_change BOOLEAN DEFAULT false,
  servers TEXT,
  master_reseller VARCHAR(100),
  disable_login_days INTEGER DEFAULT 0,
  monthly_reseller BOOLEAN DEFAULT false,
  telegram VARCHAR(100),
  whatsapp VARCHAR(20),
  observations TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resellers_email ON public.resellers(email);
CREATE INDEX IF NOT EXISTS idx_resellers_username ON public.resellers(username);
CREATE INDEX IF NOT EXISTS idx_resellers_status ON public.resellers(status);

-- COBRANÇAS
CREATE TABLE IF NOT EXISTS public.cobrancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id VARCHAR(255),
  valor DECIMAL(10,2) NOT NULL,
  data_vencimento DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'pago', 'atrasado', 'cancelado')),
  descricao TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cobrancas_cliente_id ON public.cobrancas(cliente_id);
CREATE INDEX IF NOT EXISTS idx_cobrancas_status ON public.cobrancas(status);
CREATE INDEX IF NOT EXISTS idx_cobrancas_data_vencimento ON public.cobrancas(data_vencimento);

-- VIEWS de compatibilidade
CREATE OR REPLACE VIEW public.clientes AS SELECT * FROM public.users;
CREATE OR REPLACE VIEW public.revendas AS SELECT * FROM public.resellers;

-- Triggers updated_at para users/resellers/cobrancas
DROP TRIGGER IF EXISTS set_updated_at_users ON public.users;
CREATE TRIGGER set_updated_at_users
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_resellers ON public.resellers;
CREATE TRIGGER set_updated_at_resellers
  BEFORE UPDATE ON public.resellers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_cobrancas ON public.cobrancas;
CREATE TRIGGER set_updated_at_cobrancas
  BEFORE UPDATE ON public.cobrancas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================
-- 5) Row Level Security (RLS)
-- Habilita RLS e cria políticas básicas que permitem operações apenas para usuários autenticados.
-- Ajuste as políticas conforme sua necessidade (ex.: restrições por role, restrição por profile.id, etc.).
-- ==============================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resellers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cobrancas ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS profiles
DROP POLICY IF EXISTS "Enable read access for all users" ON public.profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.profiles;
DROP POLICY IF EXISTS "Enable update for users based on id" ON public.profiles;

CREATE POLICY "Enable read access for all users"
  ON public.profiles
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Enable insert for authenticated users only"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for users based on id"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- POLÍTICAS users
DROP POLICY IF EXISTS "Users can view all" ON public.users;
DROP POLICY IF EXISTS "Users can insert all" ON public.users;
DROP POLICY IF EXISTS "Users can update all" ON public.users;
DROP POLICY IF EXISTS "Users can delete all" ON public.users;

CREATE POLICY "Users can view all"
  ON public.users FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert all"
  ON public.users FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update all"
  ON public.users FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete all"
  ON public.users FOR DELETE
  USING (auth.role() = 'authenticated');

-- POLÍTICAS resellers
DROP POLICY IF EXISTS "Resellers can view all" ON public.resellers;
DROP POLICY IF EXISTS "Resellers can insert all" ON public.resellers;
DROP POLICY IF EXISTS "Resellers can update all" ON public.resellers;
DROP POLICY IF EXISTS "Resellers can delete all" ON public.resellers;

CREATE POLICY "Resellers can view all"
  ON public.resellers FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Resellers can insert all"
  ON public.resellers FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Resellers can update all"
  ON public.resellers FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Resellers can delete all"
  ON public.resellers FOR DELETE
  USING (auth.role() = 'authenticated');

-- POLÍTICAS cobrancas
DROP POLICY IF EXISTS "Cobrancas can view all" ON public.cobrancas;
DROP POLICY IF EXISTS "Cobrancas can insert all" ON public.cobrancas;
DROP POLICY IF EXISTS "Cobrancas can update all" ON public.cobrancas;
DROP POLICY IF EXISTS "Cobrancas can delete all" ON public.cobrancas;

CREATE POLICY "Cobrancas can view all"
  ON public.cobrancas FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Cobrancas can insert all"
  ON public.cobrancas FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cobrancas can update all"
  ON public.cobrancas FOR UPDATE
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Cobrancas can delete all"
  ON public.cobrancas FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==============================
-- 6) Comentários / Observações
-- - Este script é um ponto de partida. Em produção você deve:
--   * Revisar políticas RLS para respeitar roles e relações (profiles.admin para controlar revendas, etc.)
--   * Criar funções seguras (SECURITY DEFINER) para operações sensíveis, se necessário
--   * Não deixar usuários comuns alterarem campos críticos
-- ==============================

-- FIM DO SCRIPT
