import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateTableJob1746896841912 implements MigrationInterface {
    name = 'UpdateTableJob1746896841912';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "company" DROP CONSTRAINT "fk_company_user_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "fk_job_category_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "fk_job_company_id"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "job_status_check"`,
        );
        await queryRunner.query(
            `CREATE TYPE "public"."job_typeofemployment_enum" AS ENUM('FullTime', 'PartTime', 'Contract', 'Internship', 'Remote')`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "typeOfEmployment" "public"."job_typeofemployment_enum" NOT NULL DEFAULT 'FullTime'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "deadline" TIMESTAMP NOT NULL DEFAULT now()`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "responsibility" text array NOT NULL DEFAULT '{}'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "jobFitAttributes" text array NOT NULL DEFAULT '{}'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "niceToHave" text array NOT NULL DEFAULT '{}'`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "FK_15f44c4b9fbb84e28a0346e930f"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "FK_51cb12c924d3e8c7465cc8edff2"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "category_id" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "company_id" SET NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "updated_at" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "created_at" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "is_vip" DROP NOT NULL`,
        );
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_status_enum"`);
        await queryRunner.query(
            `ALTER TABLE "job" ADD "status" character varying(10) DEFAULT 'OPEN'`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP CONSTRAINT "UQ_879141ebc259b4c0544b3f1ea4c"`,
        );
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "user_id"`);
        await queryRunner.query(
            `ALTER TABLE "company" ADD "user_id" bigint NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD CONSTRAINT "company_user_id_key" UNIQUE ("user_id")`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ALTER COLUMN "updated_at" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ALTER COLUMN "created_at" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ALTER COLUMN "is_verified" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "category" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "category" ALTER COLUMN "created_at" DROP NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`,
        );
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "name"`);
        await queryRunner.query(
            `ALTER TABLE "category" ADD "name" character varying(100) NOT NULL`,
        );
        await queryRunner.query(
            `ALTER TABLE "category" ADD CONSTRAINT "category_name_key" UNIQUE ("name")`,
        );
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "niceToHave"`);
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN "jobFitAttributes"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN "responsibility"`,
        );
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "deadline"`);
        await queryRunner.query(
            `ALTER TABLE "job" DROP COLUMN "typeOfEmployment"`,
        );
        await queryRunner.query(
            `DROP TYPE "public"."job_typeofemployment_enum"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD CONSTRAINT "job_status_check" CHECK (((status)::text = ANY ((ARRAY['OPEN'::character varying, 'CLOSED'::character varying])::text[])))`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD CONSTRAINT "fk_job_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD CONSTRAINT "fk_job_category_id" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD CONSTRAINT "fk_company_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }
}
