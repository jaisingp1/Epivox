import nodemailer, { type Transporter } from "nodemailer";

interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
}

function getSmtpConfig(): SmtpConfig {
  const host = process.env.SMTP_HOST || "mail.pastenlabs.com";
  const port = Number(process.env.SMTP_PORT) || 465;
  const secure = process.env.SMTP_SECURE !== undefined
    ? process.env.SMTP_SECURE === "true"
    : port === 465;
  const user = process.env.SMTP_USER || "epivoxnoreply@pastenlabs.com";
  const pass = process.env.SMTP_PASS || "";
  const from = process.env.SMTP_FROM || `"Epiroc Epivox" <${user}>`;

  return { host, port, secure, user, pass, from };
}

let transporterInstance: Transporter | null = null;

function getTransporter(): Transporter {
  const config = getSmtpConfig();

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.pass
        ? {
            user: config.user,
            pass: config.pass,
          }
        : undefined,
      tls: {
        // Permitir conexiones seguras incluso si el certificado local tiene cadenas intermedias en validación
        rejectUnauthorized: process.env.SMTP_REJECT_UNAUTHORIZED === "true",
      },
    });
  }

  return transporterInstance;
}

export interface SendEmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface SendInvitationParams {
  to: string;
  inviteUrl: string;
  role: string;
  invitedByName?: string;
}

export interface SendPasswordResetParams {
  to: string;
  resetUrl: string;
  userName?: string;
}

/**
 * Genera el template HTML corporativo para invitaciones con identidad Epiroc
 */
