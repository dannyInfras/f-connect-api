import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateCvTable1748537198629 implements MigrationInterface {
    name = 'UpdateCvTable1748537198629';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing constraints if they exist
        await queryRunner.query(
            `ALTER TABLE "cv" DROP CONSTRAINT IF EXISTS "cv_pkey" CASCADE`,
        );
        await queryRunner.query(
            `ALTER TABLE "cv" DROP CONSTRAINT IF EXISTS "fk_cv_user_id" CASCADE`,
        );

        // Create new CV table with UUID and JSON columns
        await queryRunner.query(`
            CREATE TABLE "cv_new" (
                "id" UUID DEFAULT uuid_generate_v4(),
                "title" VARCHAR(255) NOT NULL,
                "summary" TEXT,
                "experience" JSONB DEFAULT '[]'::jsonb,
                "education" JSONB DEFAULT '[]'::jsonb,
                "skills" TEXT,
                "certifications" JSONB DEFAULT '[]'::jsonb,
                "languages" TEXT,
                "templateId" INTEGER,
                "user_id" INTEGER NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                PRIMARY KEY ("id")
            )
        `);

        // Copy existing data if the cv table exists
        await queryRunner.query(`
            INSERT INTO "cv_new" ("title", "user_id")
            SELECT "title", "user_id"::INTEGER
            FROM "cv"
            WHERE EXISTS (SELECT 1 FROM "cv")
        `);

        // Drop the old table and rename the new one
        await queryRunner.query(`DROP TABLE IF EXISTS "cv"`);
        await queryRunner.query(`ALTER TABLE "cv_new" RENAME TO "cv"`);

        // Add foreign key constraint for user
        await queryRunner.query(`
            ALTER TABLE "cv"
            ADD CONSTRAINT "FK_user_cv"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE CASCADE
        `);

        // Add indexes for better performance on JSONB columns
        await queryRunner.query(
            `CREATE INDEX "idx_cv_experience" ON "cv" USING gin ("experience")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_cv_education" ON "cv" USING gin ("education")`,
        );
        await queryRunner.query(
            `CREATE INDEX "idx_cv_certifications" ON "cv" USING gin ("certifications")`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cv_experience"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cv_education"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "idx_cv_certifications"`);

        // Remove the foreign key constraint
        await queryRunner.query(
            `ALTER TABLE "cv" DROP CONSTRAINT IF EXISTS "FK_user_cv"`,
        );

        // Create a temporary table with the basic structure
        await queryRunner.query(`
            CREATE TABLE "cv_old" (
                "id" SERIAL PRIMARY KEY,
                "user_id" INTEGER NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Copy basic data if the cv table exists
        await queryRunner.query(`
            INSERT INTO "cv_old" ("title", "user_id", "createdAt", "updatedAt")
            SELECT "title", "user_id", "createdAt", "updatedAt"
            FROM "cv"
            WHERE EXISTS (SELECT 1 FROM "cv")
        `);

        // Drop the current table and rename the old one
        await queryRunner.query(`DROP TABLE IF EXISTS "cv"`);
        await queryRunner.query(`ALTER TABLE "cv_old" RENAME TO "cv"`);

        // Add back the foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "cv"
            ADD CONSTRAINT "fk_cv_user_id"
            FOREIGN KEY ("user_id")
            REFERENCES "users"("id")
            ON DELETE NO ACTION
        `);
    }
}
