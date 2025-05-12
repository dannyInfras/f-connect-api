import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
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
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateBenefitDto, UpdateBenefitDto } from '../dtos/req/benefit.req';
import { BenefitResDto } from '../dtos/res/benefit.res';
import { BenefitService } from '../services/benefit.service';

@ApiTags('Company Benefits')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/benefits')
export class BenefitController {
  constructor(private readonly benefitService: BenefitService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new benefit' })
  @ApiResponse({ status: 201, type: BenefitResDto })
  async create(
    @Param('companyId') companyId: string,
    @Body() createBenefitDto: CreateBenefitDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<BenefitResDto>> {
    const benefit = await this.benefitService.create(
      ctx.user as Actor,
      companyId,
      createBenefitDto,
    );
    return { data: benefit, meta: {} };
  }

  @Get()
  @ApiOperation({ summary: 'Get all benefits for a company' })
  @ApiResponse({ status: 200, type: [BenefitResDto] })
  async findAll(
    @Param('companyId') companyId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<BenefitResDto[]>> {
    const benefits = await this.benefitService.findAll(
      ctx.user as Actor,
      companyId,
    );
    return { data: benefits, meta: {} };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a benefit' })
  @ApiResponse({ status: 200, type: BenefitResDto })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateBenefitDto: UpdateBenefitDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<BenefitResDto>> {
    const benefit = await this.benefitService.update(
      ctx.user as Actor,
      companyId,
      id,
      updateBenefitDto,
    );
    return { data: benefit, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a benefit' })
  @ApiResponse({ status: 200 })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    await this.benefitService.remove(ctx.user as Actor, companyId, id);
  }
}
