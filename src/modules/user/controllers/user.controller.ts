import {
  BadRequestException,
  Body,
  ClassSerializerInterceptor,
  Controller,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { Roles } from '@/modules/auth/decorators/role.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/modules/auth/guards/roles.guard';
import { ChangePasswordDto } from '@/modules/user/dtos/user-change-password.dto';
import { UserOutput } from '@/modules/user/dtos/user-output.dto';
import { UpdateUserInput } from '@/modules/user/dtos/user-update-input.dto';
import { UserService } from '@/modules/user/services/user.service';
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(UserController.name);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(ClassSerializerInterceptor)
  @Get('me')
  @ApiOperation({
    summary: 'Get user me API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserOutput),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  async getMyProfile(
    @ReqContext() ctx: RequestContext,
  ): Promise<BaseApiResponse<UserOutput>> {
    this.logger.log(ctx, `${this.getMyProfile.name} was called`);

    const user = await this.userService.findById(ctx, ctx.user!.id);
    return { data: user, meta: {} };
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @Get()
  @ApiOperation({
    summary: 'Get users as a list API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse([UserOutput]),
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(ROLE.ADMIN, ROLE.USER)
  @ApiBearerAuth()
  async getUsers(
    @ReqContext() ctx: RequestContext,
    @Query() query: PaginationParamsDto,
  ): Promise<BaseApiResponse<UserOutput[]>> {
    this.logger.log(ctx, `${this.getUsers.name} was called`);

    const { users, count } = await this.userService.getUsers(
      ctx,
      query.limit,
      query.offset,
    );

    return { data: users, meta: { count } };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('ai-points')
  @ApiOperation({ summary: 'Get current AI points balance' })
  @ApiResponse({
    status: 200,
    description: 'Returns current AI points',
    schema: {
      type: 'object',
      properties: {
        points: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  })
  async getAiPoints(@ReqContext() ctx: RequestContext) {
    // Safely extract and validate user ID from JWT payload
    if (!ctx.user || !ctx.user.id) {
      throw new UnauthorizedException('User not authenticated');
    }

    const userId = parseInt(ctx.user.id.toString(), 10);
    if (isNaN(userId) || userId <= 0) {
      console.error('Invalid user ID detected:', {
        original: ctx.user.id,
        parsed: userId,
        isNaN: isNaN(userId),
        isPositive: userId > 0,
      });
      throw new BadRequestException(`Invalid user ID in token: ${ctx.user.id}`);
    }

    const points = await this.userService.getAiPoints(userId);
    return {
      points,
      userId,
    };
  }

  // TODO: ADD RoleGuard
  // NOTE : This can be made a admin only endpoint. For normal users they can use GET /me
  @UseInterceptors(ClassSerializerInterceptor)
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by id API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  async getUser(
    @ReqContext() ctx: RequestContext,
    @Param('id') id: number,
  ): Promise<BaseApiResponse<UserOutput>> {
    this.logger.log(ctx, `${this.getUser.name} was called`);

    const user = await this.userService.getUserById(ctx, id);
    return { data: user, meta: {} };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch()
  @ApiOperation({
    summary: 'Update current user API',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(UserOutput),
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiResponse,
  })
  @UseInterceptors(ClassSerializerInterceptor)
  async updateUser(
    @ReqContext() ctx: RequestContext,
    @Body() input: UpdateUserInput,
  ): Promise<BaseApiResponse<UserOutput>> {
    this.logger.log(ctx, `${this.updateUser.name} was called`);

    const user = await this.userService.updateUser(ctx, ctx.user!.id, input);
    return { data: user, meta: {} };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('add-ai-points')
  @ApiOperation({ summary: 'Add AI points to user account' })
  @ApiResponse({
    status: 200,
    description: 'AI points added successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
        newPoints: { type: 'number' },
        userId: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
    description: 'User not found or invalid points amount',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  async addAiPoints(
    @ReqContext() ctx: RequestContext,
    @Body() body: { points: number },
  ) {
    this.logger.log(ctx, `${this.addAiPoints.name} was called`);

    if (!body.points || body.points <= 0) {
      return {
        message: 'Points must be a positive number',
        success: false,
      };
    }

    const updatedUser = await this.userService.addAiPoints(
      ctx.user!.id,
      body.points,
    );

    return {
      message: 'AI points added successfully',
      success: true,
      newPoints: updatedUser.point,
      userId: ctx.user!.id,
    };
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change user password securely' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully changed',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        success: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
    description:
      'Invalid input, password confirmation mismatch, or current password is incorrect',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  async changePassword(
    @ReqContext() ctx: RequestContext,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string; success: boolean }> {
    this.logger.log(ctx, `${this.changePassword.name} was called`);

    if (changePasswordDto.newPassword !== changePasswordDto.confirmPassword) {
      return {
        message: 'New password and confirmation password do not match',
        success: false,
      };
    }

    await this.userService.changePassword(
      ctx,
      ctx.user!.id,
      changePasswordDto.currentPassword,
      changePasswordDto.newPassword,
    );

    return {
      message: 'Password changed successfully',
      success: true,
    };
  }
}
