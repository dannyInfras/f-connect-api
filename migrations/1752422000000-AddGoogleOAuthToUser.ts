import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGoogleOAuthToUser1752422000000 implements MigrationInterface {
    name = 'AddGoogleOAuthToUser1752422000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add provider enum type
        await queryRunner.query(
            `CREATE TYPE "public"."users_provider_enum" AS ENUM('local', 'google')`,
        );

        // Add google_id column
        await queryRunner.query(
            `ALTER TABLE "users" ADD "google_id" character varying`,
        );
        await queryRunner.query(
            `ALTER TABLE "users" ADD CONSTRAINT "UQ_users_google_id" UNIQUE ("google_id")`,
        );

        // Add provider column with default value
        await queryRunner.query(
            `ALTER TABLE "users" ADD "provider" "public"."users_provider_enum" NOT NULL DEFAULT 'local'`,
        );

        // Make password nullable for OAuth users
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "password" DROP NOT NULL`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert password to NOT NULL
        await queryRunner.query(
            `ALTER TABLE "users" ALTER COLUMN "password" SET NOT NULL`,
        );

        // Drop provider column
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "provider"`);

        // Drop google_id column and constraint
        await queryRunner.query(
            `ALTER TABLE "users" DROP CONSTRAINT "UQ_users_google_id"`,
        );
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "google_id"`);

        // Drop provider enum type
        await queryRunner.query(`DROP TYPE "public"."users_provider_enum"`);
    }
}
