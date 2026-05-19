'use strict';

const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  await getResend().emails.send({
    from: 'Drive Ledger <onboarding@resend.dev>',
    to,
    subject: 'Recuperação de senha — Drive Ledger',
    html: `
      <p>Você solicitou a recuperação de senha da sua conta no <strong>Drive Ledger</strong>.</p>
      <p>Clique no link abaixo para redefinir sua senha. O link é válido por <strong>15 minutos</strong>.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>Se você não fez essa solicitação, ignore este email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
