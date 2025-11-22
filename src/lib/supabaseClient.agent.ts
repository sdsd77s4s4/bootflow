import { createClient, SupabaseClient, SupabaseClientOptions } from '@supabase/supabase-js';

type Json = Record<string, unknown> | unknown[] | string | number | boolean | null;

export interface AgentSupabaseOptions {
  url?: string;
  anonKey?: string;
  serviceRoleKey?: string;
  cacheTTL?: number;
  schema?: string;
  clientOptions?: SupabaseClientOptions<'public'>;
}

interface CachedEntry {
  expires: number;
  payload: Json;
}

class AgentSupabaseCache {
  private map = new Map<string, CachedEntry>();
  constructor(private ttl: number) {}

  get<T extends Json>(key: string): T | null {
    const cached = this.map.get(key);
    if (!cached) return null;
    if (cached.expires < Date.now()) {
      this.map.delete(key);
      return null;
    }
    return cached.payload as T;
  }

  set(key: string, payload: Json) {
    this.map.set(key, { payload, expires: Date.now() + this.ttl });
  }

  clear() {
    this.map.clear();
  }
}

/**
 * Safely extract a readable message from an unknown error value.
 */
export const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error) || 'Erro desconhecido';
  } catch {
    return 'Erro desconhecido';
  }
};

export interface AgentSupabaseClient {
  client: SupabaseClient;
  cache: AgentSupabaseCache;
  invokeEdgeFunction<TResult = unknown, TPayload extends Json = Json>(
    functionName: string,
    payload?: TPayload,
  ): Promise<TResult>;
  cachedQuery<TResult = unknown>(
    cacheKey: string,
    loader: () => Promise<TResult>,
    ttlOverride?: number,
  ): Promise<TResult>;
  listenRealtime<T = unknown>(
    channel: string,
    event: string,
    callback: (payload: T) => void,
  ): () => void;
}

const DEFAULT_TTL = 30_000;

const resolveOptions = (options?: AgentSupabaseOptions) => {
  const url = options?.url ?? import.meta.env.VITE_SUPABASE_URL ?? '';
  const anonKey = options?.anonKey ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
  if (!url || !anonKey) {
    console.warn('[AgentSupabase] Falling back to legacy supabase.ts configuration');
  }
  return {
    url,
    anonKey,
    ttl: options?.cacheTTL ?? DEFAULT_TTL,
    schema: options?.schema ?? 'public',
    clientOptions: options?.clientOptions ?? {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: options?.schema ?? 'public',
      },
      realtime: {
        params: {
          eventsPerSecond: 30,
        },
      },
    },
  };
};

export const createAgentSupabaseClient = (options?: AgentSupabaseOptions): AgentSupabaseClient => {
  const { url, anonKey, ttl, clientOptions } = resolveOptions(options);

  const client = createClient(url, anonKey, {
    ...clientOptions,
    global: {
      headers: {
        ...clientOptions?.global?.headers,
        'X-Agent-Client': 'bootflow-agent/2025',
      },
    },
  });

  const cache = new AgentSupabaseCache(ttl);

  const invokeEdgeFunction = async <TResult = unknown, TPayload extends Json = Json>(
    functionName: string,
    payload?: TPayload,
  ): Promise<TResult> => {
    const { data, error } = await client.functions.invoke<TResult>(functionName, {
      body: payload ?? {},
    });
    if (error) {
      throw new Error(`[AgentSupabase] Edge function ${functionName} failed: ${error.message}`);
    }
    return data as TResult;
  };

  const cachedQuery = async <TResult = unknown>(
    cacheKey: string,
    loader: () => Promise<TResult>,
    ttlOverride?: number,
  ): Promise<TResult> => {
    const hit = cache.get<TResult>(cacheKey);
    if (hit) return hit;
    const result = await loader();
    const expiration = ttlOverride ? Date.now() + ttlOverride : undefined;
    cache.set(cacheKey, result as Json);
    if (expiration) {
      const entry = cache['map'].get(cacheKey);
      if (entry) entry.expires = expiration;
    }
    return result;
  };

  const listenRealtime = <T = unknown>(channel: string, event: string, callback: (payload: T) => void) => {
    const subscription = client
      .channel(channel, { config: { broadcast: { ack: true } } })
      .on(event as string, (payload) => callback((payload as unknown as { payload: T }).payload))
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.info(`[AgentSupabase] Listening ${channel} for event ${event}`);
        }
      });

    return () => {
      client.removeChannel(subscription);
    };
  };

  return {
    client,
    cache,
    invokeEdgeFunction,
    cachedQuery,
    listenRealtime,
  };
};

export type { SupabaseClient };
