import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobTypeOfEmploymentEnum1751000000000
    implements MigrationInterface
{
    name = 'UpdateJobTypeOfEmploymentEnum1751000000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Rename the old enum type
        await queryRunner.query(`
            ALTER TYPE "public"."job_typeofemployment_enum" RENAME TO "job_typeofemployment_enum_old"
        `);

        // Create the new enum type
        await queryRunner.query(`
            CREATE TYPE "public"."job_typeofemployment_enum" AS ENUM (
                'FULL_TIME',
                'PART_TIME',
                'CONTRACT',
                'INTERN',
                'FREELANCE',
                'TEMPORARY',
                'VOLUNTEER',
                'APPRENTICESHIP',
                'CO_OP',
                'SEASONAL',
                'REMOTE',
                'HYBRID'
            )
        `);

        // Drop the default constraint on typeOfEmployment (if it exists)
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" DROP DEFAULT
        `);

        // Alter the existing column to use the new enum
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" TYPE "public"."job_typeofemployment_enum"
            USING
                CASE "typeOfEmployment"
                    WHEN 'FullTime' THEN 'FULL_TIME'::"public"."job_typeofemployment_enum"
                    WHEN 'PartTime' THEN 'PART_TIME'::"public"."job_typeofemployment_enum"
                    WHEN 'Contract' THEN 'CONTRACT'::"public"."job_typeofemployment_enum"
                    WHEN 'Internship' THEN 'INTERN'::"public"."job_typeofemployment_enum"
                    WHEN 'Remote' THEN 'REMOTE'::"public"."job_typeofemployment_enum"
                    ELSE 'FULL_TIME'::"public"."job_typeofemployment_enum"
                END
        `);

        // Optionally set a new default value for typeOfEmployment
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" SET DEFAULT 'FULL_TIME'
        `);

        // Add new column with the same enum type
        await queryRunner.query(`
            ALTER TABLE "job"
            ADD "employmentTypeNew" "public"."job_typeofemployment_enum" DEFAULT 'FULL_TIME'
        `);

        // Drop the old enum type
        await queryRunner.query(`
            DROP TYPE "public"."job_typeofemployment_enum_old"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate the old enum type
        await queryRunner.query(`
            CREATE TYPE "public"."job_typeofemployment_enum_old" AS ENUM (
                'FullTime', 'PartTime', 'Contract', 'Internship', 'Remote'
            )
        `);

        // Drop the new column
        await queryRunner.query(`
            ALTER TABLE "job"
            DROP COLUMN "employmentTypeNew"
        `);

        // Drop the default constraint on typeOfEmployment (if it exists)
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" DROP DEFAULT
        `);

        // Alter the existing column to use the old enum
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" TYPE "public"."job_typeofemployment_enum_old"
            USING
                CASE "typeOfEmployment"
                    WHEN 'FULL_TIME' THEN 'FullTime'::"public"."job_typeofemployment_enum_old"
                    WHEN 'PART_TIME' THEN 'PartTime'::"public"."job_typeofemployment_enum_old"
                    WHEN 'CONTRACT' THEN 'Contract'::"public"."job_typeofemployment_enum_old"
                    WHEN 'INTERN' THEN 'Internship'::"public"."job_typeofemployment_enum_old"
                    WHEN 'REMOTE' THEN 'Remote'::"public"."job_typeofemployment_enum_old"
                    ELSE 'FullTime'::"public"."job_typeofemployment_enum_old"
                END
        `);

        // Optionally restore the original default value (if it was 'FullTime')
        await queryRunner.query(`
            ALTER TABLE "job"
            ALTER COLUMN "typeOfEmployment" SET DEFAULT 'FullTime'
        `);

        // Drop the new enum type
        await queryRunner.query(`
            DROP TYPE "public"."job_typeofemployment_enum"
        `);

        // Rename the old enum type back
        await queryRunner.query(`
            ALTER TYPE "public"."job_typeofemployment_enum_old" RENAME TO "job_typeofemployment_enum"
        `);
    }
}
