import { MigrationInterface, QueryRunner } from 'typeorm';

export class BenefitAndTeamTable1747020258900 implements MigrationInterface {
    name = 'BenefitAndTeamTable1747020258900';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "benefit" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "description" text NOT NULL, "icon_url" character varying NOT NULL, "company_id" bigint, CONSTRAINT "PK_c024dccb30e6f4702adffe884d1" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE TABLE "core_team" ("id" BIGSERIAL NOT NULL, "name" character varying NOT NULL, "position" character varying NOT NULL, "image_url" character varying NOT NULL, "company_id" bigint, CONSTRAINT "PK_41e3954848b4fa272d19c7b12ec" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "is_verified"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "founded_at" TIMESTAMP`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "employees" integer`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "website" character varying(255)`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "socialMedia" text array`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "workImageUrl" text array`,
        );
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "address"`);
        await queryRunner.query(
            `ALTER TABLE "company" ADD "address" text array`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
        await queryRunner.query(
            `ALTER TABLE "core_team" ADD CONSTRAINT "FK_52a2a1c2fd9af420e5a4f8a8db8" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "core_team" DROP CONSTRAINT "FK_52a2a1c2fd9af420e5a4f8a8db8"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c"`,
        );
        await queryRunner.query(
            `ALTER TABLE "benefit" DROP CONSTRAINT "FK_f063151550a2280deb54037af30"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "FK_15f44c4b9fbb84e28a0346e930f"`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" DROP CONSTRAINT "FK_51cb12c924d3e8c7465cc8edff2"`,
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
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "address"`);
        await queryRunner.query(
            `ALTER TABLE "company" ADD "address" character varying(255)`,
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
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "niceToHave" SET DEFAULT '{}'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "jobFitAttributes" SET DEFAULT '{}'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "responsibility" SET DEFAULT '{}'`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ALTER COLUMN "deadline" SET DEFAULT now()`,
        );
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_status_enum"`);
        await queryRunner.query(
            `ALTER TABLE "job" ADD "status" character varying(10) DEFAULT 'OPEN'`,
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
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "workImageUrl"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "socialMedia"`,
        );
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "website"`);
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "employees"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "founded_at"`,
        );
        await queryRunner.query(
            `ALTER TABLE "company" ADD "is_verified" boolean DEFAULT false`,
        );
        await queryRunner.query(`DROP TABLE "core_team"`);
        await queryRunner.query(`DROP TABLE "benefit"`);
    }
}
