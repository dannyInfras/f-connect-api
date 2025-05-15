import {
  Body,
  ClassSerializerInterceptor,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  UseInterceptors,
  ValidationPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { EducationDto } from '@/modules/education/dtos/education.dto';
import { EducationInputDto } from '@/modules/education/dtos/education-input.dto';
import { EducationService } from '@/modules/education/services/education.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('Education')
@Controller('education')
export class EducationController {
  constructor(
    private readonly educationService: EducationService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(EducationController.name);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<EducationDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);
    return this.educationService.findById(ctx, id);
  }

  @Get('candidate-profile/:candidateProfileId')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findByCandidateProfile(
    @ReqContext() ctx: RequestContext,
    @Param('candidateProfileId') candidateProfileId: string,
  ): Promise<EducationDto[]> {
    this.logger.log(ctx, `${this.findByCandidateProfile.name} was called`);
    return this.educationService.findByCandidateProfile(
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
    dto: EducationInputDto,
  ): Promise<EducationDto> {
    this.logger.log(ctx, `${this.create.name} was called`);
    return this.educationService.createEducation(ctx, dto);
  }

  @Patch(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: EducationInputDto,
  ): Promise<EducationDto> {
    this.logger.log(ctx, `${this.update.name} was called`);
    return this.educationService.updateEducation(ctx, id, dto);
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
    return this.educationService.deleteEducation(ctx, id);
  }
}
