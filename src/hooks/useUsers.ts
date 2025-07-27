import React, { useState, useEffect } from 'react';
import { db } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

export interface User {
  id: number;
  name: string;
  email: string;
  plan: string;
  status: string;
  createdAt: string;
  phone?: string;
  telegram?: string;
  whatsapp?: string;
  notes?: string;
  devices?: number;
  credits?: number;
  renewalDate?: string;
  password?: string;
  observations?: string;
  expirationDate?: string;
  bouquets?: string;
  m3uUrl?: string;
}

// Mapear dados do Supabase para interface User
const mapSupabaseUserToUser = (supabaseUser: Database['public']['Tables']['users']['Row']): User => ({
  id: supabaseUser.id,
  name: supabaseUser.name,
  email: supabaseUser.email,
  plan: 'Cliente', // Valor padrão
  status: 'Ativo', // Valor padrão
  createdAt: supabaseUser.created_at || new Date().toISOString(),
  observations: supabaseUser.observations || undefined,
  password: supabaseUser.password || undefined,
  expirationDate: supabaseUser.expiration_date || undefined,
  bouquets: supabaseUser.bouquets || undefined,
  m3uUrl: supabaseUser.m3u_url || undefined,
});

export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data, error } = await db.users.getAll();
      if (error) {
        setError(error.message);
      } else {
        const mappedUsers = data?.map(mapSupabaseUserToUser) || [];
        setUsers(mappedUsers);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (user: Omit<User, 'id'>) => {
    setError(null);
    
    try {
      const supabaseUser = {
        name: user.name,
        email: user.email,
        observations: user.notes || user.observations,
        password: user.password,
        expiration_date: user.expirationDate || user.renewalDate,
        bouquets: user.bouquets,
        m3u_url: user.m3uUrl,
      };

      const { data, error } = await db.users.create(supabaseUser);
      if (error) {
        setError(error.message);
      } else if (data) {
        const newUser = mapSupabaseUserToUser(data);
        setUsers([newUser, ...users]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao adicionar usuário');
    }
  };

  const updateUser = async (id: number, updates: Partial<User>) => {
    setError(null);
    
    try {
      const supabaseUpdates = {
        name: updates.name,
        email: updates.email,
        observations: updates.notes || updates.observations,
        password: updates.password,
        expiration_date: updates.expirationDate || updates.renewalDate,
        bouquets: updates.bouquets,
        m3u_url: updates.m3uUrl,
      };

      const { data, error } = await db.users.update(id, supabaseUpdates);
      if (error) {
        setError(error.message);
      } else if (data) {
        const updatedUser = mapSupabaseUserToUser(data);
        setUsers(users.map(user => 
          user.id === id ? updatedUser : user
        ));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar usuário');
    }
  };

  const deleteUser = async (id: number) => {
    setError(null);
    
    try {
      const { error } = await db.users.delete(id);
      if (error) {
        setError(error.message);
      } else {
    setUsers(users.filter(user => user.id !== id));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar usuário');
    }
  };

  const getActiveUsers = () => {
    return users.filter(user => user.status === 'Ativo');
  };

  const getUserById = (id: number) => {
    return users.find(user => user.id === id);
  };

  // Carregar usuários na inicialização
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    users,
    loading,
    error,
    addUser,
    updateUser,
    deleteUser,
    getActiveUsers,
    getUserById,
    fetchUsers
  };
}; 