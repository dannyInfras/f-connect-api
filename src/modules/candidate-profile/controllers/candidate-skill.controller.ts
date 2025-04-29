import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CandidateSkillDto } from '@/modules/candidate-profile/dtos/candidate-skill.dto';
import { CandidateSkillInputDto } from '@/modules/candidate-profile/dtos/candidate-skill-input.dto';
import { CandidateSkillService } from '@/modules/candidate-profile/services/candidate-skill.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('Candidate Skills')
@Controller('candidate-skills')
export class CandidateSkillController {
  constructor(
    private readonly candidateSkillService: CandidateSkillService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CandidateSkillController.name);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);
    return this.candidateSkillService.findById(ctx, id);
  }

  @Get('candidate-profile/:candidateProfileId')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findByCandidateProfile(
    @ReqContext() ctx: RequestContext,
    @Param('candidateProfileId') candidateProfileId: string,
  ): Promise<CandidateSkillDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);
    return this.candidateSkillService.findByCandidateProfile(
      ctx,
      candidateProfileId,
    );
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @ReqContext() ctx: RequestContext,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CandidateSkillInputDto,
  ): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.create.name} was called`);
    return this.candidateSkillService.create(ctx, dto);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CandidateSkillInputDto,
  ): Promise<CandidateSkillDto> {
    this.logger.log(ctx, `${this.update.name} was called`);
    return this.candidateSkillService.update(ctx, id, dto);
  }

  @Delete(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async delete(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.delete.name} was called`);
    return this.candidateSkillService.delete(ctx, id);
  }
}
