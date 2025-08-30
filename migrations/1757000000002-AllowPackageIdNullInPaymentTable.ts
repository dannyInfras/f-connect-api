import { MigrationInterface, QueryRunner } from 'typeorm';

export class AllowPackageIdNullInPaymentTable1757000000002
    implements MigrationInterface
{
    name = 'AllowPackageIdNullInPaymentTable1757000000002';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the NOT NULL constraint on package_id column
        await queryRunner.query(`
            ALTER TABLE "payment" 
            ALTER COLUMN "package_id" DROP NOT NULL
        `);

        // Add comment to explain the change
        await queryRunner.query(`
            COMMENT ON COLUMN "payment"."package_id" IS 'Deprecated: Use package_type instead. This column is kept for backward compatibility.'
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore the NOT NULL constraint on package_id column
        await queryRunner.query(`
            ALTER TABLE "payment" 
            ALTER COLUMN "package_id" SET NOT NULL
        `);

        // Remove the comment
        await queryRunner.query(`
            COMMENT ON COLUMN "payment"."package_id" IS NULL
        `);
    }
}
