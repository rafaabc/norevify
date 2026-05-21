'use strict';

const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function fromAddress() {
  return `Drive Ledger <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`;
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  if (!process.env.RESEND_API_KEY) return;
  await getResend().emails.send({
    from: fromAddress(),
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

async function sendVerificationEmail({ to, verifyUrl }) {
  if (!process.env.RESEND_API_KEY) return;
  await getResend().emails.send({
    from: fromAddress(),
    to,
    subject: 'Verifique seu email — Drive Ledger',
    html: `
      <p>Obrigado por criar sua conta no <strong>Drive Ledger</strong>!</p>
      <p>Clique no link abaixo para verificar seu endereço de email. O link é válido por <strong>24 horas</strong>.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>Se você não criou esta conta, ignore este email.</p>
    `,
  });
}

module.exports = { sendPasswordResetEmail, sendVerificationEmail };
