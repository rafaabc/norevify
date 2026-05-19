import jwt from 'jsonwebtoken';

function jsonErr(message, status) {
  return new Response(JSON.stringify({ message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function withAuth(handler) {
  return async (req, ctx) => {
    const token = req.headers.get('authorization')?.split(' ')[1];
    if (!token) return jsonErr('Token not provided', 401);
    let user;
    try {
      user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return jsonErr('Invalid or expired token', 403);
    }
    return handler(req, ctx, user);
  };
}
