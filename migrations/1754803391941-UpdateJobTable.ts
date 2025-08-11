import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJobTable1754803391941 implements MigrationInterface {
    name = 'UpdateJobTable1754803391941';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "job" ADD "is_deleted" boolean NOT NULL DEFAULT false`,
        );
        await queryRunner.query(
            `ALTER TABLE "job" ADD "top_job" integer DEFAULT 0`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "is_deleted"`);
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "top_job"`);
    }
}
