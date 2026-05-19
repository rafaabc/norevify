import jwt from 'jsonwebtoken';
import { NextResponse } from 'next/server';

export function withAuth(handler) {
  return async (req, ctx) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return NextResponse.json({ message: 'Token not provided' }, { status: 401 });
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return NextResponse.json({ message: 'Invalid or expired token' }, { status: 403 });
    }
    return handler(req, ctx, user);
  };
}
