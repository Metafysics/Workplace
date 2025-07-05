import { MailService } from '@sendgrid/mail';

const mailService = new MailService();

// Initialize SendGrid with API key
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('SendGrid API key not configured, email would be sent to:', params.to);
    return false;
  }

  try {
    await mailService.send({
      to: params.to,
      from: params.from,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    return true;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}

export function generateResetPasswordEmail(token: string, userEmail: string): EmailParams {
  const resetUrl = `${process.env.NODE_ENV === 'production' ? 'https' : 'http'}://${process.env.REPLIT_DEV_DOMAIN || 'localhost:5000'}/reset-password?token=${token}`;
  
  return {
    to: userEmail,
    from: 'noreply@workmoments.be',
    subject: 'WorkMoments - Wachtwoord Reset',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Wachtwoord Reset</h2>
        <p>U heeft een verzoek ingediend om uw wachtwoord te resetten.</p>
        <p>Klik op de onderstaande link om een nieuw wachtwoord in te stellen:</p>
        <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
          Reset Wachtwoord
        </a>
        <p>Deze link is 24 uur geldig.</p>
        <p>Als u dit verzoek niet heeft ingediend, kunt u deze email negeren.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">WorkMoments - Employee Engagement Platform</p>
      </div>
    `,
    text: `
      Wachtwoord Reset
      
      U heeft een verzoek ingediend om uw wachtwoord te resetten.
      
      Kopieer en plak de onderstaande link in uw browser om een nieuw wachtwoord in te stellen:
      ${resetUrl}
      
      Deze link is 24 uur geldig.
      
      Als u dit verzoek niet heeft ingediend, kunt u deze email negeren.
      
      WorkMoments - Employee Engagement Platform
    `
  };
}

export function generateMfaCodeEmail(code: string, userEmail: string): EmailParams {
  return {
    to: userEmail,
    from: 'noreply@workmoments.be',
    subject: 'WorkMoments - Verificatiecode',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verificatiecode</h2>
        <p>Uw verificatiecode is:</p>
        <h1 style="color: #007bff; font-size: 36px; letter-spacing: 5px; text-align: center; background-color: #f8f9fa; padding: 20px; border-radius: 5px;">
          ${code}
        </h1>
        <p>Deze code is 10 minuten geldig.</p>
        <p>Voer deze code in op de verificatiepagina om door te gaan.</p>
        <hr>
        <p style="color: #666; font-size: 12px;">WorkMoments - Employee Engagement Platform</p>
      </div>
    `,
    text: `
      Verificatiecode
      
      Uw verificatiecode is: ${code}
      
      Deze code is 10 minuten geldig.
      Voer deze code in op de verificatiepagina om door te gaan.
      
      WorkMoments - Employee Engagement Platform
    `
  };
}