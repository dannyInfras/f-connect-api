import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRoadmapTable1753001268876 implements MigrationInterface {
    name = 'AddRoadmapTable1753001268876';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      CREATE TABLE "roadmaps" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying NOT NULL,
        "description" text NOT NULL,
        "cvName" character varying,
        "jobTitle" character varying NOT NULL,
        "progress" integer NOT NULL DEFAULT 0,
        "skills" jsonb,
        "userId" integer NOT NULL,
        "cvId" uuid,
        "jobId" character varying,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_roadmaps" PRIMARY KEY ("id")
      );
      
      ALTER TABLE "roadmaps" ADD CONSTRAINT "FK_roadmaps_users" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
      ALTER TABLE "roadmaps" ADD CONSTRAINT "FK_roadmaps_cvs" FOREIGN KEY ("cvId") REFERENCES "cv"("id") ON DELETE SET NULL ON UPDATE NO ACTION;
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
      ALTER TABLE "roadmaps" DROP CONSTRAINT "FK_roadmaps_cvs";
      ALTER TABLE "roadmaps" DROP CONSTRAINT "FK_roadmaps_users";
      DROP TABLE "roadmaps";
    `);
    }
}
