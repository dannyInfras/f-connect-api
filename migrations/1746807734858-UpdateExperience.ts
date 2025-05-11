import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateExperience1746807734858 implements MigrationInterface {
    name = 'UpdateExperience1746807734858'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "position"`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "company" character varying`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "role" character varying(255) NOT NULL`);
        await queryRunner.query(`CREATE TYPE "public"."experience_employment_type_enum" AS ENUM('full_time', 'part_time', 'contract')`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "employment_type" "public"."experience_employment_type_enum"`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "location" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "employment_type"`);
        await queryRunner.query(`DROP TYPE "public"."experience_employment_type_enum"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "role"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "company"`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "position" character varying(255) NOT NULL`);
    }

}
