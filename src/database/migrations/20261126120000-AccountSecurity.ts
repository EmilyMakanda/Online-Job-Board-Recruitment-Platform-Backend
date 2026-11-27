import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountSecurity20261126120000 implements MigrationInterface {
  name = 'AccountSecurity20261126120000';

  async up(queryRunner: QueryRunner): Promise<void> {
    await this.addColumnIfMissing(
      queryRunner,
      'PASSWORD_RESET_TOKEN_HASH',
      'VARCHAR2(64)',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'PASSWORD_RESET_TOKEN_EXPIRES_AT',
      'TIMESTAMP',
    );
    await this.addColumnIfMissing(
      queryRunner,
      'TOKEN_VERSION',
      'NUMBER(10) DEFAULT 0 NOT NULL',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await this.dropColumnIfPresent(queryRunner, 'TOKEN_VERSION');
    await this.dropColumnIfPresent(
      queryRunner,
      'PASSWORD_RESET_TOKEN_EXPIRES_AT',
    );
    await this.dropColumnIfPresent(
      queryRunner,
      'PASSWORD_RESET_TOKEN_HASH',
    );
  }

  private async addColumnIfMissing(
    queryRunner: QueryRunner,
    columnName: string,
    definition: string,
  ): Promise<void> {
    const [{ COUNT: count }] = await queryRunner.query(
      `SELECT COUNT(*) AS COUNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = '${columnName}'`,
    );
    if (Number(count) === 0) {
      await queryRunner.query(
        `ALTER TABLE USERS ADD (${columnName} ${definition})`,
      );
    }
  }

  private async dropColumnIfPresent(
    queryRunner: QueryRunner,
    columnName: string,
  ): Promise<void> {
    const [{ COUNT: count }] = await queryRunner.query(
      `SELECT COUNT(*) AS COUNT FROM USER_TAB_COLUMNS WHERE TABLE_NAME = 'USERS' AND COLUMN_NAME = '${columnName}'`,
    );
    if (Number(count) > 0) {
      await queryRunner.query(`ALTER TABLE USERS DROP COLUMN ${columnName}`);
    }
  }
}
