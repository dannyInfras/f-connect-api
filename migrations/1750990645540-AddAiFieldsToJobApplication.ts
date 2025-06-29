import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAiFieldsToJobApplication1750990645540
    implements MigrationInterface
{
    name = 'AddAiFieldsToJobApplication1750990645540';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add AI analysis fields to job_application table (no cv_url since cv_id contains URLs)
        await queryRunner.query(`
            ALTER TABLE "job_application" 
            ADD COLUMN "ai_score" integer,
            ADD COLUMN "ai_analysis" text,
            ADD COLUMN "ai_status" varchar(50) DEFAULT 'PENDING'
        `);

        // Add index for ai_status for efficient querying
        await queryRunner.query(`
            CREATE INDEX "IDX_job_application_ai_status" 
            ON "job_application" ("ai_status")
        `);

        // Add index for ai_score for efficient sorting/filtering
        await queryRunner.query(`
            CREATE INDEX "IDX_job_application_ai_score" 
            ON "job_application" ("ai_score")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX "IDX_job_application_ai_score"`);
        await queryRunner.query(`DROP INDEX "IDX_job_application_ai_status"`);

        // Remove AI fields
        await queryRunner.query(`
            ALTER TABLE "job_application" 
            DROP COLUMN "ai_status",
            DROP COLUMN "ai_analysis",
            DROP COLUMN "ai_score"
        `);
    }
}
