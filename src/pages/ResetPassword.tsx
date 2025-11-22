import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/supabaseClient.agent';

const ResetPassword: React.FC = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const params = new URLSearchParams(hash.substring(1)); // Remove o #
      const token = params.get('access_token');
      const type = params.get('type');

      if (token && type === 'recovery') {
        setAccessToken(token);
      } else {
        setError('Parâmetros de redefinição inválidos ou não encontrados na URL.');
        toast.error('O link de redefinição parece estar incorreto. Por favor, tente novamente.');
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validações
    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      setError(
        'A senha deve conter pelo menos 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.'
      );
      return;
    }

    try {
      setLoading(true);
      
      if (accessToken) {
        console.log('Token de acesso recebido, tentando redefinir senha...');
        
        // Primeiro, atualiza a sessão com o token de acesso
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: accessToken, // Usando o mesmo token como refresh_token temporário
        });

        if (sessionError) {
          console.error('Erro ao configurar sessão:', sessionError);
          throw sessionError;
        }

        // Agora atualiza a senha do usuário autenticado
        const { data: userData, error: updateError } = await supabase.auth.updateUser({
          password: password,
        });

        if (updateError) {
          console.error('Erro ao atualizar senha:', updateError);
          throw updateError;
        }

        console.log('Senha redefinida com sucesso para o usuário:', userData?.user?.email);
        
        // Desloga o usuário após a redefinição de senha
        await supabase.auth.signOut();
        setSuccess(true);
        toast.success('Senha redefinida com sucesso! Faça login com sua nova senha.');
        
        // Redireciona para a página de login após 3 segundos
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        console.error('Token de acesso não encontrado ou inválido.');
        throw new Error('Link de redefinição inválido ou expirado.');
      }
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      console.error('Erro ao redefinir senha:', errMsg);
      setError(errMsg || 'Erro ao redefinir senha. Tente novamente mais tarde.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Senha Redefinida!</h2>
          <p className="text-gray-600 mb-6">Sua senha foi redefinida com sucesso. Você será redirecionado para a página de login em instantes...</p>
          <Button onClick={() => navigate('/login')}>
            Ir para o Login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 to-purple-900">
      <form
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md space-y-6"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">Redefinir Senha</h2>
        
        {error && <div className="bg-red-100 text-red-700 rounded px-3 py-2 text-sm">{error}</div>}
        
        <div>
          <label className="block text-gray-700 mb-1">Nova Senha</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Mínimo de 8 caracteres, incluindo letras maiúsculas, minúsculas, números e caracteres especiais.
          </p>
        </div>
        
        <div>
          <label className="block text-gray-700 mb-1">Confirmar Nova Senha</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? 'Redefinindo...' : 'Redefinir Senha'}
        </Button>
        
        <div className="text-sm text-center text-gray-500">
          Lembrou da senha?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Fazer Login
          </a>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;
