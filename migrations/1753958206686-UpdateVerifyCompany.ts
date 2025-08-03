import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVerifyCompany1753958206686 implements MigrationInterface {
    name = 'UpdateVerifyCompany1753958206686';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "company" ADD "isVerified" boolean DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "company" DROP COLUMN "isVerified"`,
        );
    }
}
