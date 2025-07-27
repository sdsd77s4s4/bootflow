# 📝 SQL Snippets - Bootflow

Esta pasta contém SQL Snippets prontos para uso no Supabase SQL Editor.

## 📁 Arquivos Disponíveis

### 1. **`users_table.sql`** - Snippet Completo
- ✅ Cria a tabela `users` com todas as funcionalidades
- ✅ Índices otimizados
- ✅ Triggers automáticos
- ✅ Políticas RLS completas
- ✅ Views e funções
- ✅ Dados de exemplo
- ✅ Comentários detalhados

### 2. **`users_simple.sql`** - Snippet Simples
- ✅ Cria a tabela `users` básica
- ✅ Índices essenciais
- ✅ Trigger para `updated_at`
- ✅ Políticas RLS básicas
- ✅ Dados de exemplo
- ✅ Verificação de criação

### 3. **`users_queries.sql`** - Consultas Úteis
- ✅ 15 consultas prontas para uso
- ✅ Estatísticas de usuários
- ✅ Filtros por status
- ✅ Relatórios temporais
- ✅ Buscas específicas

## 🚀 Como Usar

### Opção 1: Copiar e Colar
1. Abra o **SQL Editor** no Supabase
2. Clique em **"New Query"**
3. Copie o conteúdo do snippet desejado
4. Cole no editor
5. Clique em **"Run"**

### Opção 2: Salvar como Snippet
1. No SQL Editor, clique em **"Save as snippet"**
2. Dê um nome ao snippet
3. Cole o código
4. Salve para uso futuro

## 📋 Ordem de Execução

### Para Configuração Completa:
1. Execute `users_table.sql` primeiro
2. Use `users_queries.sql` para consultas

### Para Configuração Rápida:
1. Execute `users_simple.sql`
2. Use `users_queries.sql` para consultas

## 🔍 Consultas Disponíveis

### **Consultas Básicas:**
- Listar todos os usuários
- Usuários ativos/expirados
- Buscar por email
- Estatísticas gerais

### **Consultas Avançadas:**
- Usuários por pacote
- Relatórios temporais
- Usuários que expiram em breve
- Análise de crescimento

### **Consultas de Manutenção:**
- Usuários que precisam renovar
- Usuários sem dados obrigatórios
- Limpeza de dados

## ⚙️ Personalização

### **Modificar Campos:**
```sql
-- Adicionar novo campo
ALTER TABLE public.users 
ADD COLUMN phone TEXT;

-- Modificar campo existente
ALTER TABLE public.users 
ALTER COLUMN observations TYPE TEXT;
```

### **Adicionar Índices:**
```sql
-- Índice para busca por nome
CREATE INDEX idx_users_name ON public.users(name);

-- Índice composto
CREATE INDEX idx_users_status_date ON public.users(expiration_date, created_at);
```

### **Criar Novas Políticas:**
```sql
-- Política para revendedores
CREATE POLICY "Resellers can view assigned users" ON public.users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.resellers 
            WHERE email = auth.uid()::text
        )
    );
```

## 🐛 Troubleshooting

### **Erro: "relation already exists"**
```sql
-- Remover tabela existente
DROP TABLE IF EXISTS public.users CASCADE;
```

### **Erro: "policy already exists"**
```sql
-- Remover políticas existentes
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Admins can manage all users" ON public.users;
```

### **Erro: "function already exists"**
```sql
-- A função será substituída automaticamente
-- (CREATE OR REPLACE já está no snippet)
```

## 📊 Monitoramento

### **Verificar Status da Tabela:**
```sql
-- Verificar se a tabela existe
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
);

-- Verificar políticas RLS
SELECT * FROM pg_policies 
WHERE tablename = 'users';
```

### **Verificar Performance:**
```sql
-- Verificar uso de índices
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE tablename = 'users';
```

## 🎯 Casos de Uso

### **Desenvolvimento:**
- Use `users_simple.sql` para testes rápidos
- Use `users_queries.sql` para validar dados

### **Produção:**
- Use `users_table.sql` para configuração completa
- Monitore com consultas de `users_queries.sql`

### **Manutenção:**
- Use consultas específicas para limpeza
- Monitore performance com índices

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs** no dashboard do Supabase
2. **Teste em ambiente de desenvolvimento** primeiro
3. **Use as consultas de troubleshooting** acima
4. **Consulte a documentação** oficial do Supabase

## ✅ Checklist de Uso

- [ ] Escolher snippet adequado
- [ ] Executar no SQL Editor
- [ ] Verificar criação da tabela
- [ ] Testar políticas RLS
- [ ] Validar dados de exemplo
- [ ] Executar consultas de teste
- [ ] Configurar monitoramento

**🎉 Pronto! Seus SQL Snippets estão configurados e prontos para uso!** 