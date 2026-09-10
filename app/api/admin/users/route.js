import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import adminService from '@/lib/services/admin.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export const GET = withAuth(async (_req, _ctx, user) => {
  await connectDB();
  try {
    const users = await adminService.listUsers(user.id);
    return NextResponse.json(users);
  } catch (err) {
    return errorResponse(err, { route: '/api/admin/users' });
  }
});
