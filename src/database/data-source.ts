import { DataSource } from 'typeorm';
import { AdminModerationAndReports20261116100000 } from './migrations/20261116100000-AdminModerationAndReports.js';
import { ApplicationDocumentsAndLifecycle20261118100000 } from './migrations/20261118100000-ApplicationDocumentsAndLifecycle.js';
import { JobApplicationRequirements20261125100000 } from './migrations/20261125100000-JobApplicationRequirements.js';

function requiredEnvironmentValue(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required database environment variable: ${name}`);
  }
  return value;
}

const port = Number(process.env.DB_PORT ?? 1521);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('DB_PORT must be a valid port number.');
}

export default new DataSource({
  type: 'oracle',
  host: requiredEnvironmentValue('DB_HOST'),
  port,
  serviceName: requiredEnvironmentValue('DB_SERVICE_NAME'),
  username: requiredEnvironmentValue('DB_USERNAME'),
  password: requiredEnvironmentValue('DB_PASSWORD'),
  entities: [],
  migrations: [
    AdminModerationAndReports20261116100000,
    ApplicationDocumentsAndLifecycle20261118100000,
    JobApplicationRequirements20261125100000,
  ],
  migrationsRun: false,
  synchronize: false,
});
