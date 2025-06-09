import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddNewCvFields1749442012159 implements MigrationInterface {
    name = 'AddNewCvFields1749442012159';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "cv" ADD "name" character varying(255)`,
        );
        await queryRunner.query(`ALTER TABLE "cv" ADD "image" text`);
        await queryRunner.query(`ALTER TABLE "cv" ADD "email" text`);
        await queryRunner.query(`ALTER TABLE "cv" ADD "phone" bigint`);
        await queryRunner.query(`ALTER TABLE "cv" ADD "linkedin" text`);
        await queryRunner.query(`ALTER TABLE "cv" ADD "github" text`);
        await queryRunner.query(
            `ALTER TABLE "cv" ALTER COLUMN "skills" TYPE text[] USING skills::text[]`,
        );
        await queryRunner.query(
            `ALTER TABLE "cv" ALTER COLUMN "languages" TYPE text[] USING languages::text[]`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "languages"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "skills"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "github"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "linkedin"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "image"`);
        await queryRunner.query(`ALTER TABLE "cv" DROP COLUMN "name"`);
    }
}
