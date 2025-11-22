import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2, Mail, Lock, Eye, EyeOff, ArrowLeft, User, Bot, AlertTriangle, Phone, Check } from "lucide-react";
import { motion } from "framer-motion";
import { getErrorMessage } from '@/lib/supabaseClient.agent';

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (password !== confirmPassword) {
      setError("As senhas não conferem");
      return;
    }

    setLoading(true);

    try {
      const { error } = await signUp(email, password, { 
        full_name: name,
        role: 'client' // Defina o papel padrão como 'client'
      });
      
      if (error) throw error;
      
      // Enviar dados para email e WhatsApp após cadastro bem-sucedido
      try {
        // Preparar dados do cadastro
        const signupData = {
          to: 'suporte@bootflow.com.br',
          subject: 'Novo Cadastro - BootFlow',
          body: `Novo cadastro realizado:\n\n` +
                `Nome: ${name}\n` +
                `Email: ${email}\n` +
                `WhatsApp: ${whatsapp || 'Não informado'}\n\n` +
                `Data: ${new Date().toLocaleString('pt-BR')}`,
          name: name,
          email: email,
          whatsapp: whatsapp || 'Não informado'
        };

        // Enviar para email via API ou Formspree
        let emailSent = false;
        const apiUrl = import.meta.env.VITE_EMAIL_API_URL;
        
        if (apiUrl && apiUrl.trim() !== '') {
          try {
            const response = await fetch(apiUrl, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(signupData),
            });

            if (response.ok) {
              emailSent = true;
            }
          } catch (apiError) {
            console.log('API não disponível, tentando Formspree...', apiError);
          }
        }

        if (!emailSent) {
          const formspreeId = import.meta.env.VITE_FORMSPREE_ID;
          
          if (formspreeId && formspreeId.trim() !== '' && formspreeId !== 'YOUR_FORM_ID') {
            try {
              const formspreeUrl = `https://formspree.io/f/${formspreeId}`;
              
              const response = await fetch(formspreeUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Accept': 'application/json',
                },
                body: JSON.stringify({
                  _subject: signupData.subject,
                  name: signupData.name,
                  email: signupData.email,
                  whatsapp: signupData.whatsapp,
                  message: signupData.body,
                }),
              });

              if (response.ok) {
                emailSent = true;
              }
            } catch (formspreeError) {
              console.error('Erro ao enviar via Formspree:', formspreeError);
            }
          }
        }

        // Se nenhum método funcionou, usar mailto como fallback
        if (!emailSent) {
          const emailSubject = encodeURIComponent(signupData.subject);
          const emailBody = encodeURIComponent(signupData.body);
          window.location.href = `mailto:${signupData.to}?subject=${emailSubject}&body=${emailBody}`;
        }

        // Enviar para WhatsApp
        const whatsappMessage = encodeURIComponent(
          `🎉 *Novo Cadastro - BootFlow*\n\n` +
          `👤 *Nome:* ${name}\n` +
          `📧 *Email:* ${email}\n` +
          `📱 *WhatsApp:* ${whatsapp || 'Não informado'}\n\n` +
          `📅 *Data:* ${new Date().toLocaleString('pt-BR')}`
        );
        
        const phoneNumber = "5527999587725";
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const isMac = /Macintosh|MacIntel|MacPPC|Mac68K/i.test(navigator.userAgent);
        const isWindows = /Windows|Win32|Win64/i.test(navigator.userAgent);
        const isLinux = /Linux/i.test(navigator.userAgent);
        const isDesktop = isMac || isWindows || isLinux;
        
        if (isMobile) {
          const appUrl = `whatsapp://send?phone=${phoneNumber}&text=${whatsappMessage}`;
          window.location.href = appUrl;
          setTimeout(() => {
            window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, "_blank", "noopener,noreferrer");
          }, 1000);
        } else if (isDesktop) {
          const desktopAppUrl = `whatsapp://send?phone=${phoneNumber}&text=${whatsappMessage}`;
          const webUrl = `https://web.whatsapp.com/send?phone=${phoneNumber}&text=${whatsappMessage}`;
          const tryDesktopApp = () => {
            window.location.href = desktopAppUrl;
            setTimeout(() => {
              if (document.hasFocus()) {
                window.open(webUrl, "_blank", "noopener,noreferrer");
              }
            }, 500);
          };
          tryDesktopApp();
        } else {
          window.open(`https://wa.me/${phoneNumber}?text=${whatsappMessage}`, "_blank", "noopener,noreferrer");
        }
      } catch (notificationError) {
        console.error('Erro ao enviar notificações:', notificationError);
        // Não bloqueia o cadastro se houver erro no envio de notificações
      }
      
      // Mostrar mensagem de sucesso antes de redirecionar
      alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar sua conta e faça login para acessar seu dashboard.");
      
      // Redireciona para o login após o cadastro bem-sucedido
      // O usuário precisa confirmar o email antes de fazer login
      navigate("/login");
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      setError(errMsg || "Erro ao criar conta. Tente novamente.");
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
          className="max-w-md w-full space-y-6"
        >
          <div className="text-center space-y-4 mb-8">
            <div className="mx-auto w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center mb-6 shadow-lg">
              <Bot className="w-12 h-12 text-white" />
            </div>
            <h2 className="text-3xl font-bold tracking-tight">Junte-se a nós!</h2>
            <p className="text-muted-foreground">
              Crie sua conta e comece a transformar seu negócio com nossas soluções.
            </p>
          </div>

          {/* Plano Gratuito */}
          <div className="bg-background/80 backdrop-blur-sm rounded-lg border border-border/20 p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Plano Essencial</h3>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary">R$ 0</div>
                <div className="text-sm text-muted-foreground">/mês</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Para quem está começando e quer organizar o jogo
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">5 clientes</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Gestor Bot</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Link WhatsApp</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">WhatsAPI própria (envios ilimitados)</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Campanhas WhatsApp</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Envio de e-mail</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Emite cobranças</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Link de pagamento</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Financeiro completo</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">Integração Mercado Pago</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-sm">E muito mais...</span>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border/20">
              <p className="text-xs text-muted-foreground italic">
                "Entrada perfeita para testar e já faturar. Zero desculpa."
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Right Side - Signup Form */}
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
            <h1 className="text-3xl font-bold mb-2">Criar conta</h1>
            <p className="text-muted-foreground">
              Preencha os dados abaixo para se cadastrar
            </p>
          </div>

          <Card className="border-none shadow-none">
            <form onSubmit={handleSubmit}>
              <CardContent className="p-0 space-y-6">
                {error && (
                  <div className="bg-destructive/10 text-destructive p-3 rounded-md text-sm flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">Nome completo</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

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
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp" className="text-sm font-medium">WhatsApp</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="whatsapp"
                      type="tel"
                      placeholder="(27) 99999-9999"
                      value={whatsapp}
                      onChange={(e) => {
                        let value = e.target.value.replace(/\D/g, '');
                        if (value.length <= 11) {
                          if (value.length > 0) {
                            if (value.length <= 2) {
                              value = `(${value}`;
                            } else if (value.length <= 7) {
                              value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                            } else {
                              value = `(${value.slice(0, 2)}) ${value.slice(2, 7)}-${value.slice(7)}`;
                            }
                          }
                          setWhatsapp(value);
                        }
                      }}
                      className="pl-10"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Opcional, mas recomendado para melhor atendimento</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">Senha</Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10"
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-sm font-medium">
                    Confirmar senha
                  </Label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                      minLength={6}
                    />
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full mt-2 h-11 text-base font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando conta...
                    </>
                  ) : (
                    "Criar minha conta"
                  )}
                </Button>

                <p className="text-sm text-center text-muted-foreground">
                  Já tem uma conta?{" "}
                  <Link 
                    to="/login" 
                    className="font-medium text-primary hover:underline"
                  >
                    Fazer login
                  </Link>
                </p>
              </CardContent>
            </form>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
