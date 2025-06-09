import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CvAclService } from '../acl/cv.acl';
import { CreateCvReqDto } from '../dtos/req/create-cv.req';
import { UpdateCvReqDto } from '../dtos/req/update-cv.req';
import { CvResDto } from '../dtos/res/cv.res';
import { ListCvResDto } from '../dtos/res/list-cv.res';
import { CvService } from '../services/cv.service';

@ApiTags('CVs')
@Controller('cvs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class CvController {
  constructor(
    private readonly cvService: CvService,
    private readonly cvAclService: CvAclService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new CV' })
  @ApiResponse({
    status: 201,
    description: 'CV created successfully',
    type: CvResDto,
  })
  async create(
    @Body() createCvDto: CreateCvReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CvResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    await this.cvAclService.canCreate(ctx.user, {
      ...createCvDto,
      userId: ctx.user.id,
    } as any);
    const createdCv = await this.cvService.create(createCvDto);
    return {
      data: createdCv,
      meta: {},
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all CVs' })
  @ApiResponse({ status: 200, type: ListCvResDto })
  async findAll(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<ListCvResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    await this.cvAclService.canList(ctx.user);
    const page = Math.floor(query.offset / query.limit) + 1;
    return this.cvService.findAll(page, query.limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get all CVs for a user' })
  @ApiResponse({ status: 200, type: ListCvResDto })
  async findByUser(
    @Param('userId') userId: string,
    @Query() query: PaginationParamsDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<ListCvResDto> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    await this.cvAclService.canList(ctx.user, Number(userId));
    return this.cvService.findByUserId(
      ctx.user,
      Number(userId),
      query.limit,
      query.offset,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a CV by ID' })
  @ApiResponse({ status: 200, type: CvResDto })
  async findOne(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CvResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const cv = await this.cvService.findOne(id);
    await this.cvAclService.canView(ctx.user, cv);
    return {
      data: cv,
      meta: {},
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a CV' })
  @ApiResponse({ status: 200, type: CvResDto })
  async update(
    @Param('id') id: string,
    @Body() updateCvDto: UpdateCvReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CvResDto>> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const cv = await this.cvService.findOne(id);
    await this.cvAclService.canUpdate(ctx.user, cv);
    const updatedCv = await this.cvService.update(id, updateCvDto);
    return {
      data: updatedCv,
      meta: {},
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a CV' })
  @ApiResponse({ status: 204 })
  async remove(
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    const cv = await this.cvService.findOne(id);
    await this.cvAclService.canDelete(ctx.user, cv);
    return this.cvService.remove(id);
  }
}
