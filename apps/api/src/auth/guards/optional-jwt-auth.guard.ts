import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT auth that never rejects. With a valid Bearer token, `req.user` is populated
 * ({ userId, email, role }); with a missing or invalid token, `req.user` is
 * undefined and the request proceeds anyway.
 *
 * Used on guest-friendly endpoints that must stay reachable without an account
 * (e.g. the free Series questions) while still letting authenticated users be
 * recognised so their entitlements can be checked (Sprint 6 premium gating).
 */
@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Always allow the request through; the strategy still runs so a valid token
  // is decoded into req.user when present.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      await super.canActivate(context);
    } catch {
      // No/invalid token — fall through as an anonymous request.
    }
    return true;
  }

  // Never throw on a missing/invalid user; just return undefined.
  handleRequest<TUser = unknown>(_err: unknown, user: TUser): TUser {
    return (user || undefined) as TUser;
  }
}
