import { MigrationInterface, QueryRunner } from 'typeorm';

export class FullTable1745467045399 implements MigrationInterface {
    name = 'FullTable1745467045399';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // ROLES
        // await queryRunner.query(`
        //     CREATE TABLE "roles" (
        //         "id" BIGSERIAL PRIMARY KEY,
        //         "name" VARCHAR(255) NOT NULL UNIQUE
        //     )
        // `);

        // SKILL
        await queryRunner.query(`
            CREATE TABLE "skill" (
                "id" BIGSERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL UNIQUE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // CATEGORY
        await queryRunner.query(`
            CREATE TABLE "category" (
                "id" BIGSERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL UNIQUE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // USERS
        await queryRunner.query(
            `CREATE TABLE "users" ("id" SERIAL NOT NULL,
            "full_name" VARCHAR(100) NOT NULL,
            "password" VARCHAR(100) NOT NULL,
            "username" VARCHAR(30) NOT NULL,
            "roles" text NOT NULL,
            "is_verified" boolean NOT NULL DEFAULT true,
            "email" VARCHAR(50) NOT NULL,
            "phone" VARCHAR(12),
            "created_at" TIMESTAMP DEFAULT now(),
            "updated_at" TIMESTAMP DEFAULT now(),
            CONSTRAINT "username" UNIQUE ("username"),
            CONSTRAINT "email" UNIQUE ("email"),
            CONSTRAINT "phone" UNIQUE ("phone"),
            CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
        );

        // CANDIDATE_PROFILE
        await queryRunner.query(`
            CREATE TABLE "candidate_profile" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL UNIQUE,
                "description" TEXT,
                "education" TEXT,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_candidate_profile_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // CANDIDATE_SKILL
        await queryRunner.query(`
            CREATE TABLE "candidate_skill" (
                "id" BIGSERIAL PRIMARY KEY,
                "candidate_profile_id" BIGINT NOT NULL,
                "skill_id" BIGINT NOT NULL,
                "proficiency_level" VARCHAR(50),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE ("candidate_profile_id", "skill_id"),
                CONSTRAINT "fk_candidate_skill_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_candidate_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION
            )
        `);

        // COMPANY
        await queryRunner.query(`
            CREATE TABLE "company" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL UNIQUE,
                "company_name" VARCHAR(255) NOT NULL,
                "tax_code" VARCHAR(255) NOT NULL UNIQUE,
                "industry" VARCHAR(100),
                "description" TEXT,
                "logo_url" VARCHAR(255),
                "address" VARCHAR(255),
                "business_license_url" VARCHAR(255),
                "is_verified" BOOLEAN DEFAULT FALSE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_company_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // EXPERIENCE
        await queryRunner.query(`
            CREATE TABLE "experience" (
                "id" BIGSERIAL PRIMARY KEY,
                "candidate_profile_id" BIGINT NOT NULL,
                "company_id" BIGINT NOT NULL,
                "position" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "start_date" DATE NOT NULL,
                "end_date" DATE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_experience_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_experience_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION
            )
        `);

        // JOB
        await queryRunner.query(`
            CREATE TABLE "job" (
                "id" BIGSERIAL PRIMARY KEY,
                "category_id" BIGINT NOT NULL,
                "company_id" BIGINT NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "description" TEXT NOT NULL,
                "location" VARCHAR(255),
                "salary_min" DECIMAL(15,2),
                "salary_max" DECIMAL(15,2),
                "experience_years" INTEGER,
                "status" VARCHAR(10) DEFAULT 'OPEN' CHECK ("status" IN ('OPEN', 'CLOSED')),
                "is_vip" BOOLEAN DEFAULT FALSE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_job_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_job_category_id" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION
            )
        `);

        // JOB_SKILL
        await queryRunner.query(`
            CREATE TABLE "job_skill" (
                "job_id" BIGINT NOT NULL,
                "skill_id" BIGINT NOT NULL,
                PRIMARY KEY ("job_id", "skill_id"),
                CONSTRAINT "fk_job_skill_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_job_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION
            )
        `);

        // CV
        await queryRunner.query(`
            CREATE TABLE "cv" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "content" TEXT NOT NULL,
                "pdf_url" VARCHAR(255),
                "share_link" VARCHAR(255),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_cv_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // CV_SKILL
        await queryRunner.query(`
            CREATE TABLE "cv_skill" (
                "cv_id" BIGINT NOT NULL,
                "skill_id" BIGINT NOT NULL,
                "proficiency_level" VARCHAR(20) DEFAULT 'BEGINNER' CHECK ("proficiency_level" IN ('BEGINNER', 'INTERMEDIATE', 'ADVANCED')),
                PRIMARY KEY ("cv_id", "skill_id"),
                CONSTRAINT "fk_cv_skill_cv_id" FOREIGN KEY ("cv_id") REFERENCES "cv"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_cv_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION
            )
        `);

        // JOB_APPLICATION
        await queryRunner.query(`
            CREATE TABLE "job_application" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL,
                "job_id" BIGINT NOT NULL,
                "cv_id" BIGINT,
                "status" VARCHAR(20) DEFAULT 'APPLIED' CHECK ("status" IN ('APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED')),
                "applied_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_job_application_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_job_application_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_job_application_cv_id" FOREIGN KEY ("cv_id") REFERENCES "cv"("id") ON DELETE NO ACTION
            )
        `);

        // CANDIDATE_BOOKMARK
        await queryRunner.query(`
            CREATE TABLE "candidate_bookmark" (
                "id" BIGSERIAL PRIMARY KEY,
                "company_id" BIGINT NOT NULL,
                "candidate_profile_id" BIGINT NOT NULL,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE ("company_id", "candidate_profile_id"),
                CONSTRAINT "fk_candidate_bookmark_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_candidate_bookmark_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE NO ACTION
            )
        `);

        // HIRED_CANDIDATE
        await queryRunner.query(`
            CREATE TABLE "hired_candidate" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL,
                "job_id" BIGINT NOT NULL,
                "company_id" BIGINT NOT NULL,
                "position" VARCHAR(20),
                "hired_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "status" VARCHAR(20) DEFAULT 'ACTIVE' CHECK ("status" IN ('ACTIVE', 'LEFT')),
                CONSTRAINT "fk_hired_candidate_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_hired_candidate_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_hired_candidate_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION
            )
        `);

        // WORKSPACE
        await queryRunner.query(`
            CREATE TABLE "workspace" (
                "id" BIGSERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "privacy" VARCHAR(10) NOT NULL DEFAULT 'private' CHECK ("privacy" IN ('public', 'private')),
                "max_members" INTEGER DEFAULT 50,
                "image_url" VARCHAR(255),
                "category" VARCHAR(100),
                "status" VARCHAR(10) DEFAULT 'pending' CHECK ("status" IN ('active', 'ban', 'pending')),
                "invite_link" VARCHAR(255),
                "owner_id" BIGINT NOT NULL,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_workspace_owner_id" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // WORKSPACE_CHAT
        await queryRunner.query(`
            CREATE TABLE "workspace_chat" (
                "id" BIGSERIAL PRIMARY KEY,
                "workspace_id" BIGINT NOT NULL,
                "sender_id" BIGINT,
                "message" TEXT NOT NULL,
                "sent_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_workspace_chat_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_workspace_chat_sender_id" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // TASK
        await queryRunner.query(`
            CREATE TABLE "task" (
                "id" BIGSERIAL PRIMARY KEY,
                "workspace_id" BIGINT NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "status" VARCHAR(20) DEFAULT 'TODO' CHECK ("status" IN ('TODO', 'IN_PROGRESS', 'DONE')),
                "due_date" DATE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_task_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION
            )
        `);

        // BACKGROUND
        await queryRunner.query(`
            CREATE TABLE "background" (
                "id" BIGSERIAL PRIMARY KEY,
                "workspace_id" BIGINT NOT NULL,
                "user_create_id" BIGINT NOT NULL,
                "category_id" BIGINT NOT NULL,
                "path" VARCHAR(255) NOT NULL,
                "title" VARCHAR(100),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_background_user_create_id" FOREIGN KEY ("user_create_id") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_background_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION
            )
        `);

        // MUSIC
        await queryRunner.query(`
            CREATE TABLE "music" (
                "id" BIGSERIAL PRIMARY KEY,
                "workspace_id" BIGINT NOT NULL,
                "user_create_id" BIGINT NOT NULL,
                "category_id" BIGINT NOT NULL,
                "path" VARCHAR(255) NOT NULL,
                "title" VARCHAR(100),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_music_user_create_id" FOREIGN KEY ("user_create_id") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_music_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION
            )
        `);

        // CALENDAR
        await queryRunner.query(`
            CREATE TABLE "calendar" (
                "id" BIGSERIAL PRIMARY KEY,
                "workspace_id" BIGINT NOT NULL,
                "title" VARCHAR(255) NOT NULL,
                "start_time" TIMESTAMP NOT NULL,
                "end_time" TIMESTAMP,
                "description" TEXT,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_calendar_workspace_id" FOREIGN KEY ("workspace_id") REFERENCES "workspace"("id") ON DELETE NO ACTION
            )
        `);

        // PACKAGE
        await queryRunner.query(`
            CREATE TABLE "package" (
                "id" BIGSERIAL PRIMARY KEY,
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "price" DECIMAL(10,2) NOT NULL,
                "duration_days" INTEGER NOT NULL,
                "type" VARCHAR(20) NOT NULL CHECK ("type" IN ('USER_VIP', 'COMPANY_VIP')),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // COUPON
        await queryRunner.query(`
            CREATE TABLE "coupon" (
                "id" BIGSERIAL PRIMARY KEY,
                "code" VARCHAR(50) NOT NULL UNIQUE,
                "discount_percentage" DECIMAL(5,2) NOT NULL,
                "valid_until" DATE NOT NULL,
                "is_active" BOOLEAN DEFAULT TRUE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // PAYMENT
        await queryRunner.query(`
            CREATE TABLE "payment" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT NOT NULL,
                "package_id" BIGINT NOT NULL,
                "coupon_id" BIGINT,
                "amount" DECIMAL(10,2) NOT NULL,
                "payment_method" VARCHAR(10) NOT NULL CHECK ("payment_method" IN ('VISA', 'MOMO', 'VNPAY', 'PAYOS')),
                "status" VARCHAR(20) DEFAULT 'PENDING' CHECK ("status" IN ('PENDING', 'SUCCESS', 'FAILED')),
                "transaction_id" VARCHAR(100),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_payment_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_payment_package_id" FOREIGN KEY ("package_id") REFERENCES "package"("id") ON DELETE NO ACTION,
                CONSTRAINT "fk_payment_coupon_id" FOREIGN KEY ("coupon_id") REFERENCES "coupon"("id") ON DELETE NO ACTION
            )
        `);

        // NOTIFICATION
        await queryRunner.query(`
            CREATE TABLE "notification" (
                "id" BIGSERIAL PRIMARY KEY,
                "user_id" BIGINT,
                "title" VARCHAR(255) NOT NULL,
                "content" TEXT NOT NULL,
                "is_read" BOOLEAN DEFAULT FALSE,
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                CONSTRAINT "fk_notification_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop tables in reverse order to avoid foreign key constraint issues
        await queryRunner.query(`DROP TABLE "notification"`);
        await queryRunner.query(`DROP TABLE "payment"`);
        await queryRunner.query(`DROP TABLE "coupon"`);
        await queryRunner.query(`DROP TABLE "package"`);
        await queryRunner.query(`DROP TABLE "calendar"`);
        await queryRunner.query(`DROP TABLE "music"`);
        await queryRunner.query(`DROP TABLE "background"`);
        await queryRunner.query(`DROP TABLE "task"`);
        await queryRunner.query(`DROP TABLE "workspace_chat"`);
        await queryRunner.query(`DROP TABLE "workspace"`);
        await queryRunner.query(`DROP TABLE "hired_candidate"`);
        await queryRunner.query(`DROP TABLE "candidate_bookmark"`);
        await queryRunner.query(`DROP TABLE "job_application"`);
        await queryRunner.query(`DROP TABLE "cv_skill"`);
        await queryRunner.query(`DROP TABLE "cv"`);
        await queryRunner.query(`DROP TABLE "job_skill"`);
        await queryRunner.query(`DROP TABLE "job"`);
        await queryRunner.query(`DROP TABLE "experience"`);
        await queryRunner.query(`DROP TABLE "company"`);
        await queryRunner.query(`DROP TABLE "candidate_skill"`);
        await queryRunner.query(`DROP TABLE "candidate_profile"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TABLE "category"`);
        await queryRunner.query(`DROP TABLE "skill"`);
        // await queryRunner.query(`DROP TABLE "roles"`);
    }
}
