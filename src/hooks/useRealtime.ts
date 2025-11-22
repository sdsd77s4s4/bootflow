import { useEffect, useState, useCallback, useRef } from 'react';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase.types';
import { isDemoMode } from '@/lib/demoAuth';

type Table = 'profiles' | 'cobrancas' | 'users' | 'resellers';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface UseRealtimeOptions<T> {
  table: Table;
  filter?: string;
  event?: EventType;
  schema?: string;
  onPayload?: (payload: RealtimePostgresChangesPayload<T>) => void;
}

export function useRealtime<T>({
  table,
  filter = '*',
  event = '*',
  schema = 'public',
  onPayload,
}: UseRealtimeOptions<T>) {
  const [data, setData] = useState<T[]>([]);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const errorLoggedRef = useRef(false); // Para evitar logs repetidos
  const isDemo = isDemoMode();

  // Função para buscar dados iniciais
  const fetchData = useCallback(async () => {
    try {
      const { data: initialData, error: queryError } = await supabase
        .from(table)
        .select('*');

      if (queryError) throw queryError;
      
      setData(initialData || []);
      errorLoggedRef.current = false; // Reset quando bem-sucedido
      return initialData || [];
    } catch (err) {
      // Só loga erro se não estiver em modo demo e não tiver logado ainda
      if (!isDemo && !errorLoggedRef.current) {
        console.error(`Erro ao buscar dados iniciais da tabela ${table}:`, err);
        errorLoggedRef.current = true;
      }
      setError(err instanceof Error ? err : new Error(String(err)));
      return [];
    }
  }, [table, isDemo]);

  // Configura a assinatura em tempo real
  useEffect(() => {
    // Busca os dados iniciais
    fetchData();

    // Configura a assinatura para mudanças em tempo real
    const subscription = supabase
      .channel(`realtime_${table}`)
      .on(
        'postgres_changes',
        {
          event: event as EventType,
          schema,
          table,
          filter,
        },
        (payload) => {
          // Atualiza o estado local com base no tipo de evento
          setData((currentData) => {
            switch (payload.eventType) {
              case 'INSERT':
                return [...currentData, payload.new as T];
              case 'UPDATE':
                return currentData.map((item: T) => {
                  const newItemId = (payload.new as unknown as { id?: string | number }).id;
                  const itemId = (item as unknown as { id?: string | number }).id;
                  return itemId === newItemId ? (payload.new as T) : item;
                });
              case 'DELETE':
                return currentData.filter((item: T) => {
                  const itemId = (item as unknown as { id?: string | number }).id;
                  const oldId = (payload.old as unknown as { id?: string | number }).id;
                  return itemId !== oldId;
                });
              default:
                return currentData;
            }
          });

          // Chama o callback personalizado, se fornecido
          if (onPayload) {
            onPayload(payload as RealtimePostgresChangesPayload<T>);
          }
        }
      )
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
        
        if (status === 'CHANNEL_ERROR') {
          // Só loga erro se não estiver em modo demo e não tiver logado ainda
          if (!isDemo && !errorLoggedRef.current) {
            console.error('Erro na conexão em tempo real');
            errorLoggedRef.current = true;
          }
          setError(new Error('Erro na conexão em tempo real'));
        } else if (status === 'TIMED_OUT') {
          if (!isDemo && !errorLoggedRef.current) {
            console.error('Conexão em tempo real expirada');
            errorLoggedRef.current = true;
          }
          setError(new Error('Conexão em tempo real expirada'));
        } else if (status === 'CLOSED') {
          if (!isDemo) {
            console.log('Conexão em tempo real fechada');
          }
          setIsConnected(false);
        } else if (status === 'SUBSCRIBED') {
          errorLoggedRef.current = false; // Reset quando conectado com sucesso
        }
      });

    // Limpeza da assinatura ao desmontar o componente
    return () => {
      subscription.unsubscribe();
    };
  }, [table, filter, event, schema, onPayload, fetchData, isDemo]);

  // Função para forçar uma atualização dos dados
  const refresh = useCallback(async () => {
    return fetchData();
  }, [fetchData]);

  return { data, error, isConnected, refresh };
}

// Hook específico para a tabela de perfis
export function useRealtimeProfiles() {
  return useRealtime<Database['public']['Tables']['profiles']['Row']>({
    table: 'profiles',
    event: '*',
  });
}

// Hook específico para a tabela de cobranças
export function useRealtimeCobrancas() {
  return useRealtime<Database['public']['Tables']['cobrancas']['Row']>({
    table: 'cobrancas',
    event: '*',
  });
}

// Hook específico para a tabela de clientes
export function useRealtimeClientes() {
  return useRealtime<Database['public']['Tables']['clientes']['Row']>({
    table: 'clientes',
    event: '*',
  });
}

// Hook específico para a tabela de revendas
export function useRealtimeRevendas() {
  return useRealtime<Database['public']['Tables']['revendas']['Row']>({
    table: 'revendas',
    event: '*',
  });
}
