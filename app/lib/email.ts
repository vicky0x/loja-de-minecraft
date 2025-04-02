import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(options: EmailOptions) {
  try {
    // Verificar se as variáveis de ambiente estão configuradas
    const smtpHost = process.env.SMTP_HOST || 'mail.fantasystore.com.br';
    const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
    const smtpUser = process.env.SMTP_USER || 'contato@fantasystore.com.br';
    const smtpPass = process.env.SMTP_PASS || 'sua-senha-ou-app-password';
    const emailFrom = process.env.EMAIL_FROM || 'Fantasy Store <contato@fantasystore.com.br>';
    
    console.log(`Tentando enviar email com as seguintes configurações:
      - Host: ${smtpHost}
      - Porta: ${smtpPort}
      - Usuário: ${smtpUser}
      - De: ${emailFrom}
      - Para: ${options.to}
      - Seguro: ${smtpPort === 465}
    `);
    
    // Criar um transporter para envio de emails
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true para 465, false para outros portos
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      debug: true, // Mostrar debug para ajudar na solução de problemas
      logger: true, // Habilitar logging
      tls: {
        // Não verificar certificado em ambiente de desenvolvimento
        rejectUnauthorized: false
      }
    });
    
    // Verificar a conexão com o servidor SMTP
    try {
      console.log('Verificando conexão com o servidor SMTP...');
      await transporter.verify();
      console.log('Servidor SMTP está pronto para enviar mensagens');
    } catch (verifyError) {
      console.error('Erro ao verificar conexão SMTP:', verifyError);
      throw new Error(`Falha na conexão com servidor SMTP: ${verifyError.message}`);
    }
    
    // Configurar o email
    const mailOptions = {
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
    };
    
    // Enviar o email
    const info = await transporter.sendMail(mailOptions);
    
    console.log('Email enviado:', info.messageId);
    return info;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw new Error(`Falha ao enviar email: ${error.message}`);
  }
} 