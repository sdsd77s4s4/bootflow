import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, ArrowLeft, Bot, AlertTriangle, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getErrorMessage } from '@/lib/supabaseClient.agent';

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Verificar se o AuthProvider está disponível
  let authContext;
  try {
    authContext = useAuth();
  } catch (err) {
    console.error('AuthContext não disponível:', err);
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold mb-4">Erro de Configuração</h1>
          <p className="text-muted-foreground mb-4">O sistema de autenticação não está disponível.</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }
  
  const { resetPassword } = authContext;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    setLoading(true);

    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      
      setSuccess(true);
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      let errorMessage = errMsg || "Erro ao enviar e-mail de redefinição. Tente novamente.";

      if (errMsg.includes('Failed to fetch') ||
          errMsg.includes('ERR_NAME_NOT_RESOLVED') ||
          errMsg.includes('NetworkError')) {
        errorMessage = "Erro de conexão: Não foi possível conectar ao servidor. Verifique sua conexão com a internet.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-background to-muted/20">
      {/* Left Side - Illustration */}
      <div className="hidden md:flex flex-1 items-center justify-center p-12 bg-gradient-to-br from-primary/10 to-primary/5">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md text-center space-y-6"
        >
          <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 shadow-lg">
            <Bot className="w-12 h-12 text-white" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">Esqueceu sua senha?</h2>
          <p className="text-muted-foreground">
            Não se preocupe! Enviaremos um link para redefinir sua senha no e-mail cadastrado.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Forgot Password Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 lg:p-24">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="w-full max-w-md"
        >
          <div className="mb-8">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(-1)}
              className="mb-6 -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
            <h1 className="text-3xl font-bold mb-2">Recuperar senha</h1>
            <p className="text-muted-foreground">
              Digite seu e-mail e enviaremos um link para redefinir sua senha
            </p>
          </div>

          <Card className="border-none shadow-none">
            {success ? (
              <CardContent className="p-0 space-y-6">
                <div className="bg-green-500/10 text-green-600 dark:text-green-400 p-4 rounded-md text-sm">
                  <div className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium mb-1">E-mail enviado com sucesso!</p>
                      <p className="text-xs">
                        Verifique sua caixa de entrada e a pasta de spam. O link de redefinição de senha expira em 1 hora.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground text-center">
                    Não recebeu o e-mail? Verifique se digitou o endereço correto ou tente novamente.
                  </p>
                  
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => {
                      setSuccess(false);
                      setEmail("");
                    }}
                  >
                    Enviar novamente
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full"
                    onClick={() => navigate('/login')}
                  >
                    Voltar para o login
                  </Button>
                </div>
              </CardContent>
            ) : (
              <form onSubmit={handleSubmit}>
                <CardContent className="p-0 space-y-6">
                  {error && (
                    <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm">
                      <div className="flex items-start">
                        <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium mb-1">Erro ao enviar e-mail</p>
                          <p className="text-xs whitespace-pre-line">{error}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">E-mail</Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        placeholder="seu@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        required
                        autoFocus
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Enviaremos um link de redefinição de senha para este e-mail
                    </p>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full mt-2 h-11 text-base font-medium"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : (
                      "Enviar link de redefinição"
                    )}
                  </Button>

                  <p className="text-sm text-center text-muted-foreground">
                    Lembrou sua senha?{" "}
                    <Link 
                      to="/login" 
                      className="font-medium text-primary hover:underline"
                    >
                      Fazer login
                    </Link>
                  </p>
                </CardContent>
              </form>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

