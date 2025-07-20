import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateRoadmapReqDto } from '../dtos/req/create-roadmap.req';
import { GenerateRoadmapReqDto } from '../dtos/req/generate-roadmap.req';
import { UpdateRoadmapReqDto } from '../dtos/req/update-roadmap.req';
import { ListRoadmapResDto } from '../dtos/res/list-roadmap.res';
import { RoadmapResDto } from '../dtos/res/roadmap.res';
import { RoadmapService } from '../services/roadmap.service';

@ApiTags('roadmaps')
@Controller('roadmaps')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class RoadmapController {
  constructor(private readonly roadmapService: RoadmapService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new roadmap' })
  @ApiBody({ type: CreateRoadmapReqDto })
  @ApiCreatedResponse({
    type: RoadmapResDto,
    description: 'The newly created roadmap',
  })
  create(
    @ReqContext() ctx: RequestContext,
    @Body() createRoadmapDto: CreateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.create(ctx.user, createRoadmapDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all roadmaps' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: ListRoadmapResDto })
  findAll(
    @ReqContext() ctx: RequestContext,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ListRoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.findAll(ctx.user, page, limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get roadmaps by user ID' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ type: ListRoadmapResDto })
  findByUserId(
    @ReqContext() ctx: RequestContext,
    @Param('userId') userId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<ListRoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.findByUserId(
      ctx.user,
      parseInt(userId, 10),
      page,
      limit,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a roadmap by ID' })
  @ApiOkResponse({ type: RoadmapResDto })
  findOne(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<RoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.findOne(ctx.user, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a roadmap' })
  @ApiBody({ type: UpdateRoadmapReqDto })
  @ApiOkResponse({ type: RoadmapResDto })
  update(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body() updateRoadmapDto: UpdateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.update(ctx.user, id, updateRoadmapDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a roadmap' })
  @ApiOkResponse({ description: 'Roadmap deleted successfully' })
  remove(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<void> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.remove(ctx.user, id);
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a roadmap using AI' })
  @ApiBody({ type: GenerateRoadmapReqDto })
  @ApiCreatedResponse({
    type: RoadmapResDto,
    description: 'AI generated roadmap',
  })
  generateRoadmap(
    @ReqContext() ctx: RequestContext,
    @Body() generateRoadmapDto: GenerateRoadmapReqDto,
  ): Promise<RoadmapResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return this.roadmapService.generateRoadmap(ctx.user, generateRoadmapDto);
  }
}
