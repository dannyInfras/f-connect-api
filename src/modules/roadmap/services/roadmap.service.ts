import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CvService } from '../../cv/services/cv.service';
import { JobService } from '../../jobs/services/jobs.service';
import { RoadmapAclService } from '../acl/roadmap.acl';
import { CreateRoadmapReqDto } from '../dtos/req/create-roadmap.req';
import { GenerateRoadmapReqDto } from '../dtos/req/generate-roadmap.req';
import { UpdateRoadmapReqDto } from '../dtos/req/update-roadmap.req';
import { ListRoadmapResDto } from '../dtos/res/list-roadmap.res';
import { RoadmapResDto } from '../dtos/res/roadmap.res';
import { Roadmap, RoadmapSkill } from '../entities/roadmap.entity';
import { RoadmapRepository } from '../repositories/roadmap.repository';
import { RoadmapAiService } from './roadmap-ai.service';

@Injectable()
export class RoadmapService {
  constructor(
    private readonly roadmapRepository: RoadmapRepository,
    private readonly aclService: RoadmapAclService,
    private readonly aiService: RoadmapAiService,
    private readonly cvService: CvService,
    private readonly jobService: JobService, // Inject JobService
  ) {}

  /**
   * Create a new roadmap
   */
  async create(
    actor: Actor,
    createRoadmapDto: CreateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    // Create a new roadmap entity
    const roadmap = this.roadmapRepository.create({
      ...createRoadmapDto,
      userId: actor.id,
      progress: 0,
      skills: [],
      estimatedDuration: createRoadmapDto.estimatedDuration || 12,
    });

    // Save the roadmap
    const savedRoadmap = await this.roadmapRepository.save(roadmap);
    return this.mapToDto(savedRoadmap);
  }

  /**
   * Find all roadmaps
   */
  async findAll(
    actor: Actor,
    page = 1,
    limit = 10,
  ): Promise<ListRoadmapResDto> {
    const offset = (page - 1) * limit;
    const [roadmaps, total] = await this.roadmapRepository.findAndCount({
      where: { userId: actor.id }, // User can only see their own roadmaps
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return {
      items: roadmaps.map((roadmap) => this.mapToDto(roadmap)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Find roadmaps by user ID
   */
  async findByUserId(
    actor: Actor,
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<ListRoadmapResDto> {
    // Check if actor can view this user's roadmaps
    if (userId !== actor.id && !actor.roles?.includes('admin')) {
      throw new UnauthorizedException('You can only view your own roadmaps');
    }

    const offset = (page - 1) * limit;
    const [roadmaps, total] = await this.roadmapRepository.findByUserId(
      userId,
      limit,
      offset,
    );

    return {
      items: roadmaps.map((roadmap) => this.mapToDto(roadmap)),
      meta: {
        total,
        page,
        limit,
      },
    };
  }

  /**
   * Find one roadmap by ID
   */
  async findOne(actor: Actor, id: string): Promise<RoadmapResDto> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
    });

    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }

    // Check if actor has permission to read this roadmap
    if (!this.aclService.forActor(actor).canDoAction(Action.Read, roadmap)) {
      throw new UnauthorizedException(
        'You do not have permission to view this roadmap',
      );
    }

    return this.mapToDto(roadmap);
  }

  /**
   * Update a roadmap
   */
  async update(
    actor: Actor,
    id: string,
    updateRoadmapDto: UpdateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    // Find existing roadmap
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
    });

    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }

    // Check if actor has permission to update this roadmap
    if (!this.aclService.forActor(actor).canDoAction(Action.Update, roadmap)) {
      throw new UnauthorizedException(
        'You do not have permission to update this roadmap',
      );
    }

    // Update roadmap
    const updatedRoadmap = this.roadmapRepository.merge(
      roadmap,
      updateRoadmapDto,
    );

    // Calculate progress if skills are provided
    if (updateRoadmapDto.skills) {
      updatedRoadmap.progress = this.calculateProgress(updatedRoadmap.skills);
    }

    // Save updated roadmap
    const savedRoadmap = await this.roadmapRepository.save(updatedRoadmap);
    return this.mapToDto(savedRoadmap);
  }

  /**
   * Update task completion
   */
  async updateTaskCompletion(
    actor: Actor,
    roadmapId: string,
    skillId: string,
    taskId: string,
    subTaskId?: string,
  ): Promise<RoadmapResDto> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id: roadmapId },
    });

    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${roadmapId} not found`);
    }

    // Check permissions
    if (!this.aclService.forActor(actor).canDoAction(Action.Update, roadmap)) {
      throw new UnauthorizedException(
        'You do not have permission to update this roadmap',
      );
    }

    // Update the specific task or subtask
    const updatedSkills = roadmap.skills.map((skill) => {
      if (skill.id === skillId) {
        const updatedTasks = skill.tasks.map((task) => {
          if (task.id === taskId) {
            if (subTaskId && task.subTasks) {
              // Update subtask
              const updatedSubTasks = task.subTasks.map((subTask) =>
                subTask.id === subTaskId
                  ? { ...subTask, completed: !subTask.completed }
                  : subTask,
              );

              // Check if all subtasks are completed to auto-complete task
              const allSubTasksCompleted = updatedSubTasks.every(
                (st) => st.completed,
              );

              return {
                ...task,
                subTasks: updatedSubTasks,
                completed: allSubTasksCompleted,
              };
            } else {
              // Toggle task completion
              return { ...task, completed: !task.completed };
            }
          }
          return task;
        });

        // Recalculate skill progress
        const completedTasks = updatedTasks.filter((t) => t.completed).length;
        const totalTasks = updatedTasks.length;
        const skillProgress =
          totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          ...skill,
          tasks: updatedTasks,
          progress: skillProgress,
        };
      }
      return skill;
    });

    // Update roadmap with new skills and recalculate overall progress
    roadmap.skills = updatedSkills;
    roadmap.progress = this.calculateProgress(updatedSkills);
    roadmap.updatedAt = new Date();

    const savedRoadmap = await this.roadmapRepository.save(roadmap);
    return this.mapToDto(savedRoadmap);
  }

  /**
   * Remove a roadmap
   */
  async remove(actor: Actor, id: string): Promise<void> {
    const roadmap = await this.roadmapRepository.findOne({
      where: { id },
    });

    if (!roadmap) {
      throw new NotFoundException(`Roadmap with ID ${id} not found`);
    }

    // Check if actor has permission to delete this roadmap
    if (!this.aclService.forActor(actor).canDoAction(Action.Delete, roadmap)) {
      throw new UnauthorizedException(
        'You do not have permission to delete this roadmap',
      );
    }

    await this.roadmapRepository.remove(roadmap);
  }

  /**
   * Generate a roadmap using AI
   */
  async generateRoadmap(
    actor: Actor,
    generateDto: GenerateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    // Step 1: Fetch CV data
    const cv = await this.cvService.findOne(generateDto.cvId);

    // Check if actor has permission to access this CV
    if (cv.userId !== actor.id && !actor.roles?.includes('admin')) {
      throw new UnauthorizedException(
        'You do not have permission to access this CV',
      );
    }

    // Step 2: Fetch Job details from Job Service
    const job = await this.jobService.findOne(null, generateDto.jobId);

    if (!job) {
      throw new NotFoundException(`Job with ID ${generateDto.jobId} not found`);
    }

    // Prepare job details for AI service
    // Assuming job entity has these fields - adjust based on your actual Job entity
    const jobDetails = {
      id: job.id,
      title: job.title || 'Unknown Position',
      description: job.description || '',
    };

    // Step 3: Generate roadmap using AI with CV snapshot and analysis
    const generatedRoadmap = await this.aiService.generateRoadmap(
      cv.userId,
      cv,
      jobDetails,
    );

    // Step 4: Create a new roadmap entity with all fields
    const roadmap = this.roadmapRepository.create({
      title: generatedRoadmap.title,
      description: generatedRoadmap.description,
      estimatedDuration: generatedRoadmap.estimatedDuration,
      userId: actor.id,
      jobId: generateDto.jobId,
      jobTitle: job.title || 'Unknown Position',
      progress: 0,
      skills: generatedRoadmap.skills,
      cvSnapshot: generatedRoadmap.cvSnapshot, // Store CV snapshot
      cvAnalysis: generatedRoadmap.cvAnalysis, // Store CV analysis
    });

    // Step 5: Save the roadmap
    const savedRoadmap = await this.roadmapRepository.save(roadmap);

    // Step 6: Return mapped DTO
    return this.mapToDto(savedRoadmap);
  }

  /**
   * Calculate the overall progress of a roadmap
   */
  private calculateProgress(skills: RoadmapSkill[]): number {
    if (!skills || skills.length === 0) {
      return 0;
    }

    // Calculate weighted progress based on skill difficulty and category
    const weightedProgress = skills.reduce((acc, skill) => {
      // Weight based on difficulty
      const difficultyWeight =
        skill.difficulty === 'expert'
          ? 2.0
          : skill.difficulty === 'advanced'
            ? 1.5
            : skill.difficulty === 'intermediate'
              ? 1.0
              : 0.75;

      // Weight based on category
      const categoryWeight =
        skill.category === 'fundamental'
          ? 0.8
          : skill.category === 'core'
            ? 1.0
            : skill.category === 'advanced'
              ? 1.2
              : 1.5;

      const weight = difficultyWeight * categoryWeight;
      const progress = skill.progress || 0;

      return acc + progress * weight;
    }, 0);

    // Calculate total weight
    const totalWeight = skills.reduce((acc, skill) => {
      const difficultyWeight =
        skill.difficulty === 'expert'
          ? 2.0
          : skill.difficulty === 'advanced'
            ? 1.5
            : skill.difficulty === 'intermediate'
              ? 1.0
              : 0.75;

      const categoryWeight =
        skill.category === 'fundamental'
          ? 0.8
          : skill.category === 'core'
            ? 1.0
            : skill.category === 'advanced'
              ? 1.2
              : 1.5;

      return acc + difficultyWeight * categoryWeight;
    }, 0);

    return totalWeight > 0 ? Math.round(weightedProgress / totalWeight) : 0;
  }

  /**
   * Map Roadmap entity to RoadmapResDto
   */
  private mapToDto(roadmap: Roadmap): RoadmapResDto {
    return {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      jobTitle: roadmap.jobTitle,
      progress: roadmap.progress,
      estimatedDuration: roadmap.estimatedDuration,
      skills: roadmap.skills || [],
      cvSnapshot: roadmap.cvSnapshot,
      cvAnalysis: roadmap.cvAnalysis,
      userId: roadmap.userId,
      jobId: roadmap.jobId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
    };
  }
}
