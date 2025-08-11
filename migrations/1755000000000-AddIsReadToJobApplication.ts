import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddIsReadToJobApplication1755000000000
    implements MigrationInterface
{
    name = 'AddIsReadToJobApplication1755000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "job_application"
      ADD COLUMN "is_read" boolean DEFAULT false
    `);
        await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_job_application_is_read"
      ON "job_application" ("is_read")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_job_application_is_read"`,
        );
        await queryRunner.query(`
      ALTER TABLE "job_application" 
      DROP COLUMN "is_read"
    `);
    }
}
