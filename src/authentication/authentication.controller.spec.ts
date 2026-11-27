import { Test, TestingModule } from '@nestjs/testing';
import { vi } from 'vitest';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  const authenticationService = {
    logout: vi.fn().mockResolvedValue({
      message: 'Logout successful. All active access tokens were revoked.',
    }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: AuthenticationService, useValue: authenticationService },
      ],
    }).compile();

    controller = module.get<AuthenticationController>(AuthenticationController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires a JWT for logout', () => {
    expect(
      Reflect.getMetadata(
        '__guards__',
        AuthenticationController.prototype.logout,
      ),
    ).toContain(JwtAuthGuard);
  });

  it('revokes the authenticated user tokens when logging out', async () => {
    const request = { user: { sub: 7 } } as Parameters<
      AuthenticationController['logout']
    >[0];

    await expect(controller.logout(request)).resolves.toEqual({
      message: 'Logout successful. All active access tokens were revoked.',
    });
    expect(authenticationService.logout).toHaveBeenCalledWith(7);
  });
});
