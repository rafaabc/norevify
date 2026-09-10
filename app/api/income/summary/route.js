import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db.mjs';
import { withAuth } from '@/lib/auth.mjs';
import incomeService from '@/lib/services/income.service';
import { errorResponse } from '@/lib/handlerResponse.mjs';

export const GET = withAuth(async (req, _ctx, user) => {
  await connectDB();
  const { searchParams } = new URL(req.url);
  try {
    const result = await incomeService.getProfitSummary(user.id, {
      year: searchParams.get('year'),
      month: searchParams.get('month'),
      vehicleId: searchParams.get('vehicleId'),
      breakdown: searchParams.get('breakdown'),
    });
    return NextResponse.json(result);
  } catch (err) {
    return errorResponse(err, { route: '/api/income/summary' });
  }
});
