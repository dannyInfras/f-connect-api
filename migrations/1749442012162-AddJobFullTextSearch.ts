import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddJobFullTextSearch1749442012162 implements MigrationInterface {
    name = 'AddJobFullTextSearch1749442012162';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add tsvector column for full-text search
        await queryRunner.query(`
      ALTER TABLE "job" 
      ADD COLUMN "tsv" tsvector
    `);

        // Create a function to update the tsvector column
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

        // Create trigger to automatically update tsvector on insert/update
        await queryRunner.query(`
      CREATE TRIGGER job_tsv_update_trigger
      BEFORE INSERT OR UPDATE ON "job"
      FOR EACH ROW EXECUTE FUNCTION update_job_tsv();
    `);

        // Update existing records
        await queryRunner.query(`
      UPDATE "job" SET 
        tsv = setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
              setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
              setweight(to_tsvector('english', COALESCE(array_to_string(responsibility, ' '), '')), 'C')
    `);

        // Create GIN index for performance
        await queryRunner.query(`
      CREATE INDEX job_tsv_gin_idx ON "job" USING GIN(tsv)
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index
        await queryRunner.query(`DROP INDEX IF EXISTS job_tsv_gin_idx`);

        // Drop the trigger
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS job_tsv_update_trigger ON "job"`,
        );

        // Drop the function
        await queryRunner.query(`DROP FUNCTION IF EXISTS update_job_tsv()`);

        // Drop the column
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN IF EXISTS "tsv"`,
        );
    }
}
