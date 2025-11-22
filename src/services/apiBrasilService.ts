import { toast } from 'sonner';
import { getErrorMessage } from '@/lib/supabaseClient.agent';
import { 
  shouldUseMock, 
  mockCheckConnectionStatus, 
  mockGenerateQRCode, 
  mockSendMessage, 
  mockConnectWhatsApp, 
  mockDisconnectWhatsApp, 
  mockSendTemplate,
  showMockModeWarning,
  MOCK_CREDENTIALS
} from './apiBrasilMockService';

// Exportar credenciais de teste para uso externo
export { MOCK_CREDENTIALS };

// URL base da API Brasil - Pode ser configurada via variável de ambiente
const API_BRASIL_BASE_URL = (typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_API_BRASIL_URL : null) || 'https://gateway.apibrasil.io/api/v2/whatsapp';

// Interface para respostas da API
interface ApiBrasilResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  statusCode?: number;
}

// Interface para a resposta do QR Code
export interface QRCodeResponse {
  qrCode: string;
  timeout: number;
  message?: string;
  expiresIn?: number;
}

// Interface para o status de conexão
export interface ConnectionStatusResponse {
  connected: boolean;
  status?: string;
  phoneNumber?: string;
  profileName?: string;
  lastSeen?: string;
}

// Função auxiliar para tratamento de erros HTTP
async function handleApiResponse<T>(response: Response): Promise<ApiBrasilResponse<T>> {
  const data = await response.json().catch(() => ({}));
  
  if (!response.ok) {
    console.error('Erro na resposta da API:', {
      status: response.status,
      statusText: response.statusText,
      url: response.url,
      data
    });
    
    const errorMessage = data?.message || data?.error?.message || 
                        `Erro HTTP ${response.status}: ${response.statusText}`;
    
    return {
      success: false,
      error: errorMessage,
      message: errorMessage,
      statusCode: response.status
    };
  }
  
  return { success: true, data };
}

/**
 * Envia uma mensagem via WhatsApp usando a API Brasil
 */
