import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateBookmarkJobTable1755419200000 implements MigrationInterface {
    name = 'CreateBookmarkJobTable1755419200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create bookmark_job table
        await queryRunner.query(`
            CREATE TABLE "bookmark_job" (
                "id" SERIAL NOT NULL,
                "user_id" integer NOT NULL,
                "job_id" bigint NOT NULL,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "user_job_bookmark" UNIQUE ("user_id", "job_id"),
                CONSTRAINT "PK_bookmark_job" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "bookmark_job" 
            ADD CONSTRAINT "FK_bookmark_user" 
            FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "bookmark_job" 
            ADD CONSTRAINT "FK_bookmark_job" 
            FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE
        `);

        // Add indexes for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_bookmark_user_id" ON "bookmark_job" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_bookmark_job_id" ON "bookmark_job" ("job_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmark_job_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_bookmark_user_id"`);

        // Drop foreign key constraints
        await queryRunner.query(
            `ALTER TABLE "bookmark_job" DROP CONSTRAINT "FK_bookmark_job"`,
        );
        await queryRunner.query(
            `ALTER TABLE "bookmark_job" DROP CONSTRAINT "FK_bookmark_user"`,
        );

        // Drop table
        await queryRunner.query(`DROP TABLE "bookmark_job"`);
    }
}
