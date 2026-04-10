import nodemailer from 'nodemailer';

/**
 * Utilitário de envio de e-mails usando Nodemailer.
 * Como o usuário aprovou o uso do Ethereal Mail para dev,
 * vamos configurar uma conta de testes automaticamente se as variáveis falharem.
 */

// Criação do transportador (Lazy Creation)
let transporter = null;

async function getTransporter() {
  if (transporter) return transporter;

  // Em produção, isso seria preenchido no arquivo .env
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (SMTP_HOST && SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT || 587,
      secure: SMTP_PORT == 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
  } else {
    // Modo de Desenvolvimento (Mock / Ethereal)
    console.log('🤖 SMTP_HOST não definido no .env. Gerando conta de teste do Ethereal Mail...');
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
  }

  return transporter;
}

export const sendMail = async ({ to, subject, html }) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from: '"Food App" <no-reply@foodapp.com>',
      to,
      subject,
      html,
    });

    console.log("Mensagem enviada com sucesso: %s", info.messageId);
    
    // Preview URL only available for Ethereal accounts
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      console.log('=============================================');
      console.log("📬 URL de Visualização do E-mail (Test Account):");
      console.log(previewUrl);
      console.log('=============================================');
    }

    return info;
  } catch (err) {
    console.error("Erro ao enviar e-mail:", err);
    throw err;
  }
};
