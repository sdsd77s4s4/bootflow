import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Image, File, X, Loader2, MessageSquare, Check } from 'lucide-react';
import { toast } from 'sonner';
import { sendMessage, sendTemplateMessage } from '@/services/apiBrasilService';
import { getErrorMessage } from '@/lib/supabaseClient.agent';

interface Template {
  id: string;
  name: string;
  description: string;
  parameters: string[];
  content: string;
}

interface SendWhatsAppMessageProps {
  token: string;
  profileId: string;
  defaultPhoneNumber?: string;
  defaultMessage?: string;
  onSendSuccess?: (data: Record<string, unknown>) => void;
  className?: string;
  showHeader?: boolean;
  showTemplates?: boolean;
  compact?: boolean;
}

const TEMPLATES = [
  {
    id: 'boas_vindas',
    name: 'Boas-vindas',
    description: 'Mensagem de boas-vindas para novos clientes',
    parameters: ['nome', 'empresa'],
    content: 'Olá {{nome}}, seja bem-vindo(a) à {{empresa}}! Como podemos ajudar você hoje?'
  },
  {
    id: 'confirmacao_agendamento',
    name: 'Confirmação de Agendamento',
    description: 'Confirmação de agendamento de serviço',
    parameters: ['nome', 'servico', 'data', 'hora'],
    content: 'Olá {{nome}}, seu agendamento para {{servico}} foi confirmado para {{data}} às {{hora}}.'
  },
  {
    id: 'lembrete_pagamento',
    name: 'Lembrete de Pagamento',
    description: 'Lembrete de pagamento pendente',
    parameters: ['nome', 'valor', 'data_vencimento'],
    content: 'Olá {{nome}}, seu pagamento de R$ {{valor}} vence em {{data_vencimento}}.'
  },
  {
    id: 'promocao_especial',
    name: 'Promoção Especial',
    description: 'Divulgação de promoção',
    parameters: ['nome', 'produto', 'desconto', 'validade'],
    content: '{{nome}}, temos uma oferta especial para você! {{produto}} com {{desconto}}% de desconto até {{validade}}.'
  },
  {
    id: 'pesquisa_satisfacao',
    name: 'Pesquisa de Satisfação',
    description: 'Solicitação de feedback',
    parameters: ['nome', 'servico'],
    content: 'Olá {{nome}}, como foi sua experiência com o serviço de {{servico}}? Responda de 1 a 5, sendo 1 para péssimo e 5 para excelente.'
  }
];

export function SendWhatsAppMessage({
  token,
  profileId,
  defaultPhoneNumber = '',
  defaultMessage = '',
  onSendSuccess,
  className = '',
  showHeader = true,
  showTemplates = true,
  compact = false
}: SendWhatsAppMessageProps) {
  const [phoneNumber, setPhoneNumber] = useState(defaultPhoneNumber);
  const [message, setMessage] = useState(defaultMessage);
  const [isSending, setIsSending] = useState(false);
  const [isGroup, setIsGroup] = useState(false);
  const [showTemplateOptions, setShowTemplateOptions] = useState(false);
  const [templateParams, setTemplateParams] = useState<Record<string, string>>({});
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [characterCount, setCharacterCount] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Atualizar contagem de caracteres
  useEffect(() => {
    setCharacterCount(message.length);
  }, [message]);

  // Limpar mensagem quando o número mudar
  useEffect(() => {
    setMessage('');
    setSelectedTemplate(null);
    setTemplateParams({});
  }, [phoneNumber]);

  // Enviar mensagem
  const handleSendMessage = async () => {
    if (!phoneNumber || !message.trim()) {
      toast.error('Preencha o número e a mensagem');
      return;
    }

    setIsSending(true);
    
    try {
      const { success, data, error } = await sendMessage(
        token,
        profileId,
        phoneNumber,
        message,
        isGroup
      );

      if (success) {
        toast.success('Mensagem enviada com sucesso!');
        setMessage('');
        setSelectedTemplate(null);
        setTemplateParams({});
        
        if (onSendSuccess) {
          onSendSuccess(data);
        }
      } else {
        throw new Error(error || 'Erro ao enviar mensagem');
      }
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      console.error('Erro ao enviar mensagem:', errMsg);
      toast.error(`Erro: ${errMsg || 'Falha ao enviar mensagem'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Aplicar template
  const handleApplyTemplate = (template: Template) => {
    setSelectedTemplate(template);
    setMessage(template.content);
    setShowTemplateOptions(false);
    
    // Inicializar parâmetros do template
    const params: Record<string, string> = {};
    template.parameters.forEach((param: string) => {
      params[param] = '';
    });
    setTemplateParams(params);
  };

  // Atualizar parâmetro do template
  const handleTemplateParamChange = (param: string, value: string) => {
    setTemplateParams(prev => ({
      ...prev,
      [param]: value
    }));

    // Atualizar mensagem com os parâmetros
    if (selectedTemplate) {
      let newMessage = selectedTemplate.content;
      Object.entries({ ...templateParams, [param]: value }).forEach(([key, val]) => {
        newMessage = newMessage.replace(new RegExp(`\\{\\{${key}\\??\\}\\}`, 'g'), val || `{{${key}}}`);
      });
      setMessage(newMessage);
    }
  };

  // Enviar template
  const handleSendTemplate = async () => {
    if (!selectedTemplate || !phoneNumber) return;

    setIsSending(true);
    
    try {
      const params = Object.values(templateParams);
      const { success, data, error } = await sendTemplateMessage(
        token,
        profileId,
        phoneNumber,
        selectedTemplate.id,
        params,
        isGroup
      );

      if (success) {
        toast.success('Template enviado com sucesso!');
        setMessage('');
        setSelectedTemplate(null);
        setTemplateParams({});
        
        if (onSendSuccess) {
          onSendSuccess(data);
        }
      } else {
        throw new Error(error || 'Erro ao enviar template');
      }
    } catch (error: unknown) {
      const errMsg = getErrorMessage(error);
      console.error('Erro ao enviar template:', errMsg);
      toast.error(`Erro: ${errMsg || 'Falha ao enviar template'}`);
    } finally {
      setIsSending(false);
    }
  };

  // Lidar com envio de arquivo
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Aqui você pode implementar o upload do arquivo
    // e adicionar o link à mensagem
    toast.info('Envio de arquivos será implementado em breve');
    
    // Limpar o input de arquivo
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Verificar se há parâmetros para preencher
  const hasTemplateParams = selectedTemplate?.parameters?.length > 0;

  return (
    <div className={`bg-[#1e293b] rounded-lg overflow-hidden ${className}`}>
      {showHeader && (
        <div className="bg-[#1e293b] border-b border-gray-700 p-4">
          <h3 className="text-white font-medium flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-400" />
            Enviar Mensagem
          </h3>
        </div>
      )}
      
      <div className="p-4">
        {/* Campo de número de telefone */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-1">
            Número de telefone
          </label>
          <div className="flex">
            <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-600 bg-gray-700 text-gray-300 text-sm">
              +55
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
              placeholder="11999999999"
              className="flex-1 min-w-0 block w-full px-3 py-2 rounded-r-md bg-gray-800 border border-gray-600 text-white placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500"
              disabled={isSending}
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">
            Digite o número com DDD (apenas números)
          </p>
        </div>

        {/* Opções adicionais */}
        <div className="flex items-center justify-between mb-4 text-sm">
          <label className="flex items-center gap-2 text-gray-300 cursor-pointer">
            <input
              type="checkbox"
              checked={isGroup}
              onChange={(e) => setIsGroup(e.target.checked)}
              className="h-4 w-4 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
              disabled={isSending}
            />
            <span>Enviar para grupo</span>
          </label>
          
          {showTemplates && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTemplateOptions(!showTemplateOptions)}
                className="text-blue-400 hover:text-blue-300 flex items-center gap-1 text-sm"
                disabled={isSending}
              >
                <Image className="h-4 w-4" />
                <span>Modelos</span>
              </button>
              
              {showTemplateOptions && (
                <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-700 rounded-md shadow-lg z-10">
                  <div className="p-2 border-b border-gray-700">
                    <h4 className="text-sm font-medium text-white px-2 py-1">Modelos de Mensagem</h4>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {TEMPLATES.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleApplyTemplate(template)}
                        className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-700"
                      >
                        <div className="font-medium">{template.name}</div>
                        <div className="text-xs text-gray-400 truncate">{template.description}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Parâmetros do template */}
        {hasTemplateParams && (
          <div className="mb-4 p-3 bg-gray-800/50 rounded-md border border-gray-700">
            <h4 className="text-sm font-medium text-gray-300 mb-2">
              Preencha os parâmetros
            </h4>
            <div className="space-y-2">
              {selectedTemplate.parameters.map((param: string) => (
                <div key={param} className="grid grid-cols-3 gap-2 items-center">
                  <label className="text-sm text-gray-400">{param}:</label>
                  <input
                    type="text"
                    value={templateParams[param] || ''}
                    onChange={(e) => handleTemplateParamChange(param, e.target.value)}
                    className="col-span-2 px-2 py-1 text-sm bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder={`{{${param}}}`}
                    disabled={isSending}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Área de mensagem */}
        <div className="mb-3">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            rows={compact ? 3 : 5}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isSending}
          />
          <div className="flex justify-between items-center mt-1">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700"
                disabled={isSending}
                title="Anexar arquivo"
              >
                <Paperclip className="h-4 w-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                title="Selecionar arquivo para anexar"
              />
              <button
                type="button"
                className="text-gray-400 hover:text-gray-200 p-1 rounded-full hover:bg-gray-700"
                disabled={isSending}
                title="Adicionar emoji"
              >
                <Smile className="h-4 w-4" />
              </button>
            </div>
            <span className={`text-xs ${characterCount > 1000 ? 'text-red-400' : 'text-gray-400'}`}>
              {characterCount}/1000
            </span>
          </div>
        </div>

        {/* Botão de envio */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={selectedTemplate ? handleSendTemplate : handleSendMessage}
            disabled={isSending || !phoneNumber || !message.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                {selectedTemplate ? 'Enviar Template' : 'Enviar Mensagem'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
