import { SignJWT, jwtVerify } from 'jose';
import { config } from '../config/index.js';

const secret = new TextEncoder().encode(config.jwtSecret);

export async function signToken(userId: string, tokenVersion: number): Promise<string> {
  return new SignJWT({ tv: tokenVersion })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime(config.jwtExpiresIn)
    .sign(secret);
}

export async function verifyToken(
  token: string,
): Promise<{ userId: string; tokenVersion: number }> {
  const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
  if (typeof payload.sub !== 'string' || typeof payload.tv !== 'number') {
    throw new Error('Malformed token');
  }
  return { userId: payload.sub, tokenVersion: payload.tv };
}