export async function sendMessage(
  token: string,
  profileId: string,
  phoneNumber: string,
  message: string,
  isGroup: boolean = false
): Promise<ApiBrasilResponse> {
  // Verifica se deve usar mock
  if (shouldUseMock()) {
    showMockModeWarning();
    return mockSendMessage(token, profileId, phoneNumber, message);
  }

  try {
    console.log('Enviando mensagem via WhatsApp...', { profileId, phoneNumber, isGroup });
    
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    const response = await fetch(`${API_BRASIL_BASE_URL}/send-message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        phoneNumber: cleanedPhone,
        message,
        isGroup
      })
    });

    const result = await handleApiResponse(response);
    
    if (result.success) {
      console.log('Mensagem enviada com sucesso:', result.data);
      return { success: true, data: result.data };
    } else {
      console.error('Falha ao enviar mensagem:', result.error);
      return result;
    }
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Erro ao enviar mensagem:', errMsg);
    return { 
      success: false, 
      error: errMsg || 'Erro ao enviar mensagem',
      message: errMsg
    };
  }
}

/**
 * Gera um novo QR Code para autenticação
 */
export async function generateQRCode(
  token: string = '',
  devicePassword: string = 'ciflnb6w',
  deviceToken: string = 'b87d9e20-6fbd-4eea-95a4-d6d1f9cbbfe1',
  authorization: string = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJodHRwczovL2dhdGV3YXkuYXBpYnJhc2lsLmlvL2FwaS92Mi9hdXRoL3JlZ2lzdGVyIiwiaWF0IjoxNzQ5MDg2MTQzLCJleHAiOjE3ODA2MjIxNDMsIm5iZiI6MTc0OTA4NjE0MywianRpIjoiclVXZjdDNkxKUmZPV25ldCIsInN1YiI6IjE1NTU2IiwicHJ2IjoiMjNiZDVjODk0OWY2MDBhZGIzOWU3MDFjNDAwODcyZGI3YTU5NzZmNyJ9.0Uj5y56Yr2Cnauz4QDnXoGACZx13aON6pEDIjGV1Jp4'
): Promise<ApiBrasilResponse<QRCodeResponse>> {
  // Verifica se deve usar mock
  if (shouldUseMock()) {
    showMockModeWarning();
    return mockGenerateQRCode();
  }
  try {
    console.log('Gerando QR Code...');
    
    const response = await fetch(`${API_BRASIL_BASE_URL}/qrcode`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DeviceToken': deviceToken,
        'Authorization': authorization,
      },
      body: JSON.stringify({
        device_password: devicePassword
      }),
    });

    const result = await handleApiResponse<QRCodeResponse>(response);
    
    // If the response contains a qrcode property, map it to qrCode for consistency
    if (result.data && 'qrcode' in result.data) {
      // Create a new object to avoid mutating the original
      result.data = {
        ...result.data,
        qrCode: (result.data as { qrcode?: string }).qrcode,
      } as unknown as QRCodeResponse;
      // delete the original qrcode property safely
      const _tmp = result.data as unknown as Record<string, unknown>;
      delete _tmp.qrcode;
    }
    
    if (result.success) {
      console.log('QR Code gerado com sucesso');
      return result;
    } else {
      console.error('Falha ao gerar QR Code:', result.error);
      toast.error(result.error || 'Falha ao gerar QR Code');
      return result;
    }
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Erro ao gerar QR Code:', errMsg);

    // Tratamento específico para erros de rede
    if (errMsg.includes('Failed to fetch') || errMsg.includes('TypeError')) {
      const errorMsg = 'Falha na conexão com o servidor. Verifique sua conexão com a internet.';
      toast.error(errorMsg);
      return { 
        success: false, 
        error: errorMsg,
        message: 'Erro de rede ao tentar gerar QR Code'
      };
    }

    toast.error(errMsg);
    return { 
      success: false, 
      error: errMsg,
      message: errMsg
    };
  }
}

/**
 * Verifica o status da conexão com o WhatsApp
 */
export async function checkConnectionStatus(
  token: string,
  profileId: string
): Promise<ApiBrasilResponse<{ connected: boolean; status?: string }>> {
  // Verifica se deve usar mock
  if (shouldUseMock()) {
    showMockModeWarning();
    return mockCheckConnectionStatus(token, profileId);
  }

  try {
    const response = await fetch(`${API_BRASIL_BASE_URL}/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'profile-id': profileId,
        'Accept': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return { 
      success: true, 
      data: { 
        connected: data.connected || false,
        status: data.status || 'disconnected'
      } 
    };
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Erro ao verificar status da conexão:', errMsg);
    return { 
      success: false, 
      error: errMsg || 'Erro ao verificar status da conexão',
      message: errMsg
    };
  }
}

/**
 * Desconecta o WhatsApp
 */
export async function disconnectWhatsApp(
  token: string,
  profileId: string
): Promise<ApiBrasilResponse> {
  // Verifica se deve usar mock
  if (shouldUseMock()) {
    showMockModeWarning();
    return mockDisconnectWhatsApp(token, profileId);
  }

  try {
    const response = await fetch(`${API_BRASIL_BASE_URL}/disconnect`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({ profileId })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Erro ao desconectar WhatsApp:', errMsg);
    return { 
      success: false, 
      error: errMsg || 'Erro ao desconectar WhatsApp',
      message: errMsg
    };
  }
}

/**
 * Envia um template de mensagem
 */
export async function sendTemplateMessage(
  token: string,
  profileId: string,
  phoneNumber: string,
  templateName: string,
  templateParams: string[] = [],
  isGroup: boolean = false
): Promise<ApiBrasilResponse> {
  // Verifica se deve usar mock
  if (shouldUseMock()) {
    showMockModeWarning();
    return mockSendTemplate(token, profileId, phoneNumber, templateName, templateParams);
  }

  try {
    const cleanedPhone = phoneNumber.replace(/\D/g, '');
    
    const response = await fetch(`${API_BRASIL_BASE_URL}/send-template`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify({
        profileId,
        phoneNumber: cleanedPhone,
        template: {
          name: templateName,
          parameters: templateParams
        },
        isGroup
      })
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data?.message || data?.error?.message || `Erro HTTP ${response.status}`;
      throw new Error(errorMessage);
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errMsg = getErrorMessage(error);
    console.error('Erro ao enviar template:', errMsg);
    return { 
      success: false, 
      error: errMsg || 'Erro ao enviar template',
      message: errMsg
    };
  }
}
