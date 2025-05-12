import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Actor } from '@/shared/acl/actor.constant';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateCategoryReqDto } from '../dtos/req/create-category.req';
import { UpdateCategoryDto } from '../dtos/req/update-category.req';
import { CategoryResponseDto } from '../dtos/res/create-category.res';
import { CategoryService } from '../services/category.service';

@ApiTags('Categories')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new category (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Category created successfully',
    type: CategoryResponseDto,
    schema: {
      example: CategoryResponseDto.example,
    },
  })
  async create(
    @Body() dto: CreateCategoryReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CategoryResponseDto> {
    const actor = this.getActor(ctx);
    return this.categoryService.create(actor, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'List all categories',
    type: [CategoryResponseDto],
    schema: {
      example: [CategoryResponseDto.example],
    },
  })
  async findAll(
    @ReqContext() ctx: RequestContext,
  ): Promise<CategoryResponseDto[]> {
    const actor = this.getActor(ctx);
    return this.categoryService.findAll(actor);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get category by ID' })
  @ApiResponse({
    status: 200,
    description: 'Category found successfully',
    type: CategoryResponseDto,
    schema: {
      example: CategoryResponseDto.example,
    },
  })
  async findOne(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<CategoryResponseDto> {
    const actor = this.getActor(ctx);
    return this.categoryService.findOne(actor, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category updated successfully',
    type: CategoryResponseDto,
    schema: {
      example: CategoryResponseDto.example,
    },
  })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CategoryResponseDto> {
    const actor = this.getActor(ctx);
    return this.categoryService.update(actor, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete category (Admin only)' })
  @ApiResponse({
    status: 200,
    description: 'Category deleted successfully',
  })
  async remove(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    const actor = this.getActor(ctx);
    await this.categoryService.remove(actor, id);
  }

  private getActor(ctx: RequestContext): Actor {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return ctx.user as Actor;
  }
}
