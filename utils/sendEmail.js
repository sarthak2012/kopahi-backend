const nodemailer = require("nodemailer");

const escapeHtml = (str = "") =>
  String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const buildTransport = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = buildTransport();
  if (!transporter) {
    console.warn("[email] SMTP not configured — skipping send");
    return { skipped: true };
  }

  const info = await transporter.sendMail({
    from: process.env.SMTP_USER,
    to: to || process.env.SMTP_USER,
    subject,
    html,
    text,
  });

  return { messageId: info.messageId };
};

module.exports = { sendEmail, escapeHtml };
