import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateCompanyCvChecklistTable1755498730226
    implements MigrationInterface
{
    name = 'CreateCompanyCvChecklistTable1755498730226';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `CREATE TABLE "company_cv_checklist" ("id" SERIAL NOT NULL, "checklist_name" character varying(255) NOT NULL, "description" text, "checklist_items" jsonb NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "is_default" boolean NOT NULL DEFAULT false, "company_id" bigint NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7d4ff2e5703167d2d148919bc41" PRIMARY KEY ("id"))`,
        );
        await queryRunner.query(
            `ALTER TABLE "company_cv_checklist" ADD CONSTRAINT "FK_33a7dcefd900427edd5bd048590" FOREIGN KEY ("company_id") REFERENCES "company"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE "company_cv_checklist" DROP CONSTRAINT "FK_33a7dcefd900427edd5bd048590"`,
        );
        await queryRunner.query(`DROP TABLE "company_cv_checklist"`);
    }
}
