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
import { CandidateProfileInputDto } from '@/modules/candidate-profile/dtos/candidate-profile-input.dto';
import { CandidateProfileResponseDto } from '@/modules/candidate-profile/dtos/candidate-profile-response.dto';
import { CandidateProfileService } from '@/modules/candidate-profile/services/candidate-profile.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('Candidate Profiles')
@Controller('candidate-profile')
export class CandidateProfileController {
  constructor(
    private readonly candidateProfileService: CandidateProfileService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(CandidateProfileController.name);
  }

  @Get('me')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getCurrentUserProfile(
    @ReqContext() ctx: RequestContext,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.getCurrentUserProfile.name} was called`);
    return this.candidateProfileService.getCurrentUserProfile(ctx);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async getProfile(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.getProfile.name} was called`);
    return this.candidateProfileService.getProfileById(ctx, id);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async createProfile(
    @ReqContext() ctx: RequestContext,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CandidateProfileInputDto,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.createProfile.name} was called`);
    return this.candidateProfileService.createProfile(ctx, dto);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: CandidateProfileInputDto,
  ): Promise<CandidateProfileResponseDto> {
    this.logger.log(ctx, `${this.updateProfile.name} was called`);
    return this.candidateProfileService.updateProfile(ctx, id, dto);
  }

  @Delete(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async deleteProfile(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<{ deleted: boolean }> {
    this.logger.log(ctx, `${this.deleteProfile.name} was called`);
    return this.candidateProfileService.deleteProfile(ctx, id);
  }
}
