import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { Role } from '../roles.enum';

const createExecutionContext = (user: { role?: Role } | null = null): ExecutionContext => {
  return {
    getClass: () => ({} as never),
    getHandler: () => ({} as never),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext;
};

describe('RolesGuard', () => {
  it('allows when no roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const result = guard.canActivate(createExecutionContext({ role: Role.Admin }));
    expect(result).toBe(true);
  });

  it('allows when user has required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.Admin, Role.Teacher]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const result = guard.canActivate(createExecutionContext({ role: Role.Teacher }));
    expect(result).toBe(true);
  });

  it('denies when user role missing', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const result = guard.canActivate(createExecutionContext({ role: Role.Student }));
    expect(result).toBe(false);
  });

  it('denies when request has no user', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue([Role.Admin]),
    } as unknown as Reflector;
    const guard = new RolesGuard(reflector);

    const result = guard.canActivate(createExecutionContext(null));
    expect(result).toBe(false);
  });
});
