import type { QueryRunner } from 'typeorm';
import { AdminModerationAndReports20261116100000 } from './20261116100000-AdminModerationAndReports.js';

describe('AdminModerationAndReports migration rollback', () => {
  it('restores only job statuses recorded by the migration', async () => {
    const queryRunner = {
      query: vi.fn(async (sql: string) => {
        if (sql.includes("TABLE_NAME = 'ADMIN_MIGRATION_JOB_STATUS'")) {
          return [{ COUNT: 1 }];
        }
        if (sql.includes("TABLE_NAME = 'REPORTS'")) {
          return [{ COUNT: 1 }];
        }
        if (sql.includes('SELECT COUNT(*) AS COUNT FROM REPORTS')) {
          return [{ COUNT: 0 }];
        }
        if (sql.includes("INDEX_NAME = 'IX_REPORTS_STATUS'")) {
          return [{ COUNT: 1 }];
        }
        return [];
      }),
    };

    await new AdminModerationAndReports20261116100000().down(
      queryRunner as unknown as QueryRunner,
    );

    const jobStatusUpdate = queryRunner.query.mock.calls.find(([sql]) =>
      sql.includes('UPDATE JOBS'),
    )?.[0];
    const normalizedUpdate = jobStatusUpdate?.replace(/\s+/g, ' ');
    expect(normalizedUpdate).toContain(
      'WHERE ID IN ( SELECT JOB_ID FROM ADMIN_MIGRATION_JOB_STATUS )',
    );
    expect(normalizedUpdate).not.toContain("WHERE STATUS = 'APPROVED'");
  });

  it('refuses rollback when the original status backup is missing', async () => {
    const queryRunner = {
      query: vi.fn().mockResolvedValue([{ COUNT: 0 }]),
    };

    await expect(
      new AdminModerationAndReports20261116100000().down(
        queryRunner as unknown as QueryRunner,
      ),
    ).rejects.toThrow('original-status backup is missing');
    expect(queryRunner.query).toHaveBeenCalledTimes(1);
  });
});
