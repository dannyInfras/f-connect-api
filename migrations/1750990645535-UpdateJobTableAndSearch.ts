import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateJobTableAndSearch1750990645535 implements MigrationInterface {
    name = 'UpdateJobTableAndSearch1750990645535'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "job" ADD COLUMN IF NOT EXISTS "priority_position" integer DEFAULT 3
        `);
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS job_tsv_update_trigger ON "job"
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_job_tsv()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.tsv := 
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await queryRunner.query(`
            CREATE TRIGGER job_tsv_update_trigger
            BEFORE INSERT OR UPDATE ON "job"
            FOR EACH ROW EXECUTE FUNCTION update_job_tsv();
        `);
        await queryRunner.query(`
            UPDATE "job" SET 
              tsv = setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
                    setweight(to_tsvector('english', COALESCE(description, '')), 'B')
        `);
        await queryRunner.query(`
            ALTER TABLE "job" 
            ALTER COLUMN "responsibility" DROP NOT NULL,
            ALTER COLUMN "jobFitAttributes" DROP NOT NULL,
            ALTER COLUMN "niceToHave" DROP NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "job" 
            DROP COLUMN IF EXISTS "responsibility",
            DROP COLUMN IF EXISTS "jobFitAttributes",
            DROP COLUMN IF EXISTS "niceToHave"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "job" 
            ADD COLUMN IF NOT EXISTS "responsibility" text[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS "jobFitAttributes" text[] DEFAULT '{}',
            ADD COLUMN IF NOT EXISTS "niceToHave" text[] DEFAULT '{}'
        `);
        await queryRunner.query(`
            ALTER TABLE "job" 
            ALTER COLUMN "responsibility" SET NOT NULL,
            ALTER COLUMN "jobFitAttributes" SET NOT NULL,
            ALTER COLUMN "niceToHave" SET NOT NULL
        `);
        await queryRunner.query(`
            ALTER TABLE "job" DROP COLUMN IF EXISTS "priority_position"
        `);
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS job_tsv_update_trigger ON "job"
        `);
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_job_tsv()
            RETURNS TRIGGER AS $$
            BEGIN
              NEW.tsv := 
                setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
                setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
                setweight(to_tsvector('english', COALESCE(array_to_string(NEW.responsibility, ' '), '')), 'C');
              RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await queryRunner.query(`
            CREATE TRIGGER job_tsv_update_trigger
            BEFORE INSERT OR UPDATE ON "job"
            FOR EACH ROW EXECUTE FUNCTION update_job_tsv();
        `);
    }
}
