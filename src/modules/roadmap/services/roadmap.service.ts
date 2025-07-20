import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

import { CvService } from '../../cv/services/cv.service';
import { RoadmapAclService } from '../acl/roadmap.acl';
import { CreateRoadmapReqDto } from '../dtos/req/create-roadmap.req';
import { GenerateRoadmapReqDto } from '../dtos/req/generate-roadmap.req';
import { UpdateRoadmapReqDto } from '../dtos/req/update-roadmap.req';
import { ListRoadmapResDto } from '../dtos/res/list-roadmap.res';
import { RoadmapResDto } from '../dtos/res/roadmap.res';
import { Roadmap, RoadmapSkill, RoadmapTask } from '../entities/roadmap.entity';
import { RoadmapRepository } from '../repositories/roadmap.repository';
import { RoadmapAiService } from './roadmap-ai.service';

@Injectable()
export class RoadmapService {
  constructor(
    private readonly roadmapRepository: RoadmapRepository,
    private readonly aclService: RoadmapAclService,
    private readonly aiService: RoadmapAiService,
    private readonly cvService: CvService,
  ) {}

  async create(actor: Actor, createRoadmapDto: CreateRoadmapReqDto): Promise<RoadmapResDto> {
    // Create a new roadmap entity
    const roadmap = this.roadmapRepository.create({
      ...createRoadmapDto,
      userId: actor.id,
      progress: 0,
      skills: [],
    });

    // If CV ID is provided, get the CV name
    if (createRoadmapDto.cvId) {
      try {
        const cv = await this.cvService.findOne(createRoadmapDto.cvId);
        roadmap.cvName = cv.title || 'Unnamed CV';
      } catch (error) {
        // If CV not found, continue without setting cvName
      }
    }

    // Save the roadmap
    const savedRoadmap = await this.roadmapRepository.save(roadmap);
    return this.mapToDto(savedRoadmap);
  }

  async findAll(
    actor: Actor,
    page = 1,
    limit = 10,
  ): Promise<ListRoadmapResDto> {
    const offset = (page - 1) * limit;
    const [roadmaps, total] = await this.roadmapRepository.findAndCount({
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

  async findByUserId(
    actor: Actor,
    userId: number,
    page = 1,
    limit = 10,
  ): Promise<ListRoadmapResDto> {
    const offset = (page - 1) * limit;
    const [roadmaps, total] = await this.roadmapRepository.findByUserId(
      userId,
      limit,
      offset,
    );

    if (!roadmaps.length) {
      return {
        items: [],
        meta: {
          total: 0,
          page,
          limit,
        },
      };
    }

    // Check permissions for each roadmap
    roadmaps.forEach((roadmap) => {
      if (!this.aclService.forActor(actor).canDoAction(Action.Read, roadmap)) {
        throw new UnauthorizedException(
          'You do not have permission to view these roadmaps',
        );
      }
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
    const updatedRoadmap = this.roadmapRepository.merge(roadmap, updateRoadmapDto);
    
    // Calculate progress if skills are provided
    if (updateRoadmapDto.skills) {
      updatedRoadmap.progress = this.calculateProgress(updatedRoadmap.skills);
    }

    // Save updated roadmap
    const savedRoadmap = await this.roadmapRepository.save(updatedRoadmap);
    return this.mapToDto(savedRoadmap);
  }

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

  async generateRoadmap(
    actor: Actor,
    generateDto: GenerateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    // Fetch CV data
    const cv = await this.cvService.findOne(generateDto.cvId);

    // Check if actor has permission to access this CV
    if (cv.userId !== actor.id && !actor.roles.includes('admin')) {
      throw new UnauthorizedException(
        'You do not have permission to access this CV',
      );
    }

    // Fetch job details (you'll need to implement a job service)
    // For now, we'll use a simple object with the job title
    const jobDetails = {
      title: generateDto.jobTitle || 'Unknown Position',
      description: 'Job description would go here',
      requirements: 'Job requirements would go here',
    };

    // Generate roadmap using AI
    const generatedRoadmap = await this.aiService.generateRoadmap(cv, jobDetails);

    // Create a new roadmap entity
    const roadmap = this.roadmapRepository.create({
      title: generatedRoadmap.title,
      description: generatedRoadmap.description,
      userId: actor.id,
      cvId: generateDto.cvId,
      cvName: cv.title || 'Unnamed CV',
      jobId: generateDto.jobId,
      jobTitle: generateDto.jobTitle || 'Unknown Position',
      progress: 0,
      skills: generatedRoadmap.skills,
    });

    // Save the roadmap
    const savedRoadmap = await this.roadmapRepository.save(roadmap);
    return this.mapToDto(savedRoadmap);
  }

  /**
   * Calculate the overall progress of a roadmap based on its skills
   */
  private calculateProgress(skills: RoadmapSkill[]): number {
    if (!skills || skills.length === 0) {
      return 0;
    }

    // Calculate progress for each skill
    const skillProgresses = skills.map(skill => {
      // Calculate task completion
      const totalTasks = skill.tasks?.length || 0;
      const completedTasks = skill.tasks?.filter((task: RoadmapTask) => task.completed)?.length || 0;
      
      // Calculate test completion
      const testCompleted = skill.test?.completed ? 1 : 0;
      const totalTests = skill.test ? 1 : 0;

      // Combine task and test completion
      const totalItems = totalTasks + totalTests;
      const completedItems = completedTasks + testCompleted;

      return totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
    });

    // Calculate average progress across all skills
    const totalProgress = skillProgresses.reduce((sum, progress) => sum + progress, 0);
    return Math.round(totalProgress / skills.length);
  }

  /**
   * Map Roadmap entity to RoadmapResDto
   */
  private mapToDto(roadmap: Roadmap): RoadmapResDto {
    return {
      id: roadmap.id,
      title: roadmap.title,
      description: roadmap.description,
      cvName: roadmap.cvName || 'Unnamed CV',
      jobTitle: roadmap.jobTitle,
      progress: roadmap.progress,
      skills: roadmap.skills || [],
      userId: roadmap.userId,
      cvId: roadmap.cvId,
      jobId: roadmap.jobId,
      createdAt: roadmap.createdAt,
      updatedAt: roadmap.updatedAt,
    };
  }
} 