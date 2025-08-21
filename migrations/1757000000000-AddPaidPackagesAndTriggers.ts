import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPaidPackagesAndTriggers1757000000000
    implements MigrationInterface
{
    name = 'AddPaidPackagesAndTriggers1757000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add top_job_expired to job table
        await queryRunner.query(
            `ALTER TABLE "job" ADD "top_job_expired" TIMESTAMP NULL`,
        );

        // 2. Add paid package fields to company table
        await queryRunner.query(
            `ALTER TABLE "company" ADD "priority_position" integer NOT NULL DEFAULT 3`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "vip_expired" TIMESTAMP NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "top_company" integer DEFAULT 0`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "top_job_expired" TIMESTAMP NULL`,
        );

        // 3. Create functions and triggers for job top_job expiration
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_top_job_on_expiration()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (NEW.top_job_expired IS NOT NULL AND NOW() > NEW.top_job_expired) THEN
          NEW.top_job := 0;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await queryRunner.query(`
      DROP TRIGGER IF EXISTS top_job_expired_check_trigger ON job;
      CREATE TRIGGER top_job_expired_check_trigger
      BEFORE INSERT OR UPDATE ON job
      FOR EACH ROW
      EXECUTE FUNCTION update_top_job_on_expiration();
    `);

        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION daily_check_top_job_expired()
      RETURNS void AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        UPDATE job
        SET top_job = 0
        WHERE top_job_expired IS NOT NULL
          AND top_job_expired < NOW()
          AND top_job <> 0;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Reset top_job to 0 for % jobs with expired top_job_expired', affected_rows;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // 4. Create functions and triggers for company VIP expiration
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_company_priority_on_vip_expired()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (NEW.vip_expired IS NOT NULL AND NOW() > NEW.vip_expired) THEN
          NEW.priority_position := 3;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await queryRunner.query(`
      DROP TRIGGER IF EXISTS company_vip_expired_check_trigger ON company;
      CREATE TRIGGER company_vip_expired_check_trigger
      BEFORE INSERT OR UPDATE ON company
      FOR EACH ROW
      EXECUTE FUNCTION update_company_priority_on_vip_expired();
    `);

        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION daily_check_company_vip_expired()
      RETURNS void AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        UPDATE company
        SET priority_position = 3
        WHERE vip_expired IS NOT NULL
          AND vip_expired < NOW()
          AND priority_position <> 3;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Reset priority_position to 3 for % companies with expired VIP', affected_rows;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // 5. Create functions and triggers for company top_company expiration
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_company_top_on_expired()
      RETURNS TRIGGER AS $$
      BEGIN
        IF (NEW.top_job_expired IS NOT NULL AND NOW() > NEW.top_job_expired) THEN
          NEW.top_company := 0;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        await queryRunner.query(`
      DROP TRIGGER IF EXISTS company_top_expired_check_trigger ON company;
      CREATE TRIGGER company_top_expired_check_trigger
      BEFORE INSERT OR UPDATE ON company
      FOR EACH ROW
      EXECUTE FUNCTION update_company_top_on_expired();
    `);

        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION daily_check_company_top_expired()
      RETURNS void AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        UPDATE company
        SET top_company = 0
        WHERE top_job_expired IS NOT NULL
          AND top_job_expired < NOW()
          AND top_company <> 0;

        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Reset top_company to 0 for % companies with expired Top Company', affected_rows;
      END;
      $$ LANGUAGE plpgsql;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all triggers first
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS top_job_expired_check_trigger ON job;
    `);
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS company_vip_expired_check_trigger ON company;
    `);
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS company_top_expired_check_trigger ON company;
    `);

        // Drop all functions
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_top_job_on_expiration();
    `);
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS daily_check_top_job_expired();
    `);
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_company_priority_on_vip_expired();
    `);
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS daily_check_company_vip_expired();
    `);
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_company_top_on_expired();
    `);
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS daily_check_company_top_expired();
    `);

        // Drop columns from company table
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "top_job_expired"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "top_company"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "vip_expired"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "priority_position"`,
        );

        // Drop columns from job table
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN "top_job_expired"`,
        );
    }
}
