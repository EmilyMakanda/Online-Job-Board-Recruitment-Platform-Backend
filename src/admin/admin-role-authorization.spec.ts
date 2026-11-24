import { JwtAuthGuard } from '../authentication/guards/jwt-auth.guard.js';
import { RolesGuard } from '../authentication/guards/roles.guards.js';
import { ROLES_KEY } from '../authentication/roles.decorator.js';
import { ApplicationsAdminController } from '../applications/applications-admin.controller.js';
import { CompanyAdminController } from '../company/company-admin.controller.js';
import { JobsAdminController } from '../jobs/jobs-admin.controller.js';
import { ReportsAdminController } from '../reports/reports-admin.controller.js';
import { AdminAuditController } from './admin-audit.controller.js';
import { UsersAdminController } from '../users/users-admin.controller.js';

const adminControllers = [
  AdminAuditController,
  UsersAdminController,
  CompanyAdminController,
  JobsAdminController,
  ApplicationsAdminController,
  ReportsAdminController,
];

describe('admin route authorization', () => {
  it.each(adminControllers)(
    '%s requires JWT authentication and the admin role',
    (controller) => {
      expect(Reflect.getMetadata('__guards__', controller)).toEqual([
        JwtAuthGuard,
        RolesGuard,
      ]);
      expect(Reflect.getMetadata(ROLES_KEY, controller)).toEqual(['admin']);
    },
  );
});
