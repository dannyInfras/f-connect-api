import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateAppicationStatusEnums1754496123446
    implements MigrationInterface
{
    name = 'UpdateAppicationStatusEnums1754496123446';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TYPE "public"."job_application_status_enum" RENAME TO "job_application_status_enum_old"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."job_application_status_enum" AS ENUM('APPLIED', 'IN_REVIEW', 'SHORTED_LIST', 'INTERVIEW', 'HIRED', 'REJECTED')`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" TYPE "public"."job_application_status_enum" USING "status"::"text"::"public"."job_application_status_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" SET DEFAULT 'APPLIED'`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."job_application_status_enum_old"`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TYPE "public"."job_application_status_enum_old" AS ENUM('APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED')`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" DROP DEFAULT`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" TYPE "public"."job_application_status_enum_old" USING "status"::"text"::"public"."job_application_status_enum_old"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job_application" ALTER COLUMN "status" SET DEFAULT 'APPLIED'`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."job_application_status_enum"`,
        );
        await queryRunner.query(
            `ALTER TYPE "public"."job_application_status_enum_old" RENAME TO "job_application_status_enum"`,
        );
    }
}
