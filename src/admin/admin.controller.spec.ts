import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { UpdateUserRoleDto } from './dto/update-user-role.dto.js';

describe('AdminController', () => {
  let controller: AdminController;
  const adminService = {
    getAuditLogs: vi.fn(),
    getStatistics: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AdminController],
      providers: [{ provide: AdminService, useValue: adminService }],
    }).compile();
    controller = module.get<AdminController>(AdminController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('protects the admin-specific controller with JWT and admin-role guards', () => {
    expect(Reflect.getMetadata('__guards__', AdminController)).toEqual([
      JwtAuthGuard,
      RolesGuard,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, AdminController)).toEqual(['admin']);
  });

  it('validates DTO input and transforms bounded pagination query values', async () => {
    const [validationPipe] = Reflect.getMetadata(
      '__pipes__',
      AdminController,
    ) as ValidationPipe[];

    await expect(
      validationPipe.transform(
        { role: 'root' },
        { type: 'body', metatype: UpdateUserRoleDto },
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
  });
});
