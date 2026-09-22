import nodemailer from "nodemailer";

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter {
  if (transporter) return transporter;
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw new Error("SMTP_HOST/SMTP_USER/SMTP_PASS are not set (see .env.local)");
  }
  const port = Number(SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587/others use STARTTLS
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
  return transporter;
}

export async function sendMail(opts: { to: string; subject: string; html: string; text: string }): Promise<void> {
  const from = process.env.SMTP_FROM || process.env.SMTP_USER!;
  await getTransporter().sendMail({ from, to: opts.to, subject: opts.subject, html: opts.html, text: opts.text });
}
