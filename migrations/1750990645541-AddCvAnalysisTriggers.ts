import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddCvAnalysisTriggers1750990645541 implements MigrationInterface {
    name = 'AddCvAnalysisTriggers1750990645541';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create trigger function for CV analysis notifications using cv_id
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_cv_analysis()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Only notify if the application has ai_status = 'PENDING_SCORE' and cv_id is a URL
                IF NEW.ai_status = 'PENDING_SCORE' AND NEW.cv_id IS NOT NULL AND NEW.cv_id LIKE 'http%' THEN
                    PERFORM pg_notify(
                        'cv_analysis_channel',
                        json_build_object(
                            'applicationId', NEW.id,
                            'jobId', NEW.job_id,
                            'cvUrl', NEW.cv_id
                        )::text
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger that fires after INSERT on job_application table
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_cv_analysis_notify ON job_application;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trigger_cv_analysis_notify
                AFTER INSERT ON job_application
                FOR EACH ROW
                EXECUTE FUNCTION notify_cv_analysis();
        `);

        // Create trigger function for UPDATE operations
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_cv_analysis_update()
            RETURNS TRIGGER AS $$
            BEGIN
                -- Only notify if ai_status changed to 'PENDING_SCORE' and cv_id is a URL
                IF OLD.ai_status != 'PENDING_SCORE' AND NEW.ai_status = 'PENDING_SCORE' 
                   AND NEW.cv_id IS NOT NULL AND NEW.cv_id LIKE 'http%' THEN
                    PERFORM pg_notify(
                        'cv_analysis_channel',
                        json_build_object(
                            'applicationId', NEW.id,
                            'jobId', NEW.job_id,
                            'cvUrl', NEW.cv_id
                        )::text
                    );
                END IF;
                
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);

        // Create trigger for UPDATE operations
        await queryRunner.query(`
            DROP TRIGGER IF EXISTS trigger_cv_analysis_notify_update ON job_application;
        `);

        await queryRunner.query(`
            CREATE TRIGGER trigger_cv_analysis_notify_update
                AFTER UPDATE ON job_application
                FOR EACH ROW
                EXECUTE FUNCTION notify_cv_analysis_update();
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop triggers
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS trigger_cv_analysis_notify_update ON job_application;`,
        );
        await queryRunner.query(
            `DROP TRIGGER IF EXISTS trigger_cv_analysis_notify ON job_application;`,
        );

        // Drop trigger functions
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS notify_cv_analysis_update();`,
        );
        await queryRunner.query(
            `DROP FUNCTION IF EXISTS notify_cv_analysis();`,
        );
    }
}
