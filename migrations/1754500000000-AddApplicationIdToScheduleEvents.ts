import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddApplicationIdToScheduleEvents1754500000000
    implements MigrationInterface
{
    name = 'AddApplicationIdToScheduleEvents1754500000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "schedule_events" ADD "application_id" integer`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_schedule_events_application_id" ON "schedule_events" ("application_id")`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" ADD CONSTRAINT "FK_schedule_events_application" FOREIGN KEY ("application_id") REFERENCES "job_application"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "schedule_events" DROP CONSTRAINT "FK_schedule_events_application"`,
        );
        await queryRunner.query(
            `DROP INDEX "public"."IDX_schedule_events_application_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "schedule_events" DROP COLUMN "application_id"`,
        );
    }
}
