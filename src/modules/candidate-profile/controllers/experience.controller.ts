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
import { ExperienceDto } from '@/modules/candidate-profile/dtos/experience.dto';
import { ExperienceInputDto } from '@/modules/candidate-profile/dtos/experience-input.dto';
import { ExperienceService } from '@/modules/candidate-profile/services/experience.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('Experiences')
@Controller('experiences')
export class ExperienceController {
  constructor(
    private readonly experienceService: ExperienceService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(ExperienceController.name);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);
    return this.experienceService.findById(ctx, id);
  }

  @Get('candidate-profile/:candidateProfileId')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findByCandidateProfile(
    @ReqContext() ctx: RequestContext,
    @Param('candidateProfileId') candidateProfileId: string,
  ): Promise<ExperienceDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);
    return this.experienceService.findByCandidateProfile(
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
    dto: ExperienceInputDto,
  ): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.create.name} was called`);
    return this.experienceService.createExperience(ctx, dto);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: ExperienceInputDto,
  ): Promise<ExperienceDto> {
    this.logger.log(ctx, `${this.update.name} was called`);
    return this.experienceService.updateExperience(ctx, id, dto);
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
    return this.experienceService.deleteExperience(ctx, id);
  }
}
