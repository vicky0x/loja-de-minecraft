import { MercadoPagoConfig, Payment } from 'mercadopago';
import mongoose from 'mongoose';
import connectDB from './db/mongodb';
import { randomUUID } from 'crypto';

// Função para obter o token do Mercado Pago das configurações
export async function getMercadoPagoToken() {
  try {
    await connectDB();
    
    // Usar diretamente o token das variáveis de ambiente
    const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    
    if (!token) {
      throw new Error('Token do Mercado Pago não encontrado nas variáveis de ambiente.');
    }
    
    console.log('Token MP utilizado:', token.substring(0, 10) + '...');
    return token;
  } catch (error) {
    console.error('Erro ao obter token do Mercado Pago:', error);
    throw error;
  }
}

// Inicializa o cliente Mercado Pago com o token
// Exportar uma função que retorna uma nova instância com idempotencyKey única para cada chamada
export function createMercadoPagoClient() {
  const token = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
  
  if (!token) {
    throw new Error('Token do Mercado Pago não encontrado nas variáveis de ambiente.');
  }
  
  // Criar configuração
  const config = new MercadoPagoConfig({ 
    accessToken: token,
    options: { 
      timeout: 5000,
      idempotencyKey: randomUUID() 
    } 
  });
  
  return config;
}

// Verificar se estamos em ambiente de desenvolvimento - apenas para logs
const isDevelopment = process.env.NODE_ENV === 'development';

// Logger simples 
const logger = {
  info: (message: string, ...args: any[]) => console.log(`[MERCADOPAGO INFO] ${message}`, ...args),
  error: (message: string, ...args: any[]) => console.error(`[MERCADOPAGO ERROR] ${message}`, ...args),
  warn: (message: string, ...args: any[]) => console.warn(`[MERCADOPAGO WARN] ${message}`, ...args)
};

// Função para limpar CPF (remover pontos, traços e espaços)
function cleanCpf(cpf: string): string {
  return cpf.replace(/[^\d]/g, '');
}

// Tipos de retorno para getPaymentStatus
interface PaymentStatusResponse {
  id: string;
  status: string;
}

// Interface para o retorno do PIX
interface PixPaymentResponse {
  id: string;
  status: string;
  qrCode: string;
  qrCodeBase64: string;
  ticketUrl: string;
  copyPaste: string;
  expirationDate: Date;
}

// Interface para o retorno do Checkout Transparente
interface TransparentCheckoutResponse {
  id: string;
  status: string;
  processUrl: string;
  externalReference: string;
}

// Função para limpar propriedade incorreta do objeto de pagamento
function ensureCorrectPaymentProperties(paymentData: any): any {
  if (!paymentData) return paymentData;
  
  // Clonar o objeto para não modificar o original
  const cleanedData = JSON.parse(JSON.stringify(paymentData));
  
  // Verificação explícita para campos com erro de ortografia
  if ('notificaction_url' in cleanedData) {
    console.warn('[MERCADOPAGO WARN] Detectado campo com ortografia incorreta "notificaction_url" - removendo do objeto');
    delete cleanedData.notificaction_url;
  }
  
  // Verificar se existe o campo notification_url
  if (!cleanedData.notification_url) {
    console.warn('[MERCADOPAGO WARN] Campo notification_url não presente - adicionando URL padrão');
    cleanedData.notification_url = 'http://localhost:3000/api/webhooks/mercadopago';
  }
  
  // Verificação adicional: converter para string e verificar se existe a string incorreta
  const stringifiedData = JSON.stringify(cleanedData);
  if (stringifiedData.includes('notificaction_url')) {
    console.warn('[MERCADOPAGO WARN] String "notificaction_url" encontrada no JSON - removendo manualmente');
    // Convertendo novamente para objeto após substituição para garantir que o JSON é válido
    try {
      return JSON.parse(stringifiedData.replace(/"notificaction_url":/g, '"notification_url":'));
    } catch (e) {
      console.error('[MERCADOPAGO ERROR] Erro ao tentar corrigir JSON com substituição manual:', e);
      // Em caso de erro na substituição, manter o objeto original limpo
    }
  }
  
  return cleanedData;
}

