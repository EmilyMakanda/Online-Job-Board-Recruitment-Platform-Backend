import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { UpdateCompanyVerificationDto } from './dto/update-company-verification.js';

describe('AdminController', () => {
  let controller: AdminController;
  const adminService = {
    getAllUsers: vi.fn(),
    getUserById: vi.fn(),
    activateUser: vi.fn(),
    deactivateUser: vi.fn(),
    updateUserStatus: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    }).compile();

    controller = module.get<AdminController>(AdminController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects the entire admin controller with JWT and admin-role guards', () => {
    expect(Reflect.getMetadata('__guards__', AdminController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, AdminController)).toEqual(['admin']);
  });

  it('passes the caller identity to account deactivation', async () => {
    const request = { user: { sub: 11 } } as never;
    await controller.deactivateUser(12, request);

    expect(adminService.deactivateUser).toHaveBeenCalledWith(12, 11);
  });

  it('validates admin request DTOs and transforms pagination query values', async () => {
    const [validationPipe] = Reflect.getMetadata(
      '__pipes__',
      AdminController,
    ) as ValidationPipe[];

    await expect(
      validationPipe.transform(
        { verificationStatus: 'unknown' },
        { type: 'body', metatype: UpdateCompanyVerificationDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { page: '2', limit: '101' },
        { type: 'query', metatype: PaginationQueryDto },
      ),
    ).rejects.toThrow(BadRequestException);

    await expect(
      validationPipe.transform(
        { page: '2', limit: '25' },
        { type: 'query', metatype: PaginationQueryDto },
      ),
    ).resolves.toMatchObject({ page: 2, limit: 25 });

    await expect(
      validationPipe.transform(
        {},
        { type: 'query', metatype: PaginationQueryDto },
      ),
    ).resolves.toMatchObject({ page: 1, limit: 50 });
  });
});
