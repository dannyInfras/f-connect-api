import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRoadmapTable1754809968414 implements MigrationInterface {
    name = 'UpdateRoadmapTable1754809968414';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Step 1: Check if columns already exist
        const tableColumns = await queryRunner.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'roadmaps'
        `);

        const columnNames = tableColumns.map((col: any) => col.column_name);

        // Add estimatedDuration if it doesn't exist
        if (!columnNames.includes('estimatedDuration')) {
            await queryRunner.query(`
                ALTER TABLE "roadmaps" 
                ADD COLUMN "estimatedDuration" integer DEFAULT 12
            `);
        }

        // Add cvSnapshot if it doesn't exist
        if (!columnNames.includes('cvSnapshot')) {
            await queryRunner.query(`
                ALTER TABLE "roadmaps" 
                ADD COLUMN "cvSnapshot" jsonb
            `);
        }

        // Add cvAnalysis if it doesn't exist
        if (!columnNames.includes('cvAnalysis')) {
            await queryRunner.query(`
                ALTER TABLE "roadmaps" 
                ADD COLUMN "cvAnalysis" jsonb
            `);
        }

        // Step 2: Check if cvId column exists and its type
        const hasCvId = columnNames.includes('cvId');

        if (hasCvId) {
            // Check the data type of cvId
            const cvIdType = await queryRunner.query(`
                SELECT data_type 
                FROM information_schema.columns 
                WHERE table_name = 'roadmaps' 
                AND column_name = 'cvId'
            `);

            // Try to migrate CV data if cvId exists
            try {
                // First, let's check if cv table exists
                const cvTableExists = await queryRunner.query(`
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_name = 'cv'
                    );
                `);

                if (cvTableExists[0]?.exists) {
                    // Get CV table id column type
                    const cvIdColumnType = await queryRunner.query(`
                        SELECT data_type 
                        FROM information_schema.columns 
                        WHERE table_name = 'cv' 
                        AND column_name = 'id'
                    `);

                    let roadmapsWithCv;

                    // Handle different type combinations
                    if (cvIdColumnType[0]?.data_type === 'uuid') {
                        // CV id is UUID
                        if (cvIdType[0]?.data_type === 'uuid') {
                            // Both are UUID
                            roadmapsWithCv = await queryRunner.query(`
                                SELECT r.*, c.* 
                                FROM "roadmaps" r
                                LEFT JOIN "cv" c ON r."cvId" = c.id
                                WHERE r."cvId" IS NOT NULL
                            `);
                        } else {
                            // cvId is text/varchar, cv.id is UUID
                            roadmapsWithCv = await queryRunner.query(`
                                SELECT r.*, c.* 
                                FROM "roadmaps" r
                                LEFT JOIN "cv" c ON r."cvId"::uuid = c.id
                                WHERE r."cvId" IS NOT NULL
                            `);
                        }
                    } else {
                        // CV id is not UUID (likely integer or text)
                        roadmapsWithCv = await queryRunner.query(`
                            SELECT r.*, c.* 
                            FROM "roadmaps" r
                            LEFT JOIN "cv" c ON r."cvId"::text = c.id::text
                            WHERE r."cvId" IS NOT NULL
                        `);
                    }

                    // Update roadmaps with CV data
                    for (const roadmap of roadmapsWithCv || []) {
                        if (roadmap.cvId && roadmap.name) {
                            const cvSnapshot = {
                                name: roadmap.name || 'Unknown',
                                email: roadmap.email || '',
                                phone: roadmap.phone || '',
                                summary: roadmap.summary || '',
                                experience: this.parseJsonField(
                                    roadmap.experience,
                                    [],
                                ),
                                education: this.parseJsonField(
                                    roadmap.education,
                                    [],
                                ),
                                skills: this.parseJsonField(roadmap.skills, []),
                                certifications: this.parseJsonField(
                                    roadmap.certifications,
                                    [],
                                ),
                                languages: this.parseJsonField(
                                    roadmap.languages,
                                    [],
                                ),
                                totalExperience: this.calculateTotalExperience(
                                    this.parseJsonField(roadmap.experience, []),
                                ),
                            };

                            const cvAnalysis =
                                this.generateBasicAnalysis(cvSnapshot);

                            await queryRunner.query(
                                `UPDATE "roadmaps" 
                                SET "cvSnapshot" = $1, 
                                    "cvAnalysis" = $2
                                WHERE "id" = $3`,
                                [
                                    JSON.stringify(cvSnapshot),
                                    JSON.stringify(cvAnalysis),
                                    roadmap.id,
                                ],
                            );
                        }
                    }
                }
            } catch (error) {
                console.warn('Could not migrate CV data:', error);
                // Continue with migration even if CV data migration fails
            }
        }

        // Step 3: Update skills structure for existing roadmaps
        const allRoadmaps = await queryRunner.query(`SELECT * FROM "roadmaps"`);

        for (const roadmap of allRoadmaps) {
            if (roadmap.skills) {
                const skills = this.parseJsonField(roadmap.skills, []);

                if (Array.isArray(skills) && skills.length > 0) {
                    const updatedSkills = skills.map(
                        (skill: any, index: number) => {
                            // Ensure skill has required structure
                            const updatedSkill: any = {
                                id: skill.id || `skill-${index + 1}`,
                                title: skill.title || `Skill ${index + 1}`,
                                description:
                                    skill.description || 'Skill description',
                                category: skill.category || 'core',
                                difficulty: skill.difficulty || 'intermediate',
                                estimatedHours: skill.estimatedHours || 40,
                                prerequisites: skill.prerequisites || [],
                                progress: skill.progress || 0,
                                order: skill.order || index + 1,
                                reason:
                                    skill.reason ||
                                    'Important for career progression',
                                tasks: [] as any[],
                            };

                            // Update tasks structure
                            if (skill.tasks && Array.isArray(skill.tasks)) {
                                updatedSkill.tasks = skill.tasks.map(
                                    (task: any, taskIndex: number) => {
                                        const updatedTask: any = {
                                            id:
                                                task.id ||
                                                `task-${index}-${taskIndex + 1}`,
                                            title:
                                                task.title ||
                                                `Task ${taskIndex + 1}`,
                                            description:
                                                task.description ||
                                                `Complete ${task.title || 'this task'}`,
                                            type: task.type || 'learn',
                                            estimatedHours:
                                                task.estimatedHours || 2,
                                            priority: task.priority || 'medium',
                                            completed: task.completed || false,
                                            order: task.order || taskIndex + 1,
                                            tips: task.tips || [
                                                'Start with basics',
                                                'Practice regularly',
                                            ],
                                            subTasks: [] as any[],
                                            relatedSkills:
                                                task.relatedSkills || [],
                                        };

                                        // Add or update subtasks
                                        if (
                                            task.subTasks &&
                                            Array.isArray(task.subTasks)
                                        ) {
                                            updatedTask.subTasks =
                                                task.subTasks.map(
                                                    (
                                                        subTask: any,
                                                        subIndex: number,
                                                    ) => ({
                                                        id:
                                                            subTask.id ||
                                                            `subtask-${taskIndex}-${subIndex + 1}`,
                                                        title:
                                                            subTask.title ||
                                                            `Subtask ${subIndex + 1}`,
                                                        description:
                                                            subTask.description,
                                                        completed:
                                                            subTask.completed ||
                                                            false,
                                                        order:
                                                            subTask.order ||
                                                            subIndex + 1,
                                                        estimatedMinutes:
                                                            subTask.estimatedMinutes ||
                                                            30,
                                                        checkCriteria:
                                                            subTask.checkCriteria ||
                                                            'Task completed',
                                                    }),
                                                );
                                        } else {
                                            // Generate default subtasks
                                            updatedTask.subTasks =
                                                this.generateDefaultSubTasks(
                                                    updatedTask.title,
                                                );
                                        }

                                        return updatedTask;
                                    },
                                );
                            } else {
                                // Generate default tasks if none exist
                                updatedSkill.tasks = this.generateDefaultTasks(
                                    updatedSkill.title,
                                );
                            }

                            return updatedSkill;
                        },
                    );

                    // Update the roadmap with new skills structure
                    await queryRunner.query(
                        `UPDATE "roadmaps" SET "skills" = $1 WHERE "id" = $2`,
                        [JSON.stringify(updatedSkills), roadmap.id],
                    );
                }
            }
        }

        // Step 4: Drop old columns if they exist
        if (hasCvId) {
            // Drop foreign key constraints if they exist
            try {
                await queryRunner.query(`
                    ALTER TABLE "roadmaps" 
                    DROP CONSTRAINT IF EXISTS "FK_roadmaps_cv"
                `);
            } catch (error) {
                // Constraint might not exist
            }

            // Drop the cvId column
            await queryRunner.query(`
                ALTER TABLE "roadmaps" 
                DROP COLUMN IF EXISTS "cvId"
            `);
        }

        // Drop cvName if it exists
        if (columnNames.includes('cvName')) {
            await queryRunner.query(`
                ALTER TABLE "roadmaps" 
                DROP COLUMN IF EXISTS "cvName"
            `);
        }

        // Step 5: Add indexes for better performance
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_roadmaps_userId" 
            ON "roadmaps" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_roadmaps_jobId" 
            ON "roadmaps" ("jobId")
        `);

        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_roadmaps_createdAt" 
            ON "roadmaps" ("createdAt")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roadmaps_userId"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_roadmaps_jobId"`);
        await queryRunner.query(
            `DROP INDEX IF EXISTS "IDX_roadmaps_createdAt"`,
        );

        // Add back old columns
        await queryRunner.query(`
            ALTER TABLE "roadmaps" 
            ADD COLUMN IF NOT EXISTS "cvId" varchar(255)
        `);

        await queryRunner.query(`
            ALTER TABLE "roadmaps" 
            ADD COLUMN IF NOT EXISTS "cvName" varchar(255)
        `);

        // Try to restore CV relationships from snapshots
        const roadmaps = await queryRunner.query(
            `SELECT * FROM "roadmaps" WHERE "cvSnapshot" IS NOT NULL`,
        );

        for (const roadmap of roadmaps) {
            if (roadmap.cvSnapshot) {
                const snapshot = this.parseJsonField(roadmap.cvSnapshot, {});

                if (snapshot.name) {
                    await queryRunner.query(
                        `UPDATE "roadmaps" SET "cvName" = $1 WHERE "id" = $2`,
                        [snapshot.name, roadmap.id],
                    );
                }
            }
        }

        // Drop new columns
        await queryRunner.query(`
            ALTER TABLE "roadmaps" 
            DROP COLUMN IF EXISTS "estimatedDuration"
        `);

        await queryRunner.query(`
            ALTER TABLE "roadmaps" 
            DROP COLUMN IF EXISTS "cvSnapshot"
        `);

        await queryRunner.query(`
            ALTER TABLE "roadmaps" 
            DROP COLUMN IF EXISTS "cvAnalysis"
        `);
    }

    // Helper methods
    private parseJsonField(field: any, defaultValue: any): any {
        if (!field) return defaultValue;
        if (typeof field === 'string') {
            try {
                return JSON.parse(field);
            } catch {
                return defaultValue;
            }
        }
        return field;
    }

    private calculateTotalExperience(experience: any[]): number {
        if (
            !experience ||
            !Array.isArray(experience) ||
            experience.length === 0
        )
            return 0;

        let totalMonths = 0;
        experience.forEach((exp: any) => {
            if (exp.startDate) {
                try {
                    const start = new Date(exp.startDate);
                    const end = exp.endDate
                        ? new Date(exp.endDate)
                        : new Date();
                    const months =
                        (end.getFullYear() - start.getFullYear()) * 12 +
                        (end.getMonth() - start.getMonth());
                    totalMonths += Math.max(0, months);
                } catch (error) {
                    // Skip invalid dates
                }
            }
        });

        return Math.round((totalMonths / 12) * 10) / 10;
    }

    private generateBasicAnalysis(cvSnapshot: any): any {
        const experienceLevel = this.determineExperienceLevel(
            cvSnapshot.totalExperience || 0,
        );

        return {
            overallScore: 60,
            experienceLevel,
            strengths: [
                'Existing experience',
                'Educational background',
                'Technical skills',
            ].slice(0, cvSnapshot.skills?.length > 0 ? 3 : 2),
            weaknesses: [
                'Need skill enhancement',
                'Limited specific experience',
            ],
            skillGaps: [],
            recommendations: [
                'Complete learning roadmap',
                'Build portfolio projects',
                'Network with professionals',
            ],
            matchPercentage: 50,
            detailedAnalysis: {
                experience: {
                    score: cvSnapshot.experience?.length > 0 ? 60 : 30,
                    feedback: 'Based on existing CV data',
                },
                skills: {
                    score: cvSnapshot.skills?.length > 5 ? 70 : 50,
                    feedback: 'Skills assessment based on CV',
                    matching: cvSnapshot.skills?.slice(0, 5) || [],
                    missing: [],
                },
                education: {
                    score: cvSnapshot.education?.length > 0 ? 70 : 40,
                    feedback: 'Educational background evaluated',
                },
                overall: {
                    summary: 'CV data migrated successfully',
                    nextSteps: ['Continue with personalized learning path'],
                },
            },
        };
    }

    private determineExperienceLevel(years: number): string {
        if (years === 0) return 'entry';
        if (years < 2) return 'junior';
        if (years < 5) return 'mid';
        if (years < 8) return 'senior';
        return 'expert';
    }

    private generateDefaultSubTasks(parentTaskTitle: string): any[] {
        return [
            {
                id: `subtask-1`,
                title: `Research and understand fundamentals`,
                description: `Study the basic concepts of ${parentTaskTitle || 'this task'}`,
                completed: false,
                order: 1,
                estimatedMinutes: 30,
                checkCriteria: 'Can explain the key concepts',
            },
            {
                id: `subtask-2`,
                title: `Practice with exercises`,
                description: `Apply knowledge through hands-on practice`,
                completed: false,
                order: 2,
                estimatedMinutes: 60,
                checkCriteria: 'Successfully completed exercises',
            },
            {
                id: `subtask-3`,
                title: `Build practical example`,
                description: `Create something to demonstrate understanding`,
                completed: false,
                order: 3,
                estimatedMinutes: 90,
                checkCriteria: 'Working example completed',
            },
        ];
    }

    private generateDefaultTasks(skillTitle: string): any[] {
        return [
            {
                id: `task-1`,
                title: `Learn ${skillTitle} fundamentals`,
                description: `Understand the core concepts of ${skillTitle}`,
                type: 'learn',
                estimatedHours: 4,
                priority: 'high',
                completed: false,
                order: 1,
                tips: ['Start with official documentation', 'Take notes'],
                subTasks: this.generateDefaultSubTasks(
                    `${skillTitle} fundamentals`,
                ),
                relatedSkills: [],
            },
            {
                id: `task-2`,
                title: `Practice ${skillTitle}`,
                description: `Apply ${skillTitle} through hands-on exercises`,
                type: 'practice',
                estimatedHours: 6,
                priority: 'medium',
                completed: false,
                order: 2,
                tips: ['Practice daily', 'Start with simple examples'],
                subTasks: [],
                relatedSkills: [],
            },
        ];
    }
}
