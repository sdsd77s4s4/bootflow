import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { useState, useEffect } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://zluggifavplgsxzbupiq.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpsdWdnaWZhdnBsZ3N4emJ1cGlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMwOTM0MTgsImV4cCI6MjA2ODY2OTQxOH0.WTwWCO09lVv3JIcI49WX4Ho7cPv6WNUlv5AzsjEBN14";

// Cliente principal do Supabase
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: {
    headers: {
      'X-Client-Info': 'bootflow-app',
    },
  },
});

// Funções de autenticação
export const auth = {
  // Login com email e senha
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  // Registro com email e senha
  signUp: async (email: string, password: string, metadata?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata,
      },
    });
    return { data, error };
  },

  // Logout
  signOut: async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  // Obter usuário atual
  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    return { user, error };
  },

  // Obter sessão atual
  getCurrentSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  },

  // Reset de senha
  resetPassword: async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    return { error };
  },

  // Atualizar senha
  updatePassword: async (password: string) => {
    const { error } = await supabase.auth.updateUser({
      password,
    });
    return { error };
  },
};

// Funções de banco de dados
export const db = {
  // Usuários
  users: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (user: Database['public']['Tables']['users']['Insert']) => {
      const { data, error } = await supabase
        .from('users')
        .insert([user])
        .select()
        .single();
      return { data, error };
    },

    update: async (id: number, updates: Database['public']['Tables']['users']['Update']) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id: number) => {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', id);
      return { error };
    },
  },

  // Revendedores
  resellers: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .order('created_at', { ascending: false });
      return { data, error };
    },

    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('resellers')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (reseller: Database['public']['Tables']['resellers']['Insert']) => {
      const { data, error } = await supabase
        .from('resellers')
        .insert([reseller])
        .select()
        .single();
      return { data, error };
    },

    update: async (id: number, updates: Database['public']['Tables']['resellers']['Update']) => {
      const { data, error } = await supabase
        .from('resellers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id: number) => {
      const { error } = await supabase
        .from('resellers')
        .delete()
        .eq('id', id);
      return { error };
    },
  },

  // Cobranças
  cobrancas: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .order('id', { ascending: false });
      return { data, error };
    },

    getById: async (id: number) => {
      const { data, error } = await supabase
        .from('cobrancas')
        .select('*')
        .eq('id', id)
        .single();
      return { data, error };
    },

    create: async (cobranca: Database['public']['Tables']['cobrancas']['Insert']) => {
      const { data, error } = await supabase
        .from('cobrancas')
        .insert([cobranca])
        .select()
        .single();
      return { data, error };
    },

    update: async (id: number, updates: Database['public']['Tables']['cobrancas']['Update']) => {
      const { data, error } = await supabase
        .from('cobrancas')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    },

    delete: async (id: number) => {
      const { error } = await supabase
        .from('cobrancas')
        .delete()
        .eq('id', id);
      return { error };
    },
  },
};

// Hook para autenticação
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obter usuário inicial
    auth.getCurrentUser().then(({ user }) => {
      setUser(user);
      setLoading(false);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
};

// Exportar tipos
export type { Database }; 