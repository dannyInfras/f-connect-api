import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTableRoom1752845294883 implements MigrationInterface {
    name = 'CreateTableRoom1752845294883'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing tables if they exist
        await queryRunner.query(`DROP TABLE IF EXISTS "task" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workspace_chat" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "workspace" CASCADE`);
        
        // Create enum types if they don't exist
        await queryRunner.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_status_enum') THEN
                    CREATE TYPE task_status_enum AS ENUM ('TODO', 'IN_PROGRESS', 'REVIEW', 'DONE');
                END IF;
                
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'task_priority_enum') THEN
                    CREATE TYPE task_priority_enum AS ENUM ('low', 'medium', 'high');
                END IF;
            END
            $$;
        `);
        
        // Create task table
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "task" (
                "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
                "title" varchar(255) NOT NULL,
                "description" text,
                "status" task_status_enum NOT NULL DEFAULT 'TODO',
                "due_date" TIMESTAMP WITH TIME ZONE,
                "reminder_time" TIMESTAMP WITH TIME ZONE,
                "tags" text[] DEFAULT '{}',
                "checklist" jsonb,
                "recurring" jsonb,
                "estimated_time" integer,
                "priority" task_priority_enum NOT NULL DEFAULT 'medium',
                "progress" integer,
                "user_id" integer NOT NULL,
                "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
                CONSTRAINT "fk_task_user" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE
            );
        `);
        
        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "idx_task_user_id" ON "task" ("user_id");
            CREATE INDEX IF NOT EXISTS "idx_task_status" ON "task" ("status");
            CREATE INDEX IF NOT EXISTS "idx_task_due_date" ON "task" ("due_date");
            CREATE INDEX IF NOT EXISTS "idx_task_reminder_time" ON "task" ("reminder_time");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`
            DROP INDEX IF EXISTS "idx_task_reminder_time";
            DROP INDEX IF EXISTS "idx_task_due_date";
            DROP INDEX IF EXISTS "idx_task_status";
            DROP INDEX IF EXISTS "idx_task_user_id";
        `);
        
        // Drop task table
        await queryRunner.query(`DROP TABLE IF EXISTS "task" CASCADE`);
        
        // Drop enum types
        await queryRunner.query(`
            DROP TYPE IF EXISTS task_priority_enum;
            DROP TYPE IF EXISTS task_status_enum;
        `);
    }
}
