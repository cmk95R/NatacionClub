import { Resend } from "resend";

let resendClient;

const getResendClient = () => {
  if (!resendClient && process.env.RESEND_API_KEY) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
};

/**
 * Envío de emails transaccionales usando Resend
 * @param {Object} options
 * @param {string|string[]} options.to
 * @param {string} options.subject
 * @param {string} options.html
 * @param {string} [options.from]
 */
export async function sendEmail({ to, subject, html, from }) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("⚠️ RESEND_API_KEY no configurada. Correo omitido:", { to, subject });
    return { success: false, error: "RESEND_API_KEY no configurada" };
  }

  const sender = from || process.env.EMAIL_FROM || "Club de Natación <noreply@clubnatacion.com>";

  try {
    const client = getResendClient();
    const { data, error } = await client.emails.send({
      from: sender,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    });

    if (error) {
      console.error("❌ Error enviando email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error("❌ Error inesperado enviando email:", err);
    return { success: false, error: err?.message || "Error desconocido" };
  }
}

export default {
  sendEmail,
};

