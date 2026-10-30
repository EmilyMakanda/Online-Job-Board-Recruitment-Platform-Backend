import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { RolesGuard } from './roles.guards.js';

describe('RolesGuard', () => {
  const handler = vi.fn();
  const controller = vi.fn();

  function createContext(role?: string): ExecutionContext {
    return {
      getHandler: () => handler,
      getClass: () => controller,
      switchToHttp: () => ({
        getRequest: () => (role ? { user: { role } } : { user: undefined }),
      }),
    } as unknown as ExecutionContext;
  }

  it('allows requests when no roles are required', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext())).toBe(true);
  });

  it('allows a user with a required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['employer']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(guard.canActivate(createContext('employer'))).toBe(true);
  });

  it('rejects users without a required role', () => {
    const reflector = {
      getAllAndOverride: vi.fn().mockReturnValue(['employer']),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    expect(() => guard.canActivate(createContext('job_seeker'))).toThrow(
      'You do not have permission to access this resource.',
    );
  });
});
