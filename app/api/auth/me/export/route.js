import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';

export const GET = withAuth(async (req, ctx, user) => {
  await connectDB();
  try {
    const result = await authService.exportUserData({ userId: user.id });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
