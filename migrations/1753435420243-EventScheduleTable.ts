import { MigrationInterface, QueryRunner } from 'typeorm';

export class EventScheduleTable1753435420243 implements MigrationInterface {
    name = 'EventScheduleTable1753435420243';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."schedule_events_type_enum" AS ENUM('interview', 'meeting')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."schedule_events_status_enum" AS ENUM('pending', 'confirmed', 'cancelled')`,
        );
        await queryRunner.query(
            `CREATE TABLE "schedule_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "company_id" bigint NOT NULL, "created_by" integer NOT NULL, "title" character varying(120) NOT NULL, "type" "public"."schedule_events_type_enum" NOT NULL, "status" "public"."schedule_events_status_enum" NOT NULL DEFAULT 'pending', "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "location" character varying(120), "notes" text, "version" integer NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "deleted_at" TIMESTAMP, CONSTRAINT "valid_time_range" CHECK (ends_at > starts_at), CONSTRAINT "PK_c14624cf0aa0f238ace86e789aa" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."schedule_participants_role_enum" AS ENUM('candidate', 'interviewer', 'attendee', 'host')`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."schedule_participants_response_enum" AS ENUM('pending', 'accepted', 'declined')`,
        );
        await queryRunner.query(
            `CREATE TABLE "schedule_participants" ("event_id" uuid NOT NULL, "user_id" integer NOT NULL, "role" "public"."schedule_participants_role_enum" NOT NULL, "response" "public"."schedule_participants_response_enum" NOT NULL DEFAULT 'pending', CONSTRAINT "PK_ba744211e5e46f07ac094412074" PRIMARY KEY ("event_id", "user_id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" ADD CONSTRAINT "FK_672fafb18ba1011508888757d7c" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" ADD CONSTRAINT "FK_5e8b6ec97ebeeaa8ebe8fd2110d" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_participants" ADD CONSTRAINT "FK_b020d73384ab7a41d6bb896c4ea" FOREIGN KEY ("event_id") REFERENCES "schedule_events"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_participants" ADD CONSTRAINT "FK_9fe550be7461048662adf022f59" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "schedule_participants" DROP CONSTRAINT "FK_9fe550be7461048662adf022f59"`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_participants" DROP CONSTRAINT "FK_b020d73384ab7a41d6bb896c4ea"`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" DROP CONSTRAINT "FK_5e8b6ec97ebeeaa8ebe8fd2110d"`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" DROP CONSTRAINT "FK_672fafb18ba1011508888757d7c"`,
        );
        await queryRunner.query(`DROP TABLE "schedule_participants"`);
        await queryRunner.query(
            `DROP TYPE "public"."schedule_participants_response_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."schedule_participants_role_enum"`,
        );
        await queryRunner.query(`DROP TABLE "schedule_events"`);
        await queryRunner.query(
            `DROP TYPE "public"."schedule_events_status_enum"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."schedule_events_type_enum"`,
        );
    }
}