function buildInvitationHtml(params: SendInvitationParams): string {
  const roleLabel =
    params.role === "admin"
      ? "Administrador"
      : params.role === "presenter"
      ? "Facilitador / Presentador"
      : "Participante";

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a Epiroc Epivox</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ECEBE4; font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #425563;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ECEBE4; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 30, 50, 0.08);">
          
          <!-- Encabezado Corporativo Epiroc -->
          <tr>
            <td style="background-color: #001E32; padding: 32px 40px; text-align: left; border-bottom: 4px solid #FFC72C;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <span style="display: inline-block; background-color: #FFC72C; color: #001E32; font-weight: 900; font-size: 13px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                      EPIROC
                    </span>
                    <h1 style="margin: 12px 0 4px 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                      Epivox
                    </h1>
                    <p style="margin: 0; color: #B4B4AA; font-size: 14px;">
                      Plataforma Interactiva de Capacitación y Presentaciones
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Cuerpo del Mensaje -->
          <tr>
            <td style="padding: 40px; background-color: #FFFFFF;">
              <h2 style="margin: 0 0 16px 0; color: #001E32; font-size: 20px; font-weight: 700;">
                ¡Has sido invitado a unirte a Epivox!
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #425563;">
                ${
                  params.invitedByName
                    ? `<strong>${params.invitedByName}</strong> te ha invitado`
                    : "Has recibido una invitación"
                } a formar parte de la plataforma interactiva de Epiroc con el rol de:
              </p>

              <!-- Insignia del Rol Asignado -->
              <div style="margin: 0 0 28px 0; background-color: #F4F6F8; border-left: 4px solid #48A9C5; padding: 14px 18px; border-radius: 0 8px 8px 0;">
                <span style="font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #77746E; display: block; margin-bottom: 4px;">
                  Rol asignado
                </span>
                <span style="font-size: 17px; font-weight: 700; color: #001E32;">
                  ${roleLabel}
                </span>
              </div>

              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #425563;">
                Para activar tu cuenta y configurar tu contraseña de acceso, haz clic en el siguiente botón:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #FFC72C;">
                    <a href="${params.inviteUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 800; color: #001E32; text-decoration: none; border-radius: 8px; letter-spacing: 0.3px;">
                      Activar mi Cuenta
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Nota de Seguridad y Enlace Directo -->
              <div style="background-color: #F8F9FA; border-radius: 8px; padding: 16px; margin-top: 10px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #77746E;">
                  Si el botón anterior no funciona, copia y pega este enlace directamente en tu navegador:
                </p>
                <p style="margin: 0; font-size: 12px; word-break: break-all; color: #48A9C5;">
                  <a href="${params.inviteUrl}" style="color: #48A9C5; text-decoration: underline;">
                    ${params.inviteUrl}
                  </a>
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #77746E; line-height: 1.5;">
                ⏰ <em>Este enlace es válido durante 48 horas. Si no solicitaste esta invitación, puedes ignorar este mensaje de forma segura.</em>
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #F4F6F8; padding: 24px 40px; text-align: center; border-top: 1px solid #ECEBE4;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #001E32;">
                Epiroc Chile &bull; Epivox Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #77746E;">
                Mensaje automático enviado desde ${getSmtpConfig().user}. Por favor, no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Genera el template HTML corporativo para restablecimiento de contraseña
 */
function buildPasswordResetHtml(params: SendPasswordResetParams): string {
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Restablecer Contraseña - Epiroc Epivox</title>
</head>
<body style="margin: 0; padding: 0; background-color: #ECEBE4; font-family: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #425563;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #ECEBE4; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 30, 50, 0.08);">
          
          <!-- Encabezado Corporativo Epiroc -->
          <tr>
            <td style="background-color: #001E32; padding: 32px 40px; text-align: left; border-bottom: 4px solid #FFC72C;">
              <span style="display: inline-block; background-color: #FFC72C; color: #001E32; font-weight: 900; font-size: 13px; letter-spacing: 1.5px; padding: 4px 10px; border-radius: 4px; text-transform: uppercase;">
                EPIROC
              </span>
              <h1 style="margin: 12px 0 4px 0; color: #FFFFFF; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">
                Epivox
              </h1>
              <p style="margin: 0; color: #B4B4AA; font-size: 14px;">
                Seguridad y Acceso a la Plataforma
              </p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding: 40px; background-color: #FFFFFF;">
              <h2 style="margin: 0 0 16px 0; color: #001E32; font-size: 20px; font-weight: 700;">
                Solicitud de restablecimiento de contraseña
              </h2>

              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #425563;">
                ${params.userName ? `Hola <strong>${params.userName}</strong>, hemos` : "Hemos"} recibido una solicitud por parte de un administrador para restablecer tu contraseña en Epivox.
              </p>

              <p style="margin: 0 0 30px 0; font-size: 15px; line-height: 1.6; color: #425563;">
                Para elegir una nueva contraseña de acceso, haz clic en el siguiente botón:
              </p>

              <!-- Botón CTA -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center" style="border-radius: 8px; background-color: #FFC72C;">
                    <a href="${params.resetUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; font-size: 15px; font-weight: 800; color: #001E32; text-decoration: none; border-radius: 8px;">
                      Restablecer Contraseña
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Nota de Seguridad y Enlace Directo -->
              <div style="background-color: #F8F9FA; border-radius: 8px; padding: 16px; margin-top: 10px;">
                <p style="margin: 0 0 8px 0; font-size: 12px; color: #77746E;">
                  Si el botón anterior no funciona, copia y pega este enlace en tu navegador:
                </p>
                <p style="margin: 0; font-size: 12px; word-break: break-all; color: #48A9C5;">
                  <a href="${params.resetUrl}" style="color: #48A9C5; text-decoration: underline;">
                    ${params.resetUrl}
                  </a>
                </p>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #77746E; line-height: 1.5;">
                ⏰ <em>Este enlace caduca en 24 horas. Si no solicitaste este cambio, por favor notifica de inmediato al equipo administrador.</em>
              </p>
            </td>
          </tr>

          <!-- Pie de Página -->
          <tr>
            <td style="background-color: #F4F6F8; padding: 24px 40px; text-align: center; border-top: 1px solid #ECEBE4;">
              <p style="margin: 0 0 6px 0; font-size: 12px; font-weight: 700; color: #001E32;">
                Epiroc Chile &bull; Epivox Platform
              </p>
              <p style="margin: 0; font-size: 11px; color: #77746E;">
                Mensaje automático enviado desde ${getSmtpConfig().user}. Por favor, no respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Envía un correo con la invitación a la plataforma Epivox
 */
export async function sendInvitationEmail(
  params: SendInvitationParams,
): Promise<SendEmailResult> {
  const config = getSmtpConfig();

  if (!config.pass) {
    // Si no hay contraseña configurada en .env, logueamos advertencia pero no quebramos
    return {
      success: false,
      error: "SMTP_PASS no está configurada en las variables de entorno del servidor.",
    };
  }

  try {
    const transporter = getTransporter();
    const html = buildInvitationHtml(params);

    const info = await transporter.sendMail({
      from: config.from,
      to: params.to,
      subject: "Invitación para unirte a Epiroc Epivox",
      html,
      text: `Has sido invitado a Epiroc Epivox. Accede a este enlace para activar tu cuenta: ${params.inviteUrl}`,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Envía un correo con el enlace para restablecer la contraseña
 */
export async function sendPasswordResetEmail(
  params: SendPasswordResetParams,
): Promise<SendEmailResult> {
  const config = getSmtpConfig();

  if (!config.pass) {
    return {
      success: false,
      error: "SMTP_PASS no está configurada en las variables de entorno del servidor.",
    };
  }

  try {
    const transporter = getTransporter();
    const html = buildPasswordResetHtml(params);

    const info = await transporter.sendMail({
      from: config.from,
      to: params.to,
      subject: "Restablecimiento de contraseña - Epiroc Epivox",
      html,
      text: `Solicitud de restablecimiento de contraseña en Epiroc Epivox. Accede a este enlace: ${params.resetUrl}`,
    });

    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      error: errorMessage,
    };
  }
}
