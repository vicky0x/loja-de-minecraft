import { IOrder } from '@/app/models/Order';

/**
 * Função simples para enviar notificações para o Discord
 * @param webhookUrl URL do webhook do Discord
 * @param order Objeto do pedido
 * @returns Promise com o resultado da operação
 */
export async function sendDiscordNotification(order: any, webhookUrl?: string): Promise<Response> {
  try {
    // Usar a URL fornecida ou a URL padrão
    const discordUrl = webhookUrl || process.env.DISCORD_WEBHOOK_URL || 
    'https://discord.com/api/webhooks/1360391641495507075/Y0Y70fh0h9_gM4_BFiDuzTh5BY00OprftDcTxS3IzKz9Wg83Dzzv7G7W7Lk3S53ai8YX';
    
    // Preparar dados seguros
    const orderId = order?._id?.toString() || 'ID Desconhecido';
    const userId = order?.userId?.toString() || (order?.user?._id?.toString()) || 'Desconhecido';
    const totalValue = Number(order?.total || order?.totalAmount || 0);
    const totalFormatted = new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(totalValue);
    
    // Converter data segura
    let createdAt = new Date().toLocaleString('pt-BR');
    if (order?.createdAt) {
      try {
        createdAt = new Date(order.createdAt).toLocaleString('pt-BR');
      } catch (e) {
        console.error('Erro ao formatar data:', e);
      }
    }
    
    // Obter itens de forma segura
    const orderItems = Array.isArray(order?.items) ? order.items 
                     : Array.isArray(order?.orderItems) ? order.orderItems 
                     : [];
    
    // Formatar itens
    let itemsText = 'Nenhum item encontrado';
    if (orderItems.length > 0) {
      const productList = orderItems.map((item: any) => {
        const name = item?.name || (typeof item?.product === 'object' ? item.product?.name : String(item?.product || '')) || 'Item sem nome';
        const qty = Number(item?.quantity || 1);
        
        return `${name} (${qty}x)`;
      }).join('\n');
      
      itemsText = "```" + productList + "```";
    }
    
    // Obter método de pagamento
    const paymentMethod = order?.paymentMethod || order?.paymentInfo?.method || 'Desconhecido';
    
    // Obter email
    const buyerEmail = order?.user?.email || order?.customerData?.email || '';
    
    // Criar embed
    const embed = {
      color: 0x4752C4,
      author: { name: "✅ Nova venda realizada" },
      description: "A sua loja está indo muito bem, você acabou de receber uma nova compra feita em seu site.",
      fields: [
        {
          name: "📋 ID do Pedido",
          value: "```" + orderId + "```",
          inline: false
        },
        {
          name: "👤 ID do Cliente",
          value: "```" + userId + "```",
          inline: true
        },
        {
          name: "🔢 Quantidade de Itens",
          value: "```" + orderItems.length.toString() + "```",
          inline: true
        },
        {
          name: "💰 Valor Total",
          value: "```" + totalFormatted + "```",
          inline: true
        },
        {
          name: "📦 Produto(s):",
          value: itemsText
        },
        {
          name: "📅 Criado há:",
          value: "```" + createdAt + "```"
        },
        {
          name: "💳 Método de pagamento:",
          value: "```" + formatPaymentMethod(paymentMethod) + "```"
        }
      ]
    };
    
    // Adicionar email se disponível
    if (buyerEmail) {
      embed.fields.push({
        name: "📧 E-mail do comprador:",
        value: "```" + buyerEmail + "```"
      });
    }
    
    // Montar payload
    const payload = {
      username: "Sistema de Vendas",
      avatar_url: "https://i.imgur.com/NJZpV98.png",
      embeds: [embed]
    };
    
    // Enviar notificação
    const response = await fetch(discordUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      throw new Error(`Erro ao enviar notificação: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    console.error('Erro ao enviar notificação para o Discord:', error);
    throw error;
  }
}

/**
 * Formata o método de pagamento para exibição
 */
function formatPaymentMethod(method: string): string {
  if (!method) return 'Desconhecido';
  
  const methods: Record<string, string> = {
    'pix': 'Pix',
    'PIX': 'Pix',
    'credit_card': 'Cartão de Crédito',
    'card': 'Cartão',
    'other': 'Outro'
  };

  try {
    const lowerMethod = method.toLowerCase();
    const formatted = methods[lowerMethod] || method;
    
    // Adicionar o nome do processador, se for PIX
    if (formatted.toLowerCase() === 'pix') {
      return 'Pix (Mercado Pago)';
    }
    
    return formatted;
  } catch (error) {
    return method || 'Desconhecido';
  }
} 