import { Test, TestingModule } from '@nestjs/testing';
import { AuthenticationController } from './authentication.controller.js';
import { AuthenticationService } from './authentication.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [{ provide: AuthenticationService, useValue: {} }],
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

  it('asks the client to discard its access token when logging out', () => {
    expect(controller.logout()).toEqual({
      message: 'Logout successful. Please discard your access token.',
    });
  });
});
