import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConsolidatedMigration1751300000000 implements MigrationInterface {
    name = 'ConsolidatedMigration1751300000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 1. Add URL field to CV table
        await queryRunner.query(
            `ALTER TABLE "cv" ADD "url" text`,
        );

        // 2. Add vip_expired field to Job table
        await queryRunner.query(
            `ALTER TABLE "job" ADD "vip_expired" TIMESTAMP`,
        );

        // 3. Remove is_vip field from Job table
        const hasColumn = await queryRunner.hasColumn('job', 'is_vip');
        if (hasColumn) {
            await queryRunner.query(`
                ALTER TABLE "job" DROP COLUMN "is_vip"
            `);
        }

        // 4. Drop any existing triggers that might cause recursion
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS check_vip_expiry_on_update ON "job";
        `);
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS check_vip_expiry_on_insert ON "job";
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_job_priority_on_vip_expiry() CASCADE;
        `);

        // 5. Create function to check if job can be modified (within 24 hours of creation)
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION check_job_modification_time()
            RETURNS TRIGGER AS $$
            BEGIN
                IF (OLD.created_at + interval '24 hours') < NOW() THEN
                    RAISE EXCEPTION 'Job can only be modified within 24 hours of creation';
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 6. Create trigger to enforce the 24-hour modification constraint
        await queryRunner.query(`
            CREATE TRIGGER enforce_job_modification_time
            BEFORE UPDATE ON "job"
            FOR EACH ROW
            EXECUTE FUNCTION check_job_modification_time();
        `);

        // 7. Create function that will run on each row update to check if vip has expired
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION update_job_priority_on_row_change()
            RETURNS TRIGGER AS $$
            BEGIN
                -- If vip_expired is in the past, set priority_position to 3
                IF NEW.vip_expired IS NOT NULL AND NEW.vip_expired < NOW() THEN
                    NEW.priority_position := 3;
                END IF;
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 8. Create trigger that runs on each row update/insert
        await queryRunner.query(`
            CREATE TRIGGER check_vip_on_row_change
            BEFORE INSERT OR UPDATE ON "job"
            FOR EACH ROW
            EXECUTE FUNCTION update_job_priority_on_row_change();
        `);

        // 9. Create a function for daily check of expired VIP jobs
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION daily_check_expired_vip_jobs()
            RETURNS void AS $$
            BEGIN
                UPDATE "job"
                SET priority_position = 3
                WHERE vip_expired IS NOT NULL
                AND vip_expired < NOW()
                AND priority_position != 3;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // 10. Try to set up pg_cron if available, but don't fail if it's not
        try {
            // Check if pg_cron is installed
            const pgCronExists = await queryRunner.query(`
                SELECT 1 FROM pg_extension WHERE extname = 'pg_cron';
            `);
            
            if (pgCronExists && pgCronExists.length > 0) {
                // pg_cron is available, set up the scheduled job
                await queryRunner.query(`
                    SELECT cron.schedule(
                        'daily-vip-expiry-check',
                        '* * * * *',  -- Run at midnight every day
                        'SELECT daily_check_expired_vip_jobs()'
                    );
                `);
            } else {
                // Log that pg_cron is not available
                console.log('pg_cron extension not available. Daily VIP expiry check will not be scheduled automatically.');
                console.log('You will need to set up a cron job in your application to call the daily_check_expired_vip_jobs() function daily.');
            }
        } catch (error) {
            // Just log the error and continue with the migration
            console.log('pg_cron extension not available. Daily VIP expiry check will not be scheduled automatically.');
            console.log('You will need to set up a cron job in your application to call the daily_check_expired_vip_jobs() function daily.');
        }

        // 11. Update any existing jobs with expired VIP to have priority 3
        await queryRunner.query(`
            UPDATE "job"
            SET priority_position = 3
            WHERE vip_expired IS NOT NULL
            AND vip_expired < NOW()
            AND priority_position != 3;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Try to remove the cron job if it exists
        try {
            const pgCronExists = await queryRunner.query(`
                SELECT 1 FROM pg_extension WHERE extname = 'pg_cron';
            `);
            
            if (pgCronExists && pgCronExists.length > 0) {
                await queryRunner.query(`
                    SELECT cron.unschedule('daily-vip-expiry-check');
                `);
            }
        } catch (error) {
            // Ignore errors if pg_cron doesn't exist
        }

        // Remove triggers and functions in reverse order
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS check_vip_on_row_change ON "job";
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS update_job_priority_on_row_change();
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS daily_check_expired_vip_jobs();
        `);
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS enforce_job_modification_time ON "job";
        `);
        await queryRunner.query(`
            DROP FUNCTION IF EXISTS check_job_modification_time();
        `);

        // Add is_vip column back
        await queryRunner.query(`
            ALTER TABLE "job" ADD "is_vip" BOOLEAN DEFAULT false
        `);

        // Remove vip_expired column
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN "vip_expired"`,
        );

        // Remove url column from cv table
        await queryRunner.query(
            `ALTER TABLE "cv" DROP COLUMN "url"`,
        );
    }
} 
