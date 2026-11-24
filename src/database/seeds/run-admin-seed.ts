import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { User } from '../../authentication/entities/user.entity.js';
import { Application } from '../../applications/entities/application.entity.js';
import { ApplicationDocument } from '../../applications/entities/application-document.entity.js';
import { Company } from '../../company/entities/company.entity.js';
import { Job } from '../../jobs/entities/jobs.entity.js';
import { Notification } from '../../notification/notification.entity.js';
import { Report } from '../../reports/entities/report.entity.js';
import dataSource from '../data-source.js';
import { seedAdmin } from './admin.seed.js';

const seedDataSource = new DataSource({
  ...dataSource.options,
  entities: [
    User,
    Company,
    Job,
    Application,
    ApplicationDocument,
    Notification,
    Report,
  ],
  migrationsRun: false,
  synchronize: false,
});

async function runAdminSeed(): Promise<void> {
  await seedDataSource.initialize();

  try {
    const result = await seedAdmin(seedDataSource, {
      name: process.env.ADMIN_SEED_NAME,
      email: process.env.ADMIN_SEED_EMAIL,
      password: process.env.ADMIN_SEED_PASSWORD,
    });

    if (result.status === 'created') {
      console.info(
        `Created the initial administrator (user ID ${result.userId}).`,
      );
    } else {
      console.info('An active administrator already exists; no changes made.');
    }
  } finally {
    await seedDataSource.destroy();
  }
}

void runAdminSeed().catch((error: unknown) => {
  console.error('Admin seed failed.', error);
  process.exitCode = 1;
});
