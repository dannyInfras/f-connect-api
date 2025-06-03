import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateJobApplication1748968755733 implements MigrationInterface {
    name = 'UpdateJobApplication1748968755733'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cv" DROP CONSTRAINT "FK_user_cv"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "fk_job_application_job_id"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "fk_job_application_user_id"`);
        await queryRunner.query(`DROP INDEX "public"."idx_cv_experience"`);
        await queryRunner.query(`DROP INDEX "public"."idx_cv_education"`);
        await queryRunner.query(`DROP INDEX "public"."idx_cv_certifications"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "job_application_status_check"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "cover_letter" character varying`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "job_application_pkey"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "PK_c0b8f6b6341802967369b5d70f5" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "cv_id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "cv_id" character varying`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."job_application_status_enum" AS ENUM('APPLIED', 'INTERVIEW', 'HIRED', 'REJECTED')`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "status" "public"."job_application_status_enum" NOT NULL DEFAULT 'APPLIED'`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "applied_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "applied_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "job_id" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "cv" ADD CONSTRAINT "FK_eb6c8cd9697ef578e13890de7d2" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "FK_bba40aa2dd153927b5a2c8629bb" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "FK_a7f70771aaf242d17ef281570cf" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "FK_a7f70771aaf242d17ef281570cf"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "FK_bba40aa2dd153927b5a2c8629bb"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP CONSTRAINT "FK_eb6c8cd9697ef578e13890de7d2"`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "job_id" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "user_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "applied_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "job_application" ALTER COLUMN "applied_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."job_application_status_enum"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "status" character varying(20) DEFAULT 'APPLIED'`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "cv_id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "cv_id" bigint`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP CONSTRAINT "PK_c0b8f6b6341802967369b5d70f5"`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD "id" BIGSERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "job_application_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "job_application" DROP COLUMN "cover_letter"`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "job_application_status_check" CHECK (((status)::text = ANY ((ARRAY['APPLIED'::character varying, 'INTERVIEW'::character varying, 'HIRED'::character varying, 'REJECTED'::character varying])::text[])))`);
        await queryRunner.query(`CREATE INDEX "idx_cv_certifications" ON "cv" ("certifications") `);
        await queryRunner.query(`CREATE INDEX "idx_cv_education" ON "cv" ("education") `);
        await queryRunner.query(`CREATE INDEX "idx_cv_experience" ON "cv" ("experience") `);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "fk_job_application_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_application" ADD CONSTRAINT "fk_job_application_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "cv" ADD CONSTRAINT "FK_user_cv" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
