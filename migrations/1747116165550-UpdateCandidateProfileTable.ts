import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCandidateProfileTable1747116165550 implements MigrationInterface {
    name = 'UpdateCandidateProfileTable1747116165550'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "contact" jsonb`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "social" jsonb`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "category_name_key"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "category" ADD "name" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "UQ_23c05c292c439d77b0de816b500" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c"`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "company_user_id_key"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "company" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "UQ_879141ebc259b4c0544b3f1ea4c" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."job_status_enum" AS ENUM('OPEN', 'CLOSED')`);
        await queryRunner.query(`ALTER TABLE "job" ADD "status" "public"."job_status_enum" NOT NULL DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "deadline" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "responsibility" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "jobFitAttributes" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "niceToHave" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "is_vip" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "company_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "category_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "benefit" ADD CONSTRAINT "FK_f063151550a2280deb54037af30" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_51cb12c924d3e8c7465cc8edff2" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_15f44c4b9fbb84e28a0346e930f" FOREIGN KEY ("category_id") REFERENCES "category"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_15f44c4b9fbb84e28a0346e930f"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_51cb12c924d3e8c7465cc8edff2"`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c"`);
        await queryRunner.query(`ALTER TABLE "benefit" DROP CONSTRAINT "FK_f063151550a2280deb54037af30"`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "category_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "company_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "is_vip" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "niceToHave" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "jobFitAttributes" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "responsibility" SET DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "job" ALTER COLUMN "deadline" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_status_enum"`);
        await queryRunner.query(`ALTER TABLE "job" ADD "status" character varying(10) DEFAULT 'OPEN'`);
        await queryRunner.query(`ALTER TABLE "company" DROP CONSTRAINT "UQ_879141ebc259b4c0544b3f1ea4c"`);
        await queryRunner.query(`ALTER TABLE "company" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "company" ADD "user_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "company_user_id_key" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "company" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "company" ADD CONSTRAINT "FK_879141ebc259b4c0544b3f1ea4c" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "category" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "category" DROP CONSTRAINT "UQ_23c05c292c439d77b0de816b500"`);
        await queryRunner.query(`ALTER TABLE "category" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "category" ADD "name" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "category" ADD CONSTRAINT "category_name_key" UNIQUE ("name")`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "social"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "contact"`);
    }

}
