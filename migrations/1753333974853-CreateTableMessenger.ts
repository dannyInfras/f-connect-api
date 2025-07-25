import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateTableMessenger1753333974853 implements MigrationInterface {
    name = 'CreateTableMessenger1753333974853';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create conversations table
        await queryRunner.query(`
      CREATE TABLE "conversations" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user1Id" INTEGER NOT NULL,
        "user2Id" INTEGER NOT NULL,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_user1" FOREIGN KEY ("user1Id") REFERENCES "users"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_user2" FOREIGN KEY ("user2Id") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);

        // Create messages table
        await queryRunner.query(`
      CREATE TABLE "messages" (
        "id" UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
        "conversationId" UUID NOT NULL,
        "senderId" INTEGER NOT NULL,
        "content" TEXT NOT NULL,
        "type" VARCHAR NOT NULL DEFAULT 'text',
        "isRead" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "fk_conversation" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_sender" FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE
      )
    `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "messages"`);
        await queryRunner.query(`DROP TABLE "conversations"`);
    }
}
