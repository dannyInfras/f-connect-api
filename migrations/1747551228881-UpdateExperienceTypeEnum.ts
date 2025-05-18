import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExperienceTypeEnum1747551228881 implements MigrationInterface {
    name = 'UpdateExperienceTypeEnum1747551228881'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."experience_employment_type_enum" RENAME TO "experience_employment_type_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."experience_employment_type_enum" AS ENUM('Full Time', 'Part Time', 'Contract', 'Intern', 'Freelance', 'Temporary', 'Volunteer', 'Apprenticeship', 'Co-op', 'Seasonal', 'Remote', 'Onsite', 'Hybrid')`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "employment_type" TYPE "public"."experience_employment_type_enum" USING "employment_type"::"text"::"public"."experience_employment_type_enum"`);
        await queryRunner.query(`DROP TYPE "public"."experience_employment_type_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."experience_employment_type_enum_old" AS ENUM('full_time', 'part_time', 'contract')`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "employment_type" TYPE "public"."experience_employment_type_enum_old" USING "employment_type"::"text"::"public"."experience_employment_type_enum_old"`);
        await queryRunner.query(`DROP TYPE "public"."experience_employment_type_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."experience_employment_type_enum_old" RENAME TO "experience_employment_type_enum"`);
    }

}
