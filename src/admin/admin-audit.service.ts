import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';

import { AdminAuditLog } from './entities/admin-audit-log.entity.js';

export interface AdminAuditEvent {
  actorId: number;
  action: string;
  targetType: string;
  targetId: string;
  details: Record<string, string | number | boolean | null>;
}

@Injectable()
export class AdminAuditService {
  write(manager: EntityManager, event: AdminAuditEvent) {
    return manager.getRepository(AdminAuditLog).save({
      ...event,
      details: JSON.stringify(event.details),
    });
  }
}
