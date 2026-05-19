import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';

export const PATCH = withAuth(async (req, _ctx, user) => {
  await connectDB();
  try {
    const { language } = await req.json();
    const result = await authService.updateLanguage({ id: user.id, language });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
