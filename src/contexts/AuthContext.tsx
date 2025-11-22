import React, { createContext, useState, useContext, useEffect, ReactNode, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase, UserProfile } from '@/lib/supabase';
import { getErrorMessage } from '@/lib/supabaseClient.agent';
import {
  isDemoMode,
  enableDemoMode,
  disableDemoMode,
  validateDemoCredentials,
  createDemoSession,
  getDemoSession,
  clearDemoSession,
  hasDemoSession,
  DEMO_USERS,
} from '@/lib/demoAuth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  userRole: 'admin' | 'reseller' | 'client' | null;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signUp: (email: string, password: string, userData: { full_name: string; role?: 'admin' | 'reseller' | 'client' }) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<{ error: Error | null }>;
  refreshSession: () => Promise<void>;
}

type NavigateFunction = (path: string) => void;

interface AuthProviderProps {
  children: ReactNode;
  navigate?: NavigateFunction;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children, navigate }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [userRole, setUserRole] = useState<'admin' | 'reseller' | 'client' | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(isDemoMode());
  const isAuthenticated = !!user;

  const safeNavigate = useCallback((path: string) => {
    if (window.location.pathname !== path) {
      console.log(`[AuthContext] Navegando para: ${path}`);
      if (navigate) {
        navigate(path);
      } else if (window) {
        window.location.href = path;
      }
    } else {
      console.log(`[AuthContext] Já está em: ${path}, não navega.`);
    }
  }, [navigate]);

  const redirectBasedOnRole = useCallback((role: 'admin' | 'reseller' | 'client') => {
    console.log(`[AuthContext] Redirecionando com role:`, role);
    
    switch (role) {
      case 'admin':
        safeNavigate('/admin');
        break;
      case 'reseller':
        safeNavigate('/reseller');
        break;
      case 'client':
        safeNavigate('/dashboard/client');
        break;
      default:
        safeNavigate('/');
        break;
    }
  }, [safeNavigate]);

  const fetchUserProfile = useCallback(async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as UserProfile;
    } catch (error) {
      console.error('Erro ao buscar perfil do usuário:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        let userProfile = await fetchUserProfile(session.user.id);
        
        // Se o perfil não existir (primeiro login com OAuth), cria um perfil básico
        if (!userProfile && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
          try {
            const fullName = session.user.user_metadata?.full_name || 
                           session.user.user_metadata?.name || 
                           session.user.email?.split('@')[0] || 
                           'Usuário';
            
            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert([
                {
                  id: session.user.id,
                  email: session.user.email?.toLowerCase() || '',
                  full_name: fullName,
                  role: 'client', // Role padrão para novos usuários OAuth
                },
              ])
              .select()
              .single();
            
            if (profileError) {
              console.error('Erro ao criar perfil para usuário OAuth:', profileError);
            } else {
              userProfile = newProfile as UserProfile;
              console.log('Perfil criado automaticamente para usuário OAuth:', userProfile);
            }
          } catch (error) {
            console.error('Erro ao criar perfil para usuário OAuth:', error);
          }
        }
        
        setProfile(userProfile);
        const role = userProfile?.role || 'client';
        setUserRole(role);

        if (window.location.pathname === '/login' || window.location.pathname === '/auth/callback') {
          if (role === 'admin' || role === 'reseller' || role === 'client') {
            redirectBasedOnRole(role);
          } else {
            console.warn('[AuthContext] Role inválida, redirecionando para /');
            safeNavigate('/');
          }
        }
      } else {
        setProfile(null);
        setUserRole(null);
      }
      
      setLoading(false);
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, redirectBasedOnRole, fetchUserProfile]);

  // Gerenciar mudanças de autenticação
  useEffect(() => {
    // Verificar sessão ativa ao montar o componente
    const checkSession = async () => {
      setLoading(true);
      
      // Verifica se o modo demo está habilitado
      const demoModeEnabled = import.meta.env.VITE_DEMO_MODE !== 'false';
      
      // Se o modo demo estiver desabilitado, limpa qualquer sessão demo existente
      if (!demoModeEnabled && hasDemoSession()) {
        clearDemoSession();
        disableDemoMode();
      }
      
      // Verifica primeiro se há sessão demo (apenas se o modo demo estiver habilitado)
      if (demoModeEnabled && hasDemoSession()) {
        const demoData = getDemoSession();
        if (demoData) {
          setSession(demoData.session as Session);
          setUser(demoData.session.user as User);
          setProfile(demoData.profile as UserProfile);
          setUserRole(demoData.profile.role);
          setDemoMode(true);
          setLoading(false);
          return;
        }
      }
      
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Erro ao obter sessão:', error);
          // Se houver erro de conexão, sugere modo demo
          if (error.message?.includes('Failed to fetch') || error.message?.includes('ERR_NAME_NOT_RESOLVED')) {
            console.log('💡 Modo demo disponível. Use as credenciais demo para testar.');
          }
          setLoading(false);
          return;
        }
        
        if (session?.user) {
          const userProfile = await fetchUserProfile(session.user.id);
          const role = userProfile?.role || 'client';
          
          // Atualiza o estado com os dados do usuário e perfil
          setSession(session);
          setUser(session.user);
          setProfile(userProfile);
          setUserRole(role);
          setDemoMode(false);
          
          // Redireciona para a dashboard apropriada se estiver na página de login
          if (window.location.pathname === '/login') {
            redirectBasedOnRole(role);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar sessão:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, [fetchUserProfile, redirectBasedOnRole]);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      
      // Verifica se o modo demo está habilitado via variável de ambiente
      const demoModeEnabled = import.meta.env.VITE_DEMO_MODE !== 'false';
      
      // Primeiro tenta autenticação demo se as credenciais corresponderem E o modo demo estiver habilitado
      if (demoModeEnabled) {
        const demoUser = validateDemoCredentials(email, password);
        if (demoUser) {
          console.log('🎭 Usando modo demo para login');
          enableDemoMode();
          setDemoMode(true);
          
          const demoSession = createDemoSession(demoUser);
          const demoProfile: UserProfile = {
            id: demoUser.id,
            email: demoUser.email,
            full_name: demoUser.full_name,
            role: demoUser.role,
            avatar_url: demoUser.avatar_url,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          
          setSession(demoSession as Session);
          setUser(demoSession.user as User);
          setProfile(demoProfile);
          setUserRole(demoUser.role);
          
          toast.success(`Login demo realizado com sucesso! Bem-vindo, ${demoUser.full_name}!`, {
            duration: 5000,
          });
          
          redirectBasedOnRole(demoUser.role);
          return { error: null };
        }
      }
      
      // Tenta autenticação Supabase normal
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.session) throw new Error('Erro ao fazer login: Sessão não encontrada');

      // Busca o perfil do usuário
      const userProfile = await fetchUserProfile(data.session.user.id);
      const role = userProfile?.role || 'client';
      
      // Atualiza o estado com os dados do usuário e perfil
      setSession(data.session);
      setUser(data.session.user);
      setProfile(userProfile);
      setUserRole(role);
      setDemoMode(false);
      
      // Exibe mensagem de sucesso
      toast.success('Login realizado com sucesso! Redirecionando...');
      
      // Redireciona com base no papel do usuário
      redirectBasedOnRole(role);
      
      return { error: null };
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      console.error('Erro no login:', errMsg);

      // Tratamento específico para erros de conexão/rede
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      let showDemoHint = false;
      let showCreateUserHint = false;
      
      // Tratamento específico para email não confirmado
      if (errMsg.includes('Email not confirmed') || errMsg.includes('email_not_confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login. Verifique sua caixa de entrada e a pasta de spam.';
        toast.error(errorMessage);
        return { error: new Error(errorMessage) };
      }

      if (errMsg.includes('Failed to fetch') || 
          errMsg.includes('ERR_NAME_NOT_RESOLVED') ||
          errMsg.includes('NetworkError') ||
          errMsg.includes('AuthRetryableFetchError')) {
        errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor.';
        showDemoHint = true;
      } else if (errMsg.includes('Invalid login credentials') || 
                 errMsg.includes('invalid_credentials') ) {
        errorMessage = 'Credenciais inválidas. Verifique se o usuário existe no Supabase.';
        showCreateUserHint = true;
      } else if (errMsg) {
        errorMessage = errMsg;
      }

      toast.error(errorMessage, {
        duration: 10000,
        description: showCreateUserHint 
          ? '💡 Crie um usuário no Supabase: Authentication > Users > Add User. Veja o arquivo criar_usuario_admin.sql para instruções.' 
          : showDemoHint 
            ? '💡 Use as credenciais demo para testar: admin@demo.com / admin123' 
            : undefined,
      });

      if (showDemoHint) {
        console.log('💡 Credenciais demo disponíveis:');
        DEMO_USERS.forEach(user => {
          console.log(`   ${user.email} / ${user.password} (${user.role})`);
        });
      }
      
      if (showCreateUserHint) {
        console.log('💡 Para criar um usuário admin no Supabase:');
        console.log('   1. Acesse: https://app.supabase.com → Seu Projeto → Authentication → Users → Add User');
        console.log('   2. Preencha email e senha');
        console.log('   3. Marque "Auto Confirm User"');
        console.log('   4. Adicione em User Metadata: {"role": "admin", "full_name": "Seu Nome"}');
        console.log('   5. Veja o arquivo criar_usuario_admin.sql para mais detalhes');
      }

      return { error: new Error(errMsg) };
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Inicia o fluxo OAuth do Google
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) throw error;
      
      // O redirecionamento será feito automaticamente pelo Supabase
      // O callback será tratado pelo onAuthStateChange
      return { error: null };
    } catch (error: any) {
      console.error('Erro no login com Google:', error);
      
      let errorMessage = 'Erro ao fazer login com Google. Tente novamente.';
      
      if (error?.message?.includes('Failed to fetch') || 
          error?.message?.includes('ERR_NAME_NOT_RESOLVED') ||
          error?.message?.includes('NetworkError')) {
        errorMessage = 'Erro de conexão: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.';
      } else if (error?.message?.includes('popup_closed_by_user')) {
        errorMessage = 'Login cancelado. A janela de autenticação foi fechada.';
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage, {
        duration: 10000,
        description: '💡 Certifique-se de que o Google OAuth está configurado no Supabase.',
      });

      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, userData: { full_name: string; role?: 'admin' | 'reseller' | 'client' }) => {
    try {
      setLoading(true);
      
      // Validação do e-mail
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Por favor, insira um endereço de e-mail válido.');
      }
      
      // Validação da senha
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        throw new Error(
          'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
        );
      }
      
      // Validação do nome completo
      if (!userData.full_name || userData.full_name.trim().length < 3) {
        throw new Error('Por favor, insira um nome completo válido (mínimo 3 caracteres).');
      }
      
      // Cria o usuário no Supabase Auth
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            full_name: userData.full_name.trim(),
            role: userData.role || 'client',
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (signUpError) throw signUpError;
      
      // O perfil será criado automaticamente pelo trigger handle_new_user()
      // que é executado quando um novo usuário é inserido em auth.users
      // Não é necessário inserir manualmente na tabela profiles
      
      toast.success('Conta criada com sucesso! Verifique seu e-mail para confirmar sua conta.');
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      const errorMessage = error.message.includes('already registered')
        ? 'Este e-mail já está cadastrado. Tente fazer login ou recuperar sua senha.'
        : error.message || 'Erro ao criar conta. Tente novamente.';
      
      toast.error(errorMessage);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async (): Promise<{ error: AuthError | null }> => {
    try {
      setLoading(true);
      
      // Se estiver em modo demo, apenas limpa o estado local
      if (demoMode || hasDemoSession()) {
        clearDemoSession();
        setUser(null);
        setSession(null);
        setProfile(null);
        setUserRole(null);
        setDemoMode(false);
        safeNavigate('/login');
        toast.success('Você saiu da sua conta demo com sucesso!');
        return { error: null };
      }
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      // Limpa o estado
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      
      // Redireciona para a página de login
      safeNavigate('/login');
      
      // Exibe mensagem de sucesso
      toast.success('Você saiu da sua conta com sucesso!');
      
      return { error: null };
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao sair da conta. Tente novamente.');
      return { error: error as AuthError };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string) => {
    try {
      setLoading(true);
      
      // Validação básica do e-mail
      if (!email || !/\S+@\S+\.\S+/.test(email)) {
        throw new Error('Por favor, insira um endereço de e-mail válido.');
      }
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      
      if (error) throw error;
      
      toast.success('E-mail de redefinição de senha enviado com sucesso! Verifique sua caixa de entrada.');
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao enviar e-mail de redefinição de senha:', error);
      const errorMessage = error.message.includes('email') 
        ? 'Este endereço de e-mail não está cadastrado.' 
        : 'Erro ao enviar e-mail de redefinição de senha. Tente novamente.';
      
      toast.error(errorMessage);
      return { error };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    try {
      if (!user) throw new Error('Usuário não autenticado');
      
      setLoading(true);
      
      // Validações básicas
      if (updates.email && !/\S+@\S+\.\S+/.test(updates.email)) {
        throw new Error('Por favor, insira um endereço de e-mail válido.');
      }
      
      // Prepara os dados para atualização
      const updateData: Partial<UserProfile> = { ...updates };
      
      // Remove campos que não devem ser atualizados diretamente
      delete updateData.id;
      delete updateData.created_at;
      delete updateData.updated_at;
      
      // Atualiza o perfil no banco de dados
      const { data, error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)
        .select()
        .single();
        
      if (error) throw error;
      
      // Atualiza o estado local
      if (data) {
        const updatedProfile = { ...profile, ...data };
        setProfile(updatedProfile);
        
        // Se o papel foi atualizado, atualiza o redirecionamento
        if (updates.role) {
          setUserRole(updates.role);
          // Não redireciona automaticamente para evitar problemas de UX
          // O usuário pode querer continuar editando
          toast.success('Perfil atualizado com sucesso! Atualizando permissões...');
          // Pequeno atraso para o usuário ver a mensagem
          setTimeout(() => redirectBasedOnRole(updates.role!), 1000);
        } else {
          toast.success('Perfil atualizado com sucesso!');
        }
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Erro ao atualizar perfil:', error);
      const errorMessage = error.message.includes('unique')
        ? 'Este e-mail já está em uso por outra conta.'
        : error.message || 'Erro ao atualizar perfil. Tente novamente.';
      
      toast.error(errorMessage);
      return { error };
    } finally {
      setLoading(false);
    }
  };
  
  // Função para atualizar a sessão manualmente
  const refreshSession = useCallback(async (): Promise<void> => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Erro ao obter sessão:', error);
        throw error;
      }
      
      if (session?.user) {
        const userProfile = await fetchUserProfile(session.user.id);
        const role = userProfile?.role || 'client';
        
        // Atualiza o estado com os dados mais recentes
        setSession(session);
        setUser(session.user);
        setProfile(userProfile);
        setUserRole(role);
      } else {
        // Se não houver sessão, limpa o estado
        setSession(null);
        setUser(null);
        setProfile(null);
        setUserRole(null);
      }
    } catch (error) {
      console.error('Erro ao atualizar sessão:', error);
      // Em caso de erro, limpa o estado para garantir consistência
      setSession(null);
      setUser(null);
      setProfile(null);
      setUserRole(null);
      throw error;
    }
  }, [fetchUserProfile]);

  // Valor do contexto
  const value: AuthContextType = {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    userRole: profile?.role || null,
    signIn,
    signInWithGoogle,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};