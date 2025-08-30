import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPackageTypeToPaymentTable1757000000001
    implements MigrationInterface
{
    name = 'AddPackageTypeToPaymentTable1757000000001';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add package_type column to payment table
        await queryRunner.query(`
            ALTER TABLE "payment" 
            ADD COLUMN "package_type" INTEGER NOT NULL DEFAULT 1
        `);

        // Add comment to explain the package types
        await queryRunner.query(`
            COMMENT ON COLUMN "payment"."package_type" IS '1: TOP_COMPANY, 2: TOP_JOB, 3: VIP_JOB, 4: PREMIUM_JOB, 5: AI_POINT'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove package_type column from payment table
        await queryRunner.query(`
            ALTER TABLE "payment" 
            DROP COLUMN "package_type"
        `);
    }
}
