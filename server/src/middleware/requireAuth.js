import jwt from 'jsonwebtoken';

export function requireAuth(request, response, next) {
  const header = request.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return response.status(401).json({
      error: 'Sign in to continue.'
    });
  }

  try {
    request.user = jwt.verify(token, process.env.JWT_SECRET);
    return next();
  } catch {
    return response.status(401).json({
      error: 'Your session is invalid or expired.'
    });
  }
}