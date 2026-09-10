import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import expensesService from '@/lib/services/expenses.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export const GET = withAuth(async (_req, ctx, user) => {
  await connectDB();
  const { id } = await ctx.params;
  try {
    const result = await expensesService.getExpense(user.id, id);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/expenses/[id]' });
  }
});

export const PUT = withAuth(async (req, ctx, user) => {
  await connectDB();
  const { id } = await ctx.params;
  try {
    const body = await req.json();
    const result = await expensesService.updateExpense(user.id, id, body);
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/expenses/[id]' });
  }
});

export const DELETE = withAuth(async (_req, ctx, user) => {
  await connectDB();
  const { id } = await ctx.params;
  try {
    await expensesService.deleteExpense(user.id, id);
    return new Response(null, { status: 204 });
  } catch (err) {
    return errorResponse(err, { route: '/api/expenses/[id]' });
  }
});
