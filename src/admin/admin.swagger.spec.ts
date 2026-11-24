import { Test } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AdminController } from './admin.controller.js';
import { AdminService } from './admin.service.js';
import { UsersAdminController } from '../users/users-admin.controller.js';
import { UsersService } from '../users/users.service.js';
import { CompanyAdminController } from '../company/company-admin.controller.js';
import { CompanyService } from '../company/company.service.js';
import { JobsAdminController } from '../jobs/jobs-admin.controller.js';
import { JobService } from '../jobs/jobs.service.js';
import { ApplicationsAdminController } from '../applications/applications-admin.controller.js';
import { ApplicationsService } from '../applications/applications.service.js';
import { ReportsAdminController } from '../reports/reports-admin.controller.js';
import { ReportsService } from '../reports/reports.service.js';

describe('Admin OpenAPI documentation', () => {
  it('documents admin paths, bearer authorization, request DTOs, and safe response schemas', async () => {
    const module = await Test.createTestingModule({
      controllers: [
        AdminController,
        UsersAdminController,
        CompanyAdminController,
        JobsAdminController,
        ApplicationsAdminController,
        ReportsAdminController,
      ],
      providers: [
        { provide: AdminService, useValue: {} },
        { provide: UsersService, useValue: {} },
        { provide: CompanyService, useValue: {} },
        { provide: JobService, useValue: {} },
        { provide: ApplicationsService, useValue: {} },
        { provide: ReportsService, useValue: {} },
      ],
    }).compile();
    const app = module.createNestApplication();
    await app.init();

    const config = new DocumentBuilder()
      .setTitle('Online Job Board Recruitment Platform API')
      .setDescription('Recruitment platform API')
      .setVersion('1.0')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'JWT-auth',
      )
      .build();
    const document = SwaggerModule.createDocument(app, config);

    expect(document.info.title).toBe(
      'Online Job Board Recruitment Platform API',
    );
    expect(document.components?.securitySchemes?.['JWT-auth']).toMatchObject({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
    });
    expect(document.paths['/admin/users']?.get?.tags).toContain('Admin');
    expect(document.paths['/admin/users']?.get?.security).toEqual([
      { 'JWT-auth': [] },
    ]);
    expect(document.paths['/admin/users']?.get?.parameters).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'page',
          in: 'query',
          required: false,
        }),
        expect.objectContaining({
          name: 'limit',
          in: 'query',
          required: false,
        }),
      ]),
    );
    const documentedAdminPaths = Object.entries(document.paths).filter(
      ([path]) => path.startsWith('/admin/'),
    );
    expect(documentedAdminPaths.length).toBeGreaterThan(0);
    for (const [, pathItem] of documentedAdminPaths) {
      for (const operation of Object.values(pathItem ?? {})) {
        expect(operation).toMatchObject({
          tags: ['Admin'],
          security: [{ 'JWT-auth': [] }],
        });
        expect(operation).toHaveProperty('responses.401');
        expect(operation).toHaveProperty('responses.403');
      }
    }
    expect(
      document.paths['/admin/users/{id}/status']?.patch?.requestBody,
    ).toBeDefined();
    expect(
      document.paths['/admin/users/{id}/role']?.patch?.requestBody,
    ).toBeDefined();
    expect(
      document.paths['/admin/companies/{id}/verify']?.patch?.requestBody,
    ).toBeDefined();
    expect(
      document.paths['/admin/reports/{id}/status']?.patch?.requestBody,
    ).toBeDefined();
    expect(document.paths['/admin/applications/{id}']?.get).toBeDefined();
    expect(document.paths['/admin/audit-logs']?.get).toBeDefined();

    const userSchema = document.components?.schemas?.AdminUserResponseDto;
    expect(userSchema).toBeDefined();
    expect(userSchema).not.toHaveProperty('properties.password');
    expect(userSchema).not.toHaveProperty(
      'properties.emailVerificationTokenHash',
    );
    expect(userSchema).not.toHaveProperty(
      'properties.emailVerificationTokenExpiresAt',
    );
    expect(document.components?.schemas?.UpdateUserStatusDto).toMatchObject({
      properties: {
        isActive: {
          type: 'number',
          enum: [0, 1],
        },
      },
    });
    expect(
      document.components?.schemas?.UpdateCompanyVerificationDto,
    ).toHaveProperty('properties.verificationStatus.enum', [
      'verified',
      'rejected',
    ]);
    expect(document.components?.schemas?.UpdateReportStatusDto).toHaveProperty(
      'properties.status.enum',
      ['resolved', 'dismissed'],
    );
    expect(document.components?.schemas?.UpdateUserRoleDto).toHaveProperty(
      'properties.role.enum',
      ['job_seeker', 'employer', 'admin'],
    );

    await app.close();
  }, 15_000);
});
