import { SignJWT } from 'jose';
import type { Express } from 'express';

// Finds every route the app has registered, as "METHOD /path" (the /api prefix is added).
// The security test uses this so a route added later is checked automatically.
export function listRoutes(app: Express): { method: string; path: string }[] {
  type Layer = {
    route?: { path: string; methods: Record<string, boolean> };
    handle?: { stack?: Layer[] };
  };
  const found: { method: string; path: string }[] = [];

  function walk(stack: Layer[]) {
    for (const layer of stack) {
      if (layer.route) {
        for (const method of Object.keys(layer.route.methods)) {
          found.push({ method: method.toUpperCase(), path: `/api${layer.route.path}` });
        }
      } else if (layer.handle?.stack) {
        walk(layer.handle.stack);
      }
    }
  }

  walk((app as unknown as { router: { stack: Layer[] } }).router.stack);
  return found;
}

const encode = (text: string) => new TextEncoder().encode(text);

// Builds tokens the server must refuse. Each one is wrong in exactly one way.
export async function forgedToken(
  kind: 'wrong-secret' | 'expired' | 'other-algorithm',
  userId: string,
  tokenVersion: number,
): Promise<string> {
  const realSecret = process.env.JWT_SECRET ?? '';
  const claims = new SignJWT({ tv: tokenVersion }).setSubject(userId).setIssuedAt();

  if (kind === 'wrong-secret') {
    return claims
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(encode('an-attacker-secret-that-is-long-enough-1234567890'));
  }
  if (kind === 'expired') {
    return claims
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60)
      .sign(encode(realSecret));
  }
  // Correct secret but a different signing algorithm than the server accepts
  return claims
    .setProtectedHeader({ alg: 'HS512' })
    .setExpirationTime('1h')
    .sign(encode(realSecret));
}

// A token with no signature at all ("alg: none"), the classic JWT trick
export function unsignedToken(userId: string, tokenVersion: number): string {
  const part = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + 3600;
  return `${part({ alg: 'none', typ: 'JWT' })}.${part({ sub: userId, tv: tokenVersion, exp })}.`;
}
