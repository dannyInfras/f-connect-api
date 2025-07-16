import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddHasUpdatedToCandidateProfile1752670364071
    implements MigrationInterface
{
    name = 'AddHasUpdatedToCandidateProfile1752670364071';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "candidate_profile" ADD "has_updated" boolean NOT NULL DEFAULT false`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "candidate_profile" DROP COLUMN "has_updated"`,
        );
    }
}
