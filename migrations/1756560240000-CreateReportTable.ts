import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateReportTable1756560240000 implements MigrationInterface {
    name = 'CreateReportTable1756560240000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create report table
        await queryRunner.query(`
      CREATE TABLE "report" (
        "id" BIGSERIAL NOT NULL,
        "title" character varying(255) NOT NULL,
        "description" text NOT NULL,
        "status" character varying(50) NOT NULL DEFAULT 'PENDING',
        "user_id" integer NOT NULL,
        "job_id" bigint NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_report" PRIMARY KEY ("id")
      )
    `);

        // Add foreign key constraints
        await queryRunner.query(`
      ALTER TABLE "report"
      ADD CONSTRAINT "FK_report_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

        await queryRunner.query(`
      ALTER TABLE "report"
      ADD CONSTRAINT "FK_report_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);

        // Create indexes for better performance
        await queryRunner.query(`
      CREATE INDEX "IDX_report_user_id" ON "report" ("user_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_report_job_id" ON "report" ("job_id")
    `);

        await queryRunner.query(`
      CREATE INDEX "IDX_report_status" ON "report" ("status")
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_report_status"`);
        await queryRunner.query(`DROP INDEX "IDX_report_job_id"`);
        await queryRunner.query(`DROP INDEX "IDX_report_user_id"`);

        // Drop foreign key constraints
        await queryRunner.query(
            `ALTER TABLE "report" DROP CONSTRAINT "FK_report_job_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "report" DROP CONSTRAINT "FK_report_user_id"`,
        );

        // Drop table
        await queryRunner.query(`DROP TABLE "report"`);
    }
}
