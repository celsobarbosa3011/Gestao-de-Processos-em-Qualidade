import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return { apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email };
}

async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail
  };
}

export async function sendProvisionalPasswordEmail(
  toEmail: string,
  userName: string,
  provisionalPassword: string,
  expiresAt: Date
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const formattedExpiry = new Intl.DateTimeFormat('pt-BR', {
      dateStyle: 'full',
      timeStyle: 'short',
      timeZone: 'America/Sao_Paulo'
    }).format(expiresAt);

    await client.emails.send({
      from: fromEmail || 'MediFlow <noreply@resend.dev>',
      to: toEmail,
      subject: 'Suas credenciais de acesso - UP Qualidade em Saúde',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B4F5C 0%, #2ECC71 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">UP - Qualidade em Saúde</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #3B4F5C; margin-top: 0;">Olá, ${userName}!</h2>
            
            <p>Sua conta foi criada no sistema UP - Qualidade em Saúde.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #2ECC71; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>E-mail:</strong> ${toEmail}</p>
              <p style="margin: 0;"><strong>Senha provisória:</strong> <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 16px; letter-spacing: 1px;">${provisionalPassword}</code></p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border: 1px solid #ffc107; margin: 20px 0;">
              <p style="margin: 0; color: #856404;">
                <strong>⚠️ Importante:</strong> Esta senha é provisória e expira em ${formattedExpiry}. 
                Você deverá alterá-la e completar seu cadastro no primeiro acesso.
              </p>
            </div>
            
            <p>Para acessar o sistema, clique no botão abaixo:</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/auth" 
                 style="background: #2ECC71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Acessar o Sistema
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou esta conta, por favor ignore este e-mail.
            </p>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} UP - Qualidade em Saúde. Todos os direitos reservados.</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`Email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}

export async function sendWelcomeEmail(
  toEmail: string,
  userName: string
): Promise<boolean> {
  try {
    const { client, fromEmail } = await getUncachableResendClient();

    await client.emails.send({
      from: fromEmail || 'MediFlow <noreply@resend.dev>',
      to: toEmail,
      subject: 'Bem-vindo ao UP - Qualidade em Saúde',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3B4F5C 0%, #2ECC71 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">UP - Qualidade em Saúde</h1>
          </div>
          
          <div style="background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-top: none; border-radius: 0 0 10px 10px;">
            <h2 style="color: #3B4F5C; margin-top: 0;">Olá, ${userName}!</h2>
            
            <p>Bem-vindo ao sistema UP - Qualidade em Saúde!</p>
            
            <p>Seu cadastro foi concluído com sucesso. Agora você pode acessar todas as funcionalidades do sistema.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.REPLIT_DEV_DOMAIN ? 'https://' + process.env.REPLIT_DEV_DOMAIN : 'http://localhost:5000'}/auth" 
                 style="background: #2ECC71; color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Acessar o Sistema
              </a>
            </div>
          </div>
          
          <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
            <p>Este é um e-mail automático, por favor não responda.</p>
            <p>© ${new Date().getFullYear()} UP - Qualidade em Saúde. Todos os direitos reservados.</p>
          </div>
        </body>
        </html>
      `
    });
    
    console.log(`Welcome email sent successfully to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    return false;
  }
}
