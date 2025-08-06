import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSkillsJsonbToCandidateProfile1754498899219
    implements MigrationInterface
{
    name = 'AddSkillsJsonbToCandidateProfile1754498899219';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add skills JsonB column to candidate_profile
        await queryRunner.query(
            `ALTER TABLE "candidate_profile" ADD "skills" jsonb`,
        );

        // Drop the candidate_skill table as it's no longer needed
        await queryRunner.query(`DROP TABLE IF EXISTS "candidate_skill"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Recreate candidate_skill table
        await queryRunner.query(`
            CREATE TABLE "candidate_skill" (
                "id" BIGSERIAL PRIMARY KEY,
                "candidate_profile_id" BIGINT NOT NULL,
                "skill_id" BIGINT NOT NULL,
                "proficiency_level" VARCHAR(50),
                "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                UNIQUE ("candidate_profile_id", "skill_id"),
                CONSTRAINT "fk_candidate_skill_candidate_profile_id" FOREIGN KEY ("candidate_profile_id") REFERENCES "candidate_profile"("id") ON DELETE CASCADE,
                CONSTRAINT "fk_candidate_skill_skill_id" FOREIGN KEY ("skill_id") REFERENCES "skill"("id") ON DELETE CASCADE
            )
        `);

        // Remove skills JsonB column from candidate_profile
        await queryRunner.query(
            `ALTER TABLE "candidate_profile" DROP COLUMN "skills"`,
        );
    }
}
