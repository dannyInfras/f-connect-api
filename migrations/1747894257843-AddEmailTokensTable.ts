import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmailTokensTable1747894257843 implements MigrationInterface {
    name = 'AddEmailTokensTable1747894257843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_skill" DROP CONSTRAINT "fk_job_skill_skill_id"`);
        await queryRunner.query(`ALTER TABLE "job_skill" DROP CONSTRAINT "fk_job_skill_job_id"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "is_verified" TO "is_account_disabled"`);
        await queryRunner.query(`CREATE TABLE "email_verification_tokens" ("id" SERIAL NOT NULL, "user_id" integer NOT NULL, "token" character varying NOT NULL, "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL, "used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_417a095bbed21c2369a6a01ab9a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_3d1613f95c6a564a3b588d161a" ON "email_verification_tokens" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_57d07c4be198a93a91fa847981" ON "job_skill" ("job_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_380feeef9ae48bb593b5acd923" ON "job_skill" ("skill_id") `);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_skill" ADD CONSTRAINT "FK_57d07c4be198a93a91fa8479819" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "job_skill" ADD CONSTRAINT "FK_380feeef9ae48bb593b5acd9232" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job_skill" DROP CONSTRAINT "FK_380feeef9ae48bb593b5acd9232"`);
        await queryRunner.query(`ALTER TABLE "job_skill" DROP CONSTRAINT "FK_57d07c4be198a93a91fa8479819"`);
        await queryRunner.query(`ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "FK_fdcb77f72f529bf65c95d72a147"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_380feeef9ae48bb593b5acd923"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57d07c4be198a93a91fa847981"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3d1613f95c6a564a3b588d161a"`);
        await queryRunner.query(`DROP TABLE "email_verification_tokens"`);
        await queryRunner.query(`ALTER TABLE "users" RENAME COLUMN "is_account_disabled" TO "is_verified"`);
        await queryRunner.query(`ALTER TABLE "job_skill" ADD CONSTRAINT "fk_job_skill_job_id" FOREIGN KEY ("job_id") REFERENCES "job"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job_skill" ADD CONSTRAINT "fk_job_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
