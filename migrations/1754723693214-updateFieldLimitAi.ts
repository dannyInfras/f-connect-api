import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateFieldLimitAi1754723693214 implements MigrationInterface {
    name = 'UpdateFieldLimitAi1754723693214';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv" 
            ALTER COLUMN "phone" TYPE text 
            USING phone::text
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "point" integer NOT NULL DEFAULT 5
        `);

        await queryRunner.query(`
            UPDATE "users" 
            SET "point" = 5 
            WHERE "point" IS NULL
        `);

        await queryRunner.query(`
  CREATE TABLE "cv_optimization_history" (
    "id" UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    "cv_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "job_title" VARCHAR(255),
    "job_description" TEXT,
    "suggestions" JSONB NOT NULL,
    "optimized_cv" JSONB NOT NULL,
    "is_applied" BOOLEAN DEFAULT false,
    "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "FK_cv_optimization_history_cv" 
      FOREIGN KEY ("cv_id") 
      REFERENCES "cv"("id") 
      ON DELETE CASCADE,
      
    CONSTRAINT "FK_cv_optimization_history_user" 
      FOREIGN KEY ("user_id") 
      REFERENCES "users"("id") 
      ON DELETE CASCADE
  );
`);

        await queryRunner.query(`
            CREATE INDEX "idx_cv_history_cv_id" 
            ON "cv_optimization_history" ("cv_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_cv_history_user_id" 
            ON "cv_optimization_history" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_cv_history_created_at" 
            ON "cv_optimization_history" ("created_at" DESC)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "cv" 
            ALTER COLUMN "phone" TYPE bigint 
            USING CASE 
                WHEN phone ~ '^[0-9]+$' THEN phone::bigint 
                ELSE NULL 
            END
        `);

        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "point"
        `);

        await queryRunner.query(
            `DROP INDEX IF EXISTS "idx_cv_history_created_at"`,
        );
        await queryRunner.query(
            `DROP INDEX IF EXISTS "idx_cv_history_user_id"`,
        );
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cv_history_cv_id"`);

        await queryRunner.query(
            `DROP TABLE IF EXISTS "cv_optimization_history"`,
        );
    }
}
