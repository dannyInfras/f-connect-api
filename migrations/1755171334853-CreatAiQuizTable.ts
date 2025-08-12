import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatAiQuizTable1755171334853 implements MigrationInterface {
    name = 'CreatAiQuizTable1755171334853';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enum types
        await queryRunner.query(`
            CREATE TYPE "public"."quizzes_status_enum" AS ENUM('draft', 'published', 'archived')
        `);

        await queryRunner.query(`
            CREATE TYPE "public"."quiz_attempts_status_enum" AS ENUM('in-progress', 'completed', 'abandoned')
        `);

        // Create quizzes table
        await queryRunner.query(`
            CREATE TABLE "quizzes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "roadmap_id" character varying NOT NULL,
                "user_id" integer NOT NULL,
                "title" character varying(255) NOT NULL,
                "description" text,
                "questions" jsonb NOT NULL,
                "total_questions" integer NOT NULL DEFAULT '50',
                "passing_score" integer NOT NULL DEFAULT '80',
                "time_limit" integer NOT NULL DEFAULT '60',
                "status" "public"."quizzes_status_enum" NOT NULL DEFAULT 'published',
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quizzes" PRIMARY KEY ("id")
            )
        `);

        // Create quiz_attempts table with attempt_number and quiz_snapshot fields
        await queryRunner.query(`
            CREATE TABLE "quiz_attempts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "quiz_id" uuid NOT NULL,
                "user_id" integer NOT NULL,
                "roadmap_id" character varying NOT NULL,
                "answers" jsonb NOT NULL DEFAULT '[]',
                "quiz_snapshot" jsonb,
                "score" double precision,
                "percentage" double precision,
                "passed" boolean NOT NULL DEFAULT false,
                "started_at" TIMESTAMP NOT NULL,
                "completed_at" TIMESTAMP,
                "time_spent" integer,
                "status" "public"."quiz_attempts_status_enum" NOT NULL DEFAULT 'in-progress',
                "feedback" jsonb,
                "attempt_number" integer NOT NULL DEFAULT '1',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_quiz_attempts" PRIMARY KEY ("id")
            )
        `);

        // Create indexes for better query performance
        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_roadmap_id" ON "quizzes" ("roadmap_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_user_id" ON "quizzes" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_status" ON "quizzes" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_attempt_user_id" ON "quiz_attempts" ("user_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_attempt_roadmap_id" ON "quiz_attempts" ("roadmap_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_attempt_quiz_id" ON "quiz_attempts" ("quiz_id")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_attempt_status" ON "quiz_attempts" ("status")
        `);

        // Create composite index for finding user attempts on a quiz
        await queryRunner.query(`
            CREATE INDEX "IDX_quiz_attempt_quiz_user" ON "quiz_attempts" ("quiz_id", "user_id")
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" 
            ADD CONSTRAINT "FK_quiz_attempt_quiz" 
            FOREIGN KEY ("quiz_id") 
            REFERENCES "quizzes"("id") 
            ON DELETE CASCADE 
            ON UPDATE NO ACTION
        `);

        // Add check constraint for attempt_number (max 3 attempts)
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts"
            ADD CONSTRAINT "CHK_attempt_number" 
            CHECK ("attempt_number" >= 1 AND "attempt_number" <= 3)
        `);

        // Add check constraint for passing_score
        await queryRunner.query(`
            ALTER TABLE "quizzes"
            ADD CONSTRAINT "CHK_passing_score" 
            CHECK ("passing_score" >= 0 AND "passing_score" <= 100)
        `);

        // Add check constraint for percentage
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts"
            ADD CONSTRAINT "CHK_percentage" 
            CHECK ("percentage" IS NULL OR ("percentage" >= 0 AND "percentage" <= 100))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop check constraints
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "CHK_percentage"
        `);

        await queryRunner.query(`
            ALTER TABLE "quizzes" DROP CONSTRAINT IF EXISTS "CHK_passing_score"
        `);

        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" DROP CONSTRAINT IF EXISTS "CHK_attempt_number"
        `);

        // Drop foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "quiz_attempts" DROP CONSTRAINT "FK_quiz_attempt_quiz"
        `);

        // Drop indexes
        await queryRunner.query(
            `DROP INDEX "public"."IDX_quiz_attempt_quiz_user"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_quiz_attempt_status"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_quiz_attempt_quiz_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_quiz_attempt_roadmap_id"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_quiz_attempt_user_id"`,
        );
        await queryRunner.query(`DROP INDEX "public"."IDX_quiz_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quiz_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_quiz_roadmap_id"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "quiz_attempts"`);
        await queryRunner.query(`DROP TABLE "quizzes"`);

        // Drop enum types
        await queryRunner.query(
            `DROP TYPE "public"."quiz_attempts_status_enum"`,
        );
        await queryRunner.query(`DROP TYPE "public"."quizzes_status_enum"`);
    }
}
