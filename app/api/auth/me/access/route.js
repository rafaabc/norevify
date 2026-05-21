import { NextResponse } from 'next/server';
import { withAuth } from '@/lib/auth.mjs';

export const GET = withAuth(async (_req, _ctx, _user) => {
  return NextResponse.json({
    dataController: 'Norevify',
    dpoContact: 'faelsabc21@gmail.com',
    dataTreated: ['name', 'email', 'expenses', 'reminders', 'odometer'],
    purposes: ['expense tracking', 'reminder notifications', 'usage analytics'],
    retention: '14 months from last login',
    rights: ['access (GET /api/auth/me/export)', 'deletion (DELETE /api/auth/me)'],
    legalBasis: 'LGPD Art. 7 VI — legitimate interest / contract performance',
  });
});
