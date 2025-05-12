import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';

import { CategoryAclService } from '../acl/category.acl';
import { CreateCategoryReqDto } from '../dtos/req/create-category.req';
import { UpdateCategoryDto } from '../dtos/req/update-category.req';
import { CategoryResponseDto } from '../dtos/res/create-category.res';
import { Category } from '../entities/category.entity';
import { CategoryRepository } from '../repositories/category.repository';

@Injectable()
export class CategoryService {
  constructor(
    private repository: CategoryRepository,
    private aclService: CategoryAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CategoryService.name);
  }

  async create(
    actor: Actor,
    dto: CreateCategoryReqDto,
  ): Promise<CategoryResponseDto> {
    if (!this.aclService.forActor(actor).canDoAction(Action.Create)) {
      throw new UnauthorizedException('Not authorized to create categories');
    }

    const existing = await this.repository.getByName(dto.name);
    if (existing) {
      throw new ConflictException('Category with this name already exists');
    }

    const category = await this.repository.save(dto);
    return this.mapToResponse(category);
  }

  async findAll(actor: Actor): Promise<CategoryResponseDto[]> {
    if (!this.aclService.forActor(actor).canDoAction(Action.List)) {
      throw new UnauthorizedException('Not authorized to list categories');
    }

    const categories = await this.repository.find({
      order: { name: 'ASC' },
    });
    return categories.map((category) => this.mapToResponse(category));
  }

  async findOne(actor: Actor, id: string): Promise<CategoryResponseDto> {
    const category = await this.repository.getById(id);

    if (!this.aclService.forActor(actor).canDoAction(Action.Read)) {
      throw new UnauthorizedException('Not authorized to view categories');
    }

    return this.mapToResponse(category);
  }

  async update(
    actor: Actor,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    if (!this.aclService.forActor(actor).canDoAction(Action.Update)) {
      throw new UnauthorizedException('Not authorized to update categories');
    }

    const category = await this.repository.getById(id);

    if (dto.name && dto.name !== category.name) {
      const existing = await this.repository.getByName(dto.name);
      if (existing) {
        throw new ConflictException('Category with this name already exists');
      }
    }

    const updated = await this.repository.save({
      ...category,
      ...dto,
    });

    return this.mapToResponse(updated);
  }

  async remove(actor: Actor, id: string): Promise<void> {
    if (!this.aclService.forActor(actor).canDoAction(Action.Delete)) {
      throw new UnauthorizedException('Not authorized to delete categories');
    }

    const category = await this.repository.getById(id);
    await this.repository.remove(category);
  }

  private mapToResponse(category: Category): CategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      createdAt: category.createdAt,
    };
  }
}
