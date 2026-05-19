import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import authService from '@/lib/services/auth.service';

export const PATCH = withAuth(async (req, _ctx, user) => {
  await connectDB();
  try {
    const { currentKm } = await req.json();
    const result = await authService.updateOdometer({ id: user.id, currentKm });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
