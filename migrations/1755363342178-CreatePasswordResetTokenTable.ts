import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreatePasswordResetTokenTable1755363342178
    implements MigrationInterface
{
    name = 'CreatePasswordResetTokenTable1755363342178';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "password_reset_tokens" ("id" SERIAL NOT NULL, "token" character varying(500) NOT NULL, "expires_at" TIMESTAMP NOT NULL, "is_used" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer, CONSTRAINT "PK_d16bebd73e844c48bca50ff8d3d" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `CREATE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `,
        );
        await queryRunner.query(
            `ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "password_reset_tokens" DROP CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2"`,
        );

        await queryRunner.query(
            `DROP INDEX "public"."IDX_ab673f0e63eac966762155508e"`,
        );
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
    }
}
