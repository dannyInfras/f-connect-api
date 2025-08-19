import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { Actor } from '@/shared/acl/actor.constant';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateCvChecklistReqDto } from '../dtos/req/create-cv-checklist.req';
import { UpdateCvChecklistReqDto } from '../dtos/req/update-cv-checklist.req';
import { CvChecklistResDto } from '../dtos/res/cv-checklist.res';
import { CompanyCvChecklistService } from '../services/company-cv-checklist.service';

@ApiTags('Company CV Checklists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/cv-checklists')
export class CompanyCvChecklistController {
  constructor(private readonly checklistService: CompanyCvChecklistService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new CV checklist',
    description: 'Creates a new CV screening checklist for the company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiResponse({
    status: 201,
    description: 'Checklist created successfully',
    type: CvChecklistResDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 409, description: 'Default checklist already exists' })
  async createChecklist(
    @Param('companyId') companyId: string,
    @Body() createDto: CreateCvChecklistReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CvChecklistResDto> {
    const checklist = await this.checklistService.createChecklist(
      companyId,
      createDto,
      ctx.user as Actor,
    );

    return plainToInstance(CvChecklistResDto, checklist, {
      excludeExtraneousValues: true,
    });
  }

  @Get()
  @ApiOperation({
    summary: 'Get company CV checklists',
    description: 'Retrieves all active CV checklists for the company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiResponse({
    status: 200,
    description: 'Checklists retrieved successfully',
    type: [CvChecklistResDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getChecklists(
    @Param('companyId') companyId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<CvChecklistResDto[]> {
    const checklists = await this.checklistService.findByCompanyId(
      companyId,
      ctx.user as Actor,
    );

    return plainToInstance(CvChecklistResDto, checklists, {
      excludeExtraneousValues: true,
    });
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get CV checklist by ID',
    description: 'Retrieves a specific CV checklist by its ID',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiParam({
    name: 'id',
    description: 'Checklist ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Checklist retrieved successfully',
    type: CvChecklistResDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async getChecklistById(
    @Param('id', ParseIntPipe) id: number,
    @ReqContext() ctx: RequestContext,
  ): Promise<CvChecklistResDto> {
    const checklist = await this.checklistService.findById(
      id,
      ctx.user as Actor,
    );

    return plainToInstance(CvChecklistResDto, checklist, {
      excludeExtraneousValues: true,
    });
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update CV checklist',
    description: 'Updates a CV checklist',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiParam({
    name: 'id',
    description: 'Checklist ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Checklist updated successfully',
    type: CvChecklistResDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async updateChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdateCvChecklistReqDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<CvChecklistResDto> {
    const checklist = await this.checklistService.updateChecklist(
      id,
      updateDto,
      ctx.user as Actor,
    );

    return plainToInstance(CvChecklistResDto, checklist, {
      excludeExtraneousValues: true,
    });
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete CV checklist',
    description: 'Deletes a CV checklist (cannot delete default checklist)',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiParam({
    name: 'id',
    description: 'Checklist ID',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Checklist deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete default checklist' })
  async deleteChecklist(
    @Param('id', ParseIntPipe) id: number,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    await this.checklistService.deleteChecklist(id, ctx.user as Actor);
  }

  @Post(':id/set-default')
  @ApiOperation({
    summary: 'Set checklist as default',
    description: 'Sets a checklist as the default for the company',
  })
  @ApiParam({
    name: 'companyId',
    description: 'Company ID',
    example: '123',
  })
  @ApiParam({
    name: 'id',
    description: 'Checklist ID',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Default checklist set successfully',
    type: CvChecklistResDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Checklist not found' })
  async setAsDefault(
    @Param('id', ParseIntPipe) id: number,
    @ReqContext() ctx: RequestContext,
  ): Promise<CvChecklistResDto> {
    const checklist = await this.checklistService.setAsDefault(
      id,
      ctx.user as Actor,
    );

    return plainToInstance(CvChecklistResDto, checklist, {
      excludeExtraneousValues: true,
    });
  }
}
