import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobStatusOnDeadlinePassed1751400000000
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create function to check and update expired job statuses
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_job_status_on_deadline_passed()
      RETURNS TRIGGER AS $$
      BEGIN
        -- Check if current time is past the deadline and status is still OPEN
        IF (NOW() > NEW.deadline AND NEW.status = 'OPEN') THEN
          NEW.status := 'CLOSED';
        END IF;
        
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // Create trigger that runs before an INSERT or UPDATE on the job table
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS job_deadline_check_trigger ON job;
      
      CREATE TRIGGER job_deadline_check_trigger
      BEFORE INSERT OR UPDATE ON job
      FOR EACH ROW
      EXECUTE FUNCTION update_job_status_on_deadline_passed();
    `);

        // Create function to automatically update all jobs daily
        await queryRunner.query(`
      CREATE OR REPLACE FUNCTION daily_check_job_deadlines()
      RETURNS void AS $$
      DECLARE
        affected_rows INTEGER;
      BEGIN
        -- Update status to CLOSED for all jobs where deadline has passed
        -- No need to disable/enable triggers as we'll handle the one-time update separately
        UPDATE job
        SET status = 'CLOSED'
        WHERE deadline < NOW() 
        AND status = 'OPEN';
        
        GET DIAGNOSTICS affected_rows = ROW_COUNT;
        RAISE NOTICE 'Updated % jobs to CLOSED status', affected_rows;
      END;
      $$ LANGUAGE plpgsql;
    `);

        // Update existing jobs that have expired deadlines
        await queryRunner.query(`
      UPDATE job
      SET status = 'CLOSED'
      WHERE deadline < NOW() 
      AND status = 'OPEN';
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove the trigger
        await queryRunner.query(`
      DROP TRIGGER IF EXISTS job_deadline_check_trigger ON job;
    `);

        // Remove the function
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS update_job_status_on_deadline_passed();
    `);

        // Remove the daily check function
        await queryRunner.query(`
      DROP FUNCTION IF EXISTS daily_check_job_deadlines();
    `);
    }
}