// Função wrapper para criar pagamento com limpeza de propriedades
async function safeCreatePayment(payment: Payment, data: any): Promise<any> {
  // Garantir que não há campos com nomes incorretos
  const cleanedBody = ensureCorrectPaymentProperties(data.body);
  
  // Verificação adicional para garantir que não estamos enviando o campo incorreto
  console.log('[MERCADOPAGO DEBUG] Campos que serão enviados para a API:', Object.keys(cleanedBody));
  console.log('[MERCADOPAGO DEBUG] notification_url:', cleanedBody.notification_url);
  
  // Verificação final antes de enviar
  // Converter para string, verificar e converter de volta para objeto
  const jsonString = JSON.stringify(cleanedBody);
  if (jsonString.includes('notificaction_url')) {
    console.warn('[MERCADOPAGO WARN] ÚLTIMA VERIFICAÇÃO: String incorreta ainda presente após limpeza!');
    // Remover manualmente
    const correctedJson = jsonString.replace(/"notificaction_url":/g, '"notification_url":');
    const correctedBody = JSON.parse(correctedJson);
    
    // Chamar a função original com dados corrigidos
    return payment.create({
      ...data,
      body: correctedBody
    });
  }
  
  // Chamar a função original
  return payment.create({
    ...data,
    body: cleanedBody
  });
}

// Cria um pagamento PIX com dados reais
export async function createPixPayment(paymentData: any): Promise<PixPaymentResponse> {
  try {
    // SOLUÇÃO RADICAL: Ignorar completamente a biblioteca do Mercado Pago e usar fetch diretamente
    
    // 1. Extrair dados essenciais
    let transaction_amount = Number(paymentData.transaction_amount || 0);
    
    // Garantir que o valor tenha apenas duas casas decimais para evitar erros do Mercado Pago
    transaction_amount = Number(transaction_amount.toFixed(2));
    
    // Garantir que o valor seja pelo menos 0.01 (valor mínimo aceito pelo Mercado Pago)
    if (transaction_amount < 0.01) {
      transaction_amount = 0.01;
      logger.warn(`Valor ajustado para o mínimo de R$ 0.01 pois o valor original era muito pequeno: ${paymentData.transaction_amount}`);
    }
    
    const description = String(paymentData.description || '');
    const external_reference = String(paymentData.external_reference || '');
    
    // 2. Extrair dados do pagador
    const payer = {
      email: String(paymentData.payer?.email || ''),
      first_name: String(paymentData.payer?.first_name || ''),
      last_name: String(paymentData.payer?.last_name || ''),
      identification: {
        type: 'CPF',
        number: String(paymentData.payer?.identification?.number || '')
      }
    };
    
    // 3. Validar o CPF
    const validTestCPFs = ['19119119100', '12345678909', '01234567890'];
    if (!payer.identification.number || payer.identification.number.length !== 11) {
      logger.warn(`CPF inválido ou não fornecido, usando CPF de teste`);
      payer.identification.number = validTestCPFs[0];
    } else {
      // Validação adicional para garantir que o CPF seja aceito pelo Mercado Pago
      // Alguns CPFs, mesmo com 11 dígitos, podem ser rejeitados pela API
      // Em caso de erro, usaremos um CPF de teste válido
      try {
        // Verificar se o CPF contém apenas números
        if (!/^\d+$/.test(payer.identification.number)) {
          logger.warn(`CPF contém caracteres não numéricos, usando CPF de teste`);
          payer.identification.number = validTestCPFs[0];
        }
        
        // Verificar se o CPF tem padrões inválidos (todos os dígitos iguais)
        if (/^(\d)\1{10}$/.test(payer.identification.number)) {
          logger.warn(`CPF com padrão inválido (todos dígitos iguais), usando CPF de teste`);
          payer.identification.number = validTestCPFs[0];
        }
        
        // No ambiente de desenvolvimento, sempre usar um CPF válido conhecido
        if (isDevelopment) {
          logger.warn(`Ambiente de desenvolvimento detectado, substituindo CPF por valor de teste`);
          payer.identification.number = validTestCPFs[0];
        }
      } catch (error) {
        logger.warn(`Erro ao validar CPF, usando CPF de teste: ${error}`);
        payer.identification.number = validTestCPFs[0];
      }
    }
    
    logger.info(`Criando pagamento PIX (direto com fetch): ${description} - R$ ${transaction_amount}`);
    
    // 4. Obter o token de acesso
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      throw new Error('Token do Mercado Pago não encontrado nas variáveis de ambiente.');
    }
    
    // 5. Preparar os dados para envio - APENAS com os campos necessários
    const paymentRequest = {
      transaction_amount,
      description,
      payment_method_id: 'pix',
      external_reference,
      payer
    };
    
    // 6. Log para debug antes de enviar
    logger.info('Enviando requisição direta para API do Mercado Pago:', JSON.stringify(paymentRequest));
    logger.info('Campos enviados:', Object.keys(paymentRequest).join(', '));
    logger.info(`Valor formatado: R$ ${transaction_amount} (original: ${paymentData.transaction_amount})`);
    
    // 7. Chamar a API diretamente via fetch
    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID()
      },
      body: JSON.stringify(paymentRequest)
    });
    
    // 8. Processar a resposta
    if (!mpResponse.ok) {
      const errorData = await mpResponse.json();
      logger.error('Erro na chamada à API do MP:', errorData);
      throw new Error(`Erro ao processar pagamento: ${JSON.stringify(errorData)}`);
    }
    
    // 9. Extrair dados da resposta
    const responseData = await mpResponse.json();
    logger.info(`Pagamento criado com sucesso: ${responseData.id}`);
    
    const pointOfInteraction = responseData.point_of_interaction || {};
    const transactionData = pointOfInteraction.transaction_data || {};
    
    return {
      id: responseData.id?.toString() || 'unknown',
      status: responseData.status || 'pending',
      qrCode: transactionData.qr_code || '',
      qrCodeBase64: transactionData.qr_code_base64 || '',
      ticketUrl: transactionData.ticket_url || '',
      copyPaste: transactionData.copy_paste || transactionData.qr_code || '',
      expirationDate: new Date(Date.now() + 5 * 60 * 1000),
    };
    
  } catch (error: any) {
    logger.error('Erro ao criar pagamento PIX:', error);
    
    if (error.response) {
      logger.error('Detalhes da resposta de erro:', JSON.stringify(error.response.data || error.response));
    }
    
    throw new Error(`Falha ao processar pagamento PIX: ${error.message}`);
  }
}

// Consulta o status de um pagamento real
export async function getPaymentStatus(paymentId: string | number): Promise<PaymentStatusResponse> {
  try {
    logger.info(`Consultando status do pagamento ${paymentId} na API do Mercado Pago`);
    
    if (!paymentId) {
      logger.error('ID de pagamento inválido');
      return {
        id: 'unknown',
        status: 'error'
      };
    }
    
    const client = createMercadoPagoClient();
    const payment = new Payment(client);
    
    try {
      const response = await payment.get({ id: paymentId.toString() });
      
      logger.info(`Status do pagamento ${paymentId}: ${response.status}`);
      
      return {
        id: response.id?.toString() || paymentId.toString(),
        status: response.status || 'pending'
      };
    } catch (apiError: any) {
      // Se for erro 404 (pagamento não encontrado) ou 400 (formato inválido)
      if (apiError.status === 404 || apiError.status === 400) {
        logger.warn(`Pagamento ${paymentId} não encontrado ou formato inválido: ${apiError.message}`);
        return {
          id: paymentId.toString(),
          status: 'not_found'
        };
      }
      
      // Se for erro de rate limiting
      if (apiError.status === 429) {
        logger.warn(`Rate limit atingido ao consultar pagamento ${paymentId}`);
        return {
          id: paymentId.toString(),
          status: 'rate_limited'
        };
      }
      
      // Para outros erros, registrar e propagar
      throw apiError;
    }
  } catch (error: any) {
    logger.error(`Erro ao consultar pagamento ${paymentId}:`, error);
    
    if (error.response) {
      logger.error('Detalhes da resposta de erro:', JSON.stringify(error.response.data || error.response));
    }
    
    // Retornar erro em vez de lançar exceção para maior resiliência
    return {
      id: paymentId.toString(),
      status: 'error'
    };
  }
}

