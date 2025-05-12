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
import { BaseApiResponse } from '@/shared/dtos/base-api-response.dto';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { CreateCoreTeamDto, UpdateCoreTeamDto } from '../dtos/req/coreteam.req';
import { CoreTeamMemberResDto } from '../dtos/res/core-team.res';
import { CoreTeamService } from '../services/core-team.service';

@ApiTags('Company Core Team')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('companies/:companyId/core-team')
export class CoreTeamController {
  constructor(private readonly coreTeamService: CoreTeamService) {}

  private getActor(ctx: RequestContext): Actor {
    if (!ctx.user) {
      throw new UnauthorizedException('User must be logged in');
    }
    return ctx.user;
  }

  @Post()
  @ApiOperation({ summary: 'Add a core team member' })
  @ApiResponse({ status: 201, type: CoreTeamMemberResDto })
  async create(
    @Param('companyId') companyId: string,
    @Body() createCoreTeamDto: CreateCoreTeamDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CoreTeamMemberResDto>> {
    const member = await this.coreTeamService.create(
      this.getActor(ctx),
      companyId,
      createCoreTeamDto,
    );
    return { data: member, meta: {} };
  }

  @Get()
  @ApiOperation({ summary: 'Get all core team members' })
  @ApiResponse({ status: 200, type: [CoreTeamMemberResDto] })
  async findAll(
    @Param('companyId') companyId: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CoreTeamMemberResDto[]>> {
    const members = await this.coreTeamService.findAll(
      this.getActor(ctx),
      companyId,
    );
    return { data: members, meta: {} };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a core team member' })
  @ApiResponse({ status: 200, type: CoreTeamMemberResDto })
  async update(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @Body() updateCoreTeamDto: UpdateCoreTeamDto,
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<CoreTeamMemberResDto>> {
    const member = await this.coreTeamService.update(
      this.getActor(ctx),
      companyId,
      id,
      updateCoreTeamDto,
    );
    return { data: member, meta: {} };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remove a core team member' })
  @ApiResponse({ status: 200 })
  async remove(
    @Param('companyId') companyId: string,
    @Param('id') id: string,
    @ReqContext() ctx: RequestContext,
  ): Promise<void> {
    await this.coreTeamService.remove(this.getActor(ctx), companyId, id);
  }
}
