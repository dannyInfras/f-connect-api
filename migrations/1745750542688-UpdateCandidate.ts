import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateCandidate1745750542688 implements MigrationInterface {
    name = 'UpdateCandidate1745750542688'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP CONSTRAINT "fk_candidate_profile_user_id"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "fk_experience_candidate_profile_id"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "fk_experience_company_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "fk_candidate_skill_candidate_profile_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "fk_candidate_skill_skill_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "candidate_skill_candidate_profile_id_skill_id_key"`);
        await queryRunner.query(`CREATE TABLE "articles" ("id" SERIAL NOT NULL, "title" character varying NOT NULL, "post" character varying NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "authorId" integer, CONSTRAINT "PK_0a6e2c450d83e0b6052c2793334" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "experience" DROP COLUMN "company_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP COLUMN "proficiency_level"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "title" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "company" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "location" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "avatar" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "coverImage" character varying(255)`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "isOpenToOpportunities" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "about" text`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "birthDate" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD "proficiencyLevel" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(30)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_a000cca60bcf04454e727699490" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP CONSTRAINT "candidate_profile_user_id_key"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "user_id" integer`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD CONSTRAINT "UQ_ce664e2dbb3f03521bcdd2c7bf0" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "updated_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "updated_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "skill" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "skill" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ALTER COLUMN "created_at" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ALTER COLUMN "created_at" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "UQ_c0baaf556b104a9c38f55261a06" UNIQUE ("candidate_profile_id", "skill_id")`);
        await queryRunner.query(`ALTER TABLE "articles" ADD CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD CONSTRAINT "FK_ce664e2dbb3f03521bcdd2c7bf0" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experience" ADD CONSTRAINT "FK_7955b5bea11080df955b604055c" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "FK_8430e406377f3568574baa2c990" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "FK_fcb69c0e9e78c9ebdaa667fedfa" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "FK_fcb69c0e9e78c9ebdaa667fedfa"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "FK_8430e406377f3568574baa2c990"`);
        await queryRunner.query(`ALTER TABLE "experience" DROP CONSTRAINT "FK_7955b5bea11080df955b604055c"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP CONSTRAINT "FK_ce664e2dbb3f03521bcdd2c7bf0"`);
        await queryRunner.query(`ALTER TABLE "articles" DROP CONSTRAINT "FK_65d9ccc1b02f4d904e90bd76a34"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP CONSTRAINT "UQ_c0baaf556b104a9c38f55261a06"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "skill" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "skill" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "experience" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP CONSTRAINT "UQ_ce664e2dbb3f03521bcdd2c7bf0"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "user_id"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "user_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD CONSTRAINT "candidate_profile_user_id_key" UNIQUE ("user_id")`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "updated_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "created_at" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_a000cca60bcf04454e727699490"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(12)`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "phone" UNIQUE ("phone")`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" DROP COLUMN "proficiencyLevel"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "birthDate"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "about"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "isOpenToOpportunities"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "coverImage"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "avatar"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "location"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "company"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "title"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD "proficiency_level" character varying(50)`);
        await queryRunner.query(`ALTER TABLE "experience" ADD "company_id" bigint NOT NULL`);
        await queryRunner.query(`DROP TABLE "articles"`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "candidate_skill_candidate_profile_id_skill_id_key" UNIQUE ("candidate_profile_id", "skill_id")`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "fk_candidate_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_skill" ADD CONSTRAINT "fk_candidate_skill_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experience" ADD CONSTRAINT "fk_experience_company_id" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "experience" ADD CONSTRAINT "fk_experience_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD CONSTRAINT "fk_candidate_profile_user_id" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
