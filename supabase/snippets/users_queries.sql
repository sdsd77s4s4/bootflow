-- =====================================================
-- CONSULTAS ÚTEIS - TABELA USERS
-- =====================================================

-- 1. Listar todos os usuários
SELECT 
    id,
    name,
    email,
    CASE 
        WHEN expiration_date > NOW() THEN 'Ativo'
        WHEN expiration_date <= NOW() THEN 'Expirado'
        ELSE 'Sem Expiração'
    END as status,
    expiration_date,
    created_at
FROM public.users
ORDER BY created_at DESC;

-- 2. Usuários ativos (não expirados)
SELECT 
    id,
    name,
    email,
    expiration_date,
    bouquets
FROM public.users
WHERE expiration_date > NOW()
ORDER BY expiration_date ASC;

-- 3. Usuários expirados
SELECT 
    id,
    name,
    email,
    expiration_date,
    observations
FROM public.users
WHERE expiration_date <= NOW()
ORDER BY expiration_date DESC;

-- 4. Usuários sem data de expiração
SELECT 
    id,
    name,
    email,
    bouquets,
    observations
FROM public.users
WHERE expiration_date IS NULL
ORDER BY created_at DESC;

-- 5. Estatísticas de usuários
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN expiration_date > NOW() THEN 1 END) as active_users,
    COUNT(CASE WHEN expiration_date <= NOW() THEN 1 END) as expired_users,
    COUNT(CASE WHEN expiration_date IS NULL THEN 1 END) as users_without_expiration,
    ROUND(
        (COUNT(CASE WHEN expiration_date > NOW() THEN 1 END)::DECIMAL / COUNT(*)) * 100, 2
    ) as active_percentage
FROM public.users;

-- 6. Usuários por pacote (bouquet)
SELECT 
    bouquets,
    COUNT(*) as user_count
FROM public.users
WHERE bouquets IS NOT NULL
GROUP BY bouquets
ORDER BY user_count DESC;

-- 7. Usuários criados nos últimos 30 dias
SELECT 
    id,
    name,
    email,
    created_at
FROM public.users
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;

-- 8. Usuários que expiram nos próximos 7 dias
SELECT 
    id,
    name,
    email,
    expiration_date,
    bouquets
FROM public.users
WHERE expiration_date BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY expiration_date ASC;

-- 9. Buscar usuário por email
SELECT 
    id,
    name,
    email,
    m3u_url,
    bouquets,
    expiration_date,
    observations,
    created_at,
    updated_at
FROM public.users
WHERE email = 'joao@example.com'; -- Substitua pelo email desejado

-- 10. Usuários com observações
SELECT 
    id,
    name,
    email,
    observations
FROM public.users
WHERE observations IS NOT NULL AND observations != ''
ORDER BY updated_at DESC;

-- 11. Top 10 usuários mais antigos
SELECT 
    id,
    name,
    email,
    created_at
FROM public.users
ORDER BY created_at ASC
LIMIT 10;

-- 12. Top 10 usuários mais recentes
SELECT 
    id,
    name,
    email,
    created_at
FROM public.users
ORDER BY created_at DESC
LIMIT 10;

-- 13. Usuários com URL M3U
SELECT 
    id,
    name,
    email,
    m3u_url
FROM public.users
WHERE m3u_url IS NOT NULL AND m3u_url != ''
ORDER BY updated_at DESC;

-- 14. Contagem de usuários por mês (últimos 12 meses)
SELECT 
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as new_users
FROM public.users
WHERE created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', created_at)
ORDER BY month DESC;

-- 15. Usuários que precisam renovar (expiraram há mais de 30 dias)
SELECT 
    id,
    name,
    email,
    expiration_date,
    observations
FROM public.users
WHERE expiration_date < NOW() - INTERVAL '30 days'
ORDER BY expiration_date ASC; 