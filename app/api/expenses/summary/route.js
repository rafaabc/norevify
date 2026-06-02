import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import expensesService from '@/lib/services/expenses.service';

export const GET = withAuth(async (req, _ctx, user) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  try {
    const result = await expensesService.getSummary(user.id, {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
      category: searchParams.get('category'),
    });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ message: err.message }, { status: err.status || 500 });
  }
});