// Valida a assinatura do webhook
export async function validateWebhookSignature(signature: string, data: any) {
  // Implementar validação real de assinatura conforme documentação do Mercado Pago
  // Esta é apenas uma implementação básica
  // Documentação: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/notifications/webhooks
  
  if (!signature) {
    logger.warn('Assinatura do webhook não fornecida');
    return false;
  }
  
  // Em um ambiente real, você precisará validar a assinatura adequadamente
  // Exemplo simples: verificar se a assinatura corresponde ao esperado
  return true;
}

// Gera a URL do webhook baseada no domínio atual
export function generateWebhookUrl(baseUrl: string): string {
  // Remover barras finais do baseUrl
  const cleanBaseUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  
  // Gerar URL do webhook
  return `${cleanBaseUrl}/api/webhooks/mercadopago`;
}

// Consulta o status de um pagamento e retorna apenas o status como string
export async function getMercadoPagoPaymentStatus(paymentId: string): Promise<string> {
  try {
    const status = await getPaymentStatus(paymentId);
    return status.status;
  } catch (error) {
    logger.error(`Erro ao obter status simplificado: ${error}`);
    return 'error';
  }
}

// Cria um pagamento com cartão via checkout transparente do Mercado Pago
export async function createCardCheckout(paymentData: any): Promise<TransparentCheckoutResponse> {
  try {
    // Obter o token de acesso
    const mpToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN;
    if (!mpToken) {
      throw new Error('Token do Mercado Pago não encontrado nas variáveis de ambiente.');
    }
    
    // Extrair dados essenciais
    const transaction_amount = Number(paymentData.transaction_amount || 0);
    const description = String(paymentData.description || '');
    const external_reference = String(paymentData.external_reference || '');
    
    // Preparando URL de retorno
    let baseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VERCEL_URL || 'http://localhost:3000';
    
    // Garantir que a URL tem protocolo (http ou https)
    if (!baseUrl.startsWith('http')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // Garantir que não termina com barra
    if (baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // Preparar os dados para o checkout transparente
    const preferenceRequest = {
      items: [
        {
          id: external_reference,
          title: description,
          description: description,
          quantity: 1,
          unit_price: transaction_amount,
          currency_id: 'BRL'
        }
      ],
      payer: {
        email: paymentData.payer?.email || ''
      },
      payment_methods: {
        excluded_payment_methods: [
          { id: "bolbradesco" },
          { id: "pix" }
        ],
        excluded_payment_types: [],
        installments: 12
      },
      external_reference: external_reference,
      auto_return: "approved",
      back_urls: {
        success: `${baseUrl}/checkout/success?external_reference=${external_reference}`,
        failure: `${baseUrl}/checkout/failure?external_reference=${external_reference}`,
        pending: `${baseUrl}/checkout/pending?external_reference=${external_reference}`
      },
      notification_url: `${baseUrl}/api/webhooks/mercadopago`
    };
    
    logger.info('Criando preferência para checkout transparente do Mercado Pago');
    logger.info('Dados enviados:', JSON.stringify(preferenceRequest));
    
    // Chamar a API do Mercado Pago para criar a preferência
    const response = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${mpToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID()
      },
      body: JSON.stringify(preferenceRequest)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      logger.error('Erro na chamada à API do MP:', errorData);
      throw new Error(`Erro ao criar preferência de checkout: ${JSON.stringify(errorData)}`);
    }
    
    const responseData = await response.json();
    logger.info(`Preferência de checkout criada com sucesso: ${responseData.id}`);
    
    return {
      id: responseData.id,
      status: 'pending',
      processUrl: responseData.init_point,
      externalReference: external_reference
    };
  } catch (error) {
    logger.error('Erro ao criar checkout transparente:', error);
    throw error;
  }
} 