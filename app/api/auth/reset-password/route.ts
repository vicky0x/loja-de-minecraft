import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/app/lib/db/mongodb';
import crypto from 'crypto';
import { sendEmail } from '@/app/lib/email';
import bcrypt from 'bcrypt';

// Solicitar redefinição de senha (gerar token e enviar email)
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { message: 'Email é obrigatório' },
        { status: 400 }
      );
    }
    
    // Importar o modelo de usuário
    const User = (await import('@/app/lib/models/user')).default;
    
    // Buscar o usuário pelo email
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      // Por segurança, não informamos que o email não existe
      return NextResponse.json(
        { message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.' },
        { status: 200 }
      );
    }
    
    // Gerar token aleatório
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    // Calcular data de expiração (1 hora)
    const resetTokenExpiry = new Date();
    resetTokenExpiry.setHours(resetTokenExpiry.getHours() + 1);
    
    // Salvar o token e a data de expiração no usuário
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = resetTokenExpiry;
    await user.save();
    
    // Construir a URL de redefinição de senha
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const resetUrl = `${baseUrl}/auth/reset-password/${resetToken}`;
    
    // Enviar email com o link de redefinição
    try {
      await sendEmail({
        to: user.email,
        subject: 'Redefinição de Senha - Fantasy Store',
        html: `
          <div style="font-family: Arial, sans-serif; color: #333;">
            <h2 style="color: #ff6000;">Redefinição de Senha - Fantasy Store</h2>
            <p>Olá ${user.username || 'usuário'},</p>
            <p>Recebemos uma solicitação para redefinir a senha da sua conta.</p>
            <p>Para redefinir sua senha, clique no botão abaixo:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #ff6000; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                Redefinir Senha
              </a>
            </div>
            <p>Se você não solicitou esta redefinição, ignore este email e sua senha permanecerá inalterada.</p>
            <p>Este link é válido por 1 hora.</p>
            <p>Atenciosamente,<br>Equipe Fantasy Store</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Erro ao enviar email de redefinição:', emailError);
      
      // Remover o token em caso de falha no envio
      user.resetPasswordToken = undefined;
      user.resetPasswordExpiry = undefined;
      await user.save();
      
      // Em ambiente de produção, não expomos detalhes técnicos ao usuário
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({
          message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
        });
      } else {
        // Em desenvolvimento, podemos mostrar o erro para fins de debug
        return NextResponse.json(
          { message: 'Erro ao enviar email de redefinição. Verifique as configurações SMTP no arquivo .env.' },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({
      message: 'Se o email estiver cadastrado, você receberá um link para redefinir sua senha.'
    });
    
  } catch (error) {
    console.error('Erro na solicitação de redefinição de senha:', error);
    return NextResponse.json(
      { message: 'Erro ao processar solicitação de redefinição de senha' },
      { status: 500 }
    );
  }
}

// Aplicar nova senha usando o token
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    
    const { token, password } = await request.json();
    
    if (!token || !password) {
      return NextResponse.json(
        { message: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }
    
    // Importar o modelo de usuário
    const User = (await import('@/app/lib/models/user')).default;
    
    // Buscar o usuário pelo token
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpiry: { $gt: new Date() } // Token ainda válido
    });
    
    if (!user) {
      return NextResponse.json(
        { message: 'Token inválido ou expirado' },
        { status: 400 }
      );
    }
    
    // Hash da nova senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Atualizar a senha e remover o token
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    await user.save();
    
    return NextResponse.json({
      message: 'Senha redefinida com sucesso'
    });
    
  } catch (error) {
    console.error('Erro na redefinição de senha:', error);
    return NextResponse.json(
      { message: 'Erro ao processar redefinição de senha' },
      { status: 500 }
    );
  }
} 