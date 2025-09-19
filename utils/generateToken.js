// backend/utils/generateToken.js  (replace yours)
import jwt from 'jsonwebtoken';

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });

  const isProd = process.env.NODE_ENV === 'production';

  res.cookie('jwt', token, {
    httpOnly: true,
    secure: isProd,               // cookie over HTTPS only in prod
    sameSite: isProd ? 'lax' : 'lax', // allow first-party subdomain usage
    domain: isProd ? '.khisima.com' : undefined, // <-- IMPORTANT when you move API to api.khisima.com
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });

  return token;                   // we’ll also send it in JSON for Bearer fallback
};

export default generateToken;
