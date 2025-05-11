import { MigrationInterface, QueryRunner } from "typeorm";

export class Education1746813179441 implements MigrationInterface {
    name = 'Education1746813179441'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "education" ("id" BIGSERIAL NOT NULL, "institution" character varying(255) NOT NULL, "degree" character varying(100), "field" character varying(100), "startYear" integer NOT NULL, "endYear" integer, "description" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "candidate_profile_id" bigint NOT NULL, CONSTRAINT "PK_bf3d38701b3030a8ad634d43bd6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" DROP COLUMN "education"`);
        await queryRunner.query(`ALTER TABLE "education" ADD CONSTRAINT "FK_3483140e84f8fb01e78793ecb98" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "education" DROP CONSTRAINT "FK_3483140e84f8fb01e78793ecb98"`);
        await queryRunner.query(`ALTER TABLE "candidate_profile" ADD "education" text`);
        await queryRunner.query(`DROP TABLE "education"`);
    }

}
