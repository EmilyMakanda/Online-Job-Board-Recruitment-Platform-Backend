import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';

import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { ROLES_KEY } from '../authentication/roles.decorator.js';

describe('UsersController', () => {
  let controller: UsersController;

  const usersService = {
    findAllUsers: vi.fn(),
    findUser: vi.fn(),
    updateUser: vi.fn(),
    removeUser: vi.fn(),
  };

  const reqFor = (sub: number, role: 'job_seeker' | 'employer' = 'job_seeker') =>
    ({ user: { sub, email: 'a@example.com', role } }) as never;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: usersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('requires JWT and role guards on all user routes', () => {
    const guards = Reflect.getMetadata('__guards__', UsersController);
    expect(guards).toContain(JwtAuthGuard);
    expect(guards).toContain(RolesGuard);
  });

  it('restricts the user list to employers', () => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      UsersController.prototype.findAll,
    );
    expect(roles).toEqual(['employer']);
  });

  describe('findOne', () => {
    it('returns your own profile', async () => {
      usersService.findUser.mockResolvedValue({ id: 5 });

      await expect(controller.findOne(5, reqFor(5))).resolves.toEqual({ id: 5 });
    });

    it("forbids viewing someone else's profile", () => {
      expect(() => controller.findOne(6, reqFor(5))).toThrow(ForbiddenException);
      expect(usersService.findUser).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('updates your own profile', async () => {
      usersService.updateUser.mockResolvedValue({ id: 5, name: 'New' });

      await controller.update(5, { name: 'New' }, reqFor(5));

      expect(usersService.updateUser).toHaveBeenCalledWith(5, { name: 'New' });
    });

    it("forbids updating someone else's profile", () => {
      expect(() => controller.update(6, { name: 'X' }, reqFor(5))).toThrow(
        ForbiddenException,
      );
      expect(usersService.updateUser).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes your own account', async () => {
      usersService.removeUser.mockResolvedValue({ message: 'ok' });

      await controller.remove(5, reqFor(5));

      expect(usersService.removeUser).toHaveBeenCalledWith(5);
    });

    it("forbids deleting someone else's account", () => {
      expect(() => controller.remove(6, reqFor(5))).toThrow(ForbiddenException);
      expect(usersService.removeUser).not.toHaveBeenCalled();
    });
  });
});