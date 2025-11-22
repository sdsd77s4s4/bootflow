import { createClient } from '@supabase/supabase-js';
import { getErrorMessage } from './supabaseClient.agent';
import type { Database } from '@/types/supabase.types';

// Configuração do cliente Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://mnjivyaztsgxaqihrqec.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uaml2eWF6dHNneGFxaWhycWVjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIyNzk1MzIsImV4cCI6MjA3Nzg1NTUzMn0.TDtX3vbrQXtECUqsyrUiGN81fUOYpAK7WRpOEk1acR8';

// Log de diagnóstico
const usingEnvVars = !!import.meta.env.VITE_SUPABASE_URL && !!import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!usingEnvVars) {
  console.warn('⚠️ ATENÇÃO: Variáveis de ambiente não encontradas!');
  console.warn('📝 Criando arquivo .env na raiz do projeto com as seguintes variáveis:');
  console.warn(`   VITE_SUPABASE_URL=${supabaseUrl}`);
  console.warn(`   VITE_SUPABASE_ANON_KEY=<sua-chave-aqui>`);
  console.warn('🔄 Reinicie o servidor após criar o arquivo .env');
} else {
  console.log('✅ Variáveis de ambiente do Supabase carregadas do arquivo .env');
}

// Validação da URL do Supabase
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas corretamente.');
  console.log('Usando valores padrão para desenvolvimento local.');
}

// Validação do formato da URL
try {
  new URL(supabaseUrl);
  console.log(`🔗 URL do Supabase: ${supabaseUrl}`);
} catch (error) {
  console.error('❌ URL do Supabase inválida:', supabaseUrl);
  console.error('Verifique se a URL está correta no arquivo .env');
}

// Função de teste de conectividade
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': supabaseAnonKey,
      },
    });
    
    if (response.ok) {
      console.log('✅ Conexão com Supabase bem-sucedida!');
      return { success: true };
    } else {
      console.error('❌ Erro ao conectar com Supabase:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}: ${response.statusText}` };
    }
  } catch (error: unknown) {
    const errorMsg = getErrorMessage(error);
    console.error('❌ Erro de conexão:', errorMsg);
    
    if (errorMsg.includes('ERR_NAME_NOT_RESOLVED') || errorMsg.includes('Failed to fetch')) {
      console.error('💡 Possíveis causas:');
      console.error('   1. O projeto Supabase pode estar pausado ou deletado');
      console.error('   2. A URL do Supabase está incorreta');
      console.error('   3. Problemas de conexão com a internet ou DNS');
      console.error('   4. Firewall ou proxy bloqueando a conexão');
      console.error('');
      console.error('📋 Verifique:');
      console.error('   - Acesse https://app.supabase.com e verifique se o projeto está ativo');
      console.error('   - Copie a URL correta em Settings > API > Project URL');
      console.error('   - Verifique se há um arquivo .env com as variáveis corretas');
    }
    
    return { success: false, error: errorMsg };
  }
};

// Exporta a URL para uso em outros lugares
export const SUPABASE_URL = supabaseUrl;
export const SUPABASE_ANON_KEY = supabaseAnonKey;

// Teste automático de conexão ao carregar o módulo (apenas em desenvolvimento)
if (import.meta.env.DEV) {
  // Executa após um pequeno delay para não bloquear a inicialização
  setTimeout(() => {
    testSupabaseConnection().catch(() => {
      // Erro já foi logado na função
    });
  }, 1000);
}

// Criação da instância única do cliente Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    detectSessionInUrl: true,
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'bootflow-web/1.0.0',
    },
  },
});

// Tipos úteis para o frontend
export type UserProfile = Database['public']['Tables']['profiles']['Row'] & {
  role?: 'admin' | 'reseller' | 'client';
};

export type UserProfileInsert = Database['public']['Tables']['profiles']['Insert'];
export type UserProfileUpdate = Database['public']['Tables']['profiles']['Update'];

/**
 * Obtém o perfil do usuário pelo ID
 * @param userId ID do usuário
 * @returns Perfil do usuário ou null se não encontrado
 */
export const getProfile = async (userId: string): Promise<UserProfile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    console.error('Erro ao buscar perfil:', getErrorMessage(error));
    return null;
  }
};

/**
 * Atualiza o perfil do usuário
 * @param userId ID do usuário
 * @param updates Campos para atualização
 * @returns Perfil atualizado
 */
export const updateUserProfile = async (userId: string, updates: UserProfileUpdate): Promise<UserProfile> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error: unknown) {
    const msg = getErrorMessage(error);
    console.error('Erro ao atualizar perfil:', msg);
    throw new Error(msg);
  }
};

/**
 * Faz logout do usuário
 */
export const signOut = async (): Promise<void> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  } catch (error: unknown) {
    console.error('Erro ao fazer logout:', getErrorMessage(error));
  }
};
