import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdatePackageTypeConstraint1751089194311
    implements MigrationInterface
{
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Xóa ràng buộc cũ
        await queryRunner.query(`
            ALTER TABLE "package" DROP CONSTRAINT IF EXISTS "package_type_check"
        `);

        // Thêm ràng buộc mới bao gồm JOB_VIP
        await queryRunner.query(`
            ALTER TABLE "package" ADD CONSTRAINT "package_type_check" 
            CHECK (type IN ('USER_VIP', 'COMPANY_VIP', 'JOB_VIP'))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Xóa ràng buộc mới
        await queryRunner.query(`
            ALTER TABLE "package" DROP CONSTRAINT IF EXISTS "package_type_check"
        `);

        // Khôi phục ràng buộc cũ
        await queryRunner.query(`
            ALTER TABLE "package" ADD CONSTRAINT "package_type_check" 
            CHECK (type IN ('USER_VIP', 'COMPANY_VIP'))
        `);
    }
}
