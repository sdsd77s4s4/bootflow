import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from '@/lib/supabase';

export interface Revenda {
  id: number;
  username: string;
  email: string;
  password?: string;
  permission?: string;
  credits?: number;
  personal_name?: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  force_password_change?: string;
  servers?: string;
  master_reseller?: string;
  disable_login_days?: number;
  monthly_reseller?: boolean;
  telegram?: string;
  whatsapp?: string;
  observations?: string;
}

export function useRevendas() {
  const [revendas, setRevendas] = useState<Revenda[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isFetchingRef = useRef(false);

  const fetchRevendas = useCallback(async () => {
    // Proteção contra múltiplas chamadas simultâneas
    if (isFetchingRef.current) {
      console.log('🔄 [useRevendas] fetchRevendas já em execução, ignorando chamada');
      return;
    }

    isFetchingRef.current = true;

    try {
      console.log('🔄 [useRevendas] Iniciando busca de revendedores...');
      setLoading(true);
      setError(null);
      
      // Usar fetch direto para evitar travamentos (igual ao useClientes)
      const allKeys = Object.keys(localStorage);
      const supabaseKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('auth-token'));
      let authToken = '';
      
      for (const key of supabaseKeys) {
        try {
          const authData = localStorage.getItem(key);
          if (authData) {
            const parsed = JSON.parse(authData);
            if (parsed?.access_token) {
              authToken = parsed.access_token;
              break;
            }
          }
        } catch (e) {
          // Continuar procurando
        }
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const fetchUrl = `${SUPABASE_URL}/rest/v1/resellers?select=*`;
      
      console.log('🔄 [useRevendas] Chamando:', fetchUrl);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      try {
        const response = await fetch(fetchUrl, {
          method: 'GET',
          headers,
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('✅ [useRevendas] Revendedores buscados com sucesso:', data?.length || 0, 'revendedores');
        setRevendas(data || []);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        // Ignorar erros de abort
        if (fetchError.name === 'AbortError') {
          console.log('🔄 [useRevendas] Requisição abortada (nova requisição iniciada)');
          return;
        }
        throw fetchError;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useRevendas] Erro inesperado ao buscar revendedores:', err);
      console.error('❌ [useRevendas] Detalhes:', {
        message: errorMessage,
        error: err
      });
      
      // Verificar se é erro de RLS
      if (errorMessage.includes('row-level security policy')) {
        setError('Erro de permissão: As políticas de segurança estão bloqueando o acesso. Execute o script SQL para corrigir as políticas RLS.');
      } else {
        setError(`Erro inesperado: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
      console.log('✅ [useRevendas] Busca finalizada');
    }
  }, []);

  async function addRevenda(revenda: Omit<Revenda, 'id'>) {
    try {
      setError(null);
      
      // Validar campos obrigatórios
      if (!revenda.username || !revenda.username.trim()) {
        setError('Username é obrigatório');
        console.error('❌ [useRevendas] Username não fornecido');
        return false;
      }
      
      if (!revenda.permission) {
        setError('Permissão é obrigatória');
        console.error('❌ [useRevendas] Permissão não fornecida');
        return false;
      }
      
      // Preparar dados para inserção, garantindo tipos corretos
      const revendaData: any = {
        username: revenda.username.trim(),
        email: revenda.email?.trim() || `${revenda.username.trim()}@revenda.local`, // Email obrigatório - usar padrão se não fornecido
        password: revenda.password || null, // Permitir null se não fornecido
        permission: revenda.permission,
        credits: revenda.credits ?? 10,
        personal_name: revenda.personal_name?.trim() || null,
        status: revenda.status || 'Ativo',
        force_password_change: typeof revenda.force_password_change === 'string' 
          ? revenda.force_password_change === 'true' 
          : revenda.force_password_change ?? false,
        monthly_reseller: revenda.monthly_reseller ?? false,
        disable_login_days: revenda.disable_login_days ?? 0,
      };
      
      // Adicionar campos opcionais apenas se tiverem valor
      if (revenda.servers?.trim()) revendaData.servers = revenda.servers.trim();
      if (revenda.master_reseller?.trim()) revendaData.master_reseller = revenda.master_reseller.trim();
      if (revenda.telegram?.trim()) revendaData.telegram = revenda.telegram.trim();
      if (revenda.whatsapp?.trim()) revendaData.whatsapp = revenda.whatsapp.trim();
      if (revenda.observations?.trim()) revendaData.observations = revenda.observations.trim();
      
      console.log('🔄 [useRevendas] Tentando adicionar revendedor:', revendaData);
      console.log('🔄 [useRevendas] JSON serializado:', JSON.stringify(revendaData, null, 2));
      
      // Obter token de autenticação do localStorage (igual ao useClientes)
      let authToken = '';
      
      try {
        const allKeys = Object.keys(localStorage);
        const supabaseKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('auth-token'));
        
        for (const key of supabaseKeys) {
          try {
            const authData = localStorage.getItem(key);
            if (authData) {
              const parsed = JSON.parse(authData);
              if (parsed?.access_token) {
                authToken = parsed.access_token;
                console.log('🔄 [useRevendas] Token encontrado no localStorage');
                break;
              }
            }
          } catch (e) {
            // Continuar procurando
          }
        }
        
        if (!authToken) {
          console.log('🔄 [useRevendas] Token não encontrado, usando apenas apikey');
        }
      } catch (e) {
        console.log('🔄 [useRevendas] Erro ao buscar token:', e);
      }
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation',
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const insertUrl = `${SUPABASE_URL}/rest/v1/resellers`;
      
      console.log('🔄 [useRevendas] URL:', insertUrl);
      console.log('🔄 [useRevendas] Headers:', { ...headers, Authorization: authToken ? 'Bearer ***' : 'Não fornecido' });
      
      // Timeout de 15 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      let response: Response;
      try {
        console.log('🔄 [useRevendas] Fazendo requisição POST...');
        response = await fetch(insertUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(revendaData),
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        console.log('🔄 [useRevendas] Requisição completa, status:', response.status);
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        if (fetchError.name === 'AbortError') {
          console.error('⏰ [useRevendas] Timeout na inserção (15 segundos)');
          setError('Erro de conexão: A operação está demorando muito. Verifique sua conexão com a internet.');
          return false;
        }
        
        throw fetchError;
      }
      
      console.log('🔄 [useRevendas] Resposta recebida:', response.status, response.statusText);
      
      const responseText = await response.text();
      console.log('🔄 [useRevendas] Resposta completa:', responseText);
      
      let data;
      let error: any = null;
      
      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch (parseError) {
        console.error('❌ [useRevendas] Erro ao fazer parse da resposta:', parseError);
        if (!response.ok) {
          error = {
            code: response.status.toString(),
            message: response.statusText || 'Erro desconhecido',
            details: responseText,
          };
        }
      }
      
      if (!response.ok || error) {
        const errorObj = error || data || {
          code: response.status.toString(),
          message: response.statusText || 'Erro desconhecido',
          details: responseText,
        };
        
        console.error('❌ [useRevendas] Erro do Supabase:', errorObj);
        console.error('❌ [useRevendas] Status:', response.status);
        console.error('❌ [useRevendas] Response Text completo:', responseText);
        console.error('❌ [useRevendas] Dados enviados:', JSON.stringify(revendaData, null, 2));
        
        // Verificar tipo de erro
        let errorMessage = '';
        if (response.status === 401 || errorObj.message?.includes('401') || errorObj.message?.includes('Unauthorized')) {
          errorMessage = 'Erro de autenticação: Sua sessão expirou. Por favor, faça login novamente.';
        } else if (errorObj.message?.includes('row-level security policy') || errorObj.message?.includes('new row violates row-level security') || errorObj.message?.includes('permission denied')) {
          errorMessage = 'Erro de permissão: As políticas de segurança (RLS) estão bloqueando a inserção. Verifique se você está autenticado e se as políticas RLS estão configuradas corretamente no Supabase.';
        } else if (response.status === 409 || errorObj.message?.includes('duplicate key') || errorObj.message?.includes('unique constraint')) {
          errorMessage = 'Erro: Já existe um revendedor com este username ou email.';
        } else if (response.status === 400 || errorObj.message?.includes('violates check constraint')) {
          errorMessage = `Erro de validação: ${errorObj.message || errorObj.details || 'Os dados fornecidos não atendem aos requisitos do banco de dados.'}`;
        } else {
          errorMessage = `Erro ao adicionar revendedor: ${errorObj.message || errorObj.details || 'Erro desconhecido'} (Status: ${response.status})`;
        }
        
        setError(errorMessage);
        console.error('❌ [useRevendas] Mensagem de erro definida:', errorMessage);
        return false;
      }
      
      console.log('✅ [useRevendas] Revendedor inserido com sucesso:', data);
      
      // Adicionar o revendedor diretamente ao estado ou buscar novamente
      if (data && Array.isArray(data) && data.length > 0) {
        const newRevenda = data[0] as Revenda;
        setRevendas(prevRevendas => [...prevRevendas, newRevenda]);
        console.log('✅ [useRevendas] Revendedor adicionado ao estado local');
      } else {
        // Se não conseguiu adicionar ao estado, buscar novamente
        console.log('🔄 [useRevendas] Atualizando lista de revendedores...');
        await fetchRevendas();
      }
      console.log('✅ [useRevendas] Lista atualizada!');
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.error('❌ [useRevendas] Erro inesperado ao adicionar revendedor:', err);
      console.error('❌ [useRevendas] Stack trace:', err instanceof Error ? err.stack : 'N/A');
      setError(`Erro inesperado ao adicionar revendedor: ${errorMessage}`);
      return false;
    }
  }

  async function updateRevenda(id: number, updates: Partial<Revenda>) {
    try {
      setError(null);
      
      const { data, error } = await supabase.from('resellers').update(updates).eq('id', id).select();
      
      if (error) {
        console.error('Erro ao atualizar revendedor:', error);
        
        // Verificar se é erro de RLS
        if (error.message.includes('row-level security policy')) {
          setError('Erro de permissão: As políticas de segurança estão bloqueando a atualização. Execute o script SQL para corrigir as políticas RLS.');
        } else {
          setError(`Erro ao atualizar revendedor: ${error.message}`);
        }
        return false;
      }
      
      await fetchRevendas();
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro inesperado ao atualizar revendedor: ${errorMessage}`);
      console.error('Erro ao atualizar revendedor:', err);
      return false;
    }
  }

  async function deleteRevenda(id: number) {
    try {
      setError(null);
      console.log('🔄 [useRevendas] Deletando revendedor com ID:', id);
      
      // Obter token de autenticação do localStorage
      let authToken = '';
      
      try {
        const allKeys = Object.keys(localStorage);
        const supabaseKeys = allKeys.filter(key => key.startsWith('sb-') && key.includes('auth-token'));
        
        for (const key of supabaseKeys) {
          try {
            const authData = localStorage.getItem(key);
            if (authData) {
              const parsed = JSON.parse(authData);
              if (parsed?.access_token) {
                authToken = parsed.access_token;
                console.log('🔄 [useRevendas] Token encontrado no localStorage');
                break;
              }
            }
          } catch (e) {
            // Continuar procurando
          }
        }
        
        if (!authToken) {
          console.log('🔄 [useRevendas] Token não encontrado, usando apenas apikey');
        }
      } catch (e) {
        console.log('🔄 [useRevendas] Erro ao buscar token:', e);
      }
      
      // Preparar headers
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation',
      };
      
      // Adicionar token de autenticação se disponível
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      // Usar fetch direto para deletar
      const deleteUrl = `${SUPABASE_URL}/rest/v1/resellers?id=eq.${id}`;
      console.log('🔄 [useRevendas] URL de exclusão:', deleteUrl);
      console.log('🔄 [useRevendas] Headers:', { ...headers, Authorization: authToken ? 'Bearer ***' : 'Não fornecido' });
      
      const response = await fetch(deleteUrl, {
        method: 'DELETE',
        headers: headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Erro HTTP: ${response.status} ${response.statusText}`;
        console.error('❌ [useRevendas] Erro ao deletar revendedor:', errorMessage);
        
        // Verificar se é erro de RLS
        if (errorMessage.includes('row-level security policy') || errorMessage.includes('permission denied')) {
          setError('Erro de permissão: As políticas de segurança estão bloqueando a exclusão. Execute o script SQL para corrigir as políticas RLS.');
        } else {
          setError(`Erro ao deletar revendedor: ${errorMessage}`);
        }
        return false;
      }
      
      console.log('✅ [useRevendas] Revendedor deletado com sucesso');
      
      // Atualizar lista de revendedores
      await fetchRevendas();
      
      // Atualizar estado local removendo o revendedor deletado
      setRevendas(prevRevendas => prevRevendas.filter(revenda => revenda.id !== id));
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(`Erro inesperado ao deletar revendedor: ${errorMessage}`);
      console.error('❌ [useRevendas] Erro ao deletar revendedor:', err);
      return false;
    }
  }

  useEffect(() => { 
    fetchRevendas(); 
  }, []);

  return { 
    revendas, 
    loading, 
    error, 
    addRevenda, 
    updateRevenda, 
    deleteRevenda, 
    fetchRevendas,
    clearError: () => setError(null)
  };
} 