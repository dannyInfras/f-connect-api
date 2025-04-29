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
import { SkillDto } from '@/modules/candidate-profile/dtos/skill.dto';
import { SkillInputDto } from '@/modules/candidate-profile/dtos/skill-input.dto';
import { SkillService } from '@/modules/candidate-profile/services/skill.service';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('Skills')
@Controller('skills')
export class SkillController {
  constructor(
    private readonly skillService: SkillService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(SkillController.name);
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findAll(@ReqContext() ctx: RequestContext): Promise<SkillDto[]> {
    this.logger.log(ctx, `${this.findAll.name} was called`);
    return this.skillService.findAll(ctx);
  }

  @Get(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async findById(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
  ): Promise<SkillDto> {
    this.logger.log(ctx, `${this.findById.name} was called`);
    return this.skillService.findById(ctx, id);
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async create(
    @ReqContext() ctx: RequestContext,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: SkillInputDto,
  ): Promise<SkillDto> {
    this.logger.log(ctx, `${this.create.name} was called`);
    return this.skillService.createSkill(ctx, dto);
  }

  @Put(':id')
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  async update(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: string,
    @Body(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
    dto: SkillInputDto,
  ): Promise<SkillDto> {
    this.logger.log(ctx, `${this.update.name} was called`);
    return this.skillService.updateSkill(ctx, id, dto);
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
    return this.skillService.deleteSkill(ctx, id);
  }
}
