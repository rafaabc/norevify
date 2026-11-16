'use strict';

const { Resend } = require('resend');

let _resend = null;
function getResend() {
  if (!_resend) _resend = new Resend(process.env.RESEND_API_KEY);
  return _resend;
}

function fromAddress() {
  return `Norevify <${process.env.EMAIL_FROM || 'onboarding@resend.dev'}>`;
}

const HTML_ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

// User-controlled free text (e.g. reminder.title) is interpolated straight into these
// HTML email templates — escape it so a reminder title can't inject markup/links.
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => HTML_ESCAPES[c]);
}

function formatReminderLine(r) {
  const parts = [escapeHtml(r.type)];
  if (r.title) parts.push(`— ${escapeHtml(r.title)}`);
  if (r.dueDate) parts.push(`(${new Date(r.dueDate).toLocaleDateString('pt-BR')})`);
  if (r.dueKm != null) parts.push(`${r.dueKm} km`);
  return parts.join(' ');
}

function reminderSection(heading, reminders) {
  if (reminders.length === 0) return '';
  return `
      <p><strong>${heading}:</strong></p>
      <ul>${reminders.map((r) => `<li>${formatReminderLine(r)}</li>`).join('')}</ul>
  `;
}

async function sendReminderDigest({ to, overdue, dueSoon }) {
  if (!process.env.RESEND_API_KEY) return;
  const remindersUrl = `${process.env.FRONTEND_URL || process.env.BASE_URL}/reminders`;
  await getResend().emails.send({
    from: fromAddress(),
    to,
    subject: 'Lembretes pendentes — Norevify',
    html: `
      <p>Você tem lembretes de manutenção que precisam de atenção.</p>
      ${reminderSection('Atrasados', overdue)}
      ${reminderSection('Vencendo em breve', dueSoon)}
      <p><a href="${remindersUrl}">Ver todos os lembretes</a></p>
    `,
  });
}

module.exports = {
  sendReminderDigest,
};
