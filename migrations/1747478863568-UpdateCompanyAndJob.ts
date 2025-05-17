import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCompanyAndJob1747478863568 implements MigrationInterface {
    name = 'UpdateCompanyAndJob1747478863568'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_879141ebc259b4c0544b3f1ea4c"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "companyId" bigint`);
        await queryRunner.query(`ALTER TABLE "company" ADD "phone" integer`);
        await queryRunner.query(`ALTER TABLE "company" ADD "email" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "job" ADD "benefit" text array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_6f9395c9037632a31107c8a9e58" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_6f9395c9037632a31107c8a9e58"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "benefit"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "companyId"`);
        await queryRunner.query(`ALTER TABLE "company" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_879141ebc259b4c0544b3f1ea4c" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
