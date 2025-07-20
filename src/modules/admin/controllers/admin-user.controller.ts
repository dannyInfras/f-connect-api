import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
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
import {
  BaseApiErrorResponse,
  BaseApiResponse,
  SwaggerBaseApiResponse,
} from '@/shared/dtos/base-api-response.dto';
import { PaginationParamsDto } from '@/shared/dtos/pagination-params.dto';
import { AppLogger } from '@/shared/logger/logger.service';
import { ReqContext } from '@/shared/request-context/req-context.decorator';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { AdminUserOutput } from '../dtos/admin-user-output.dto';
import { AdminUsersResponseDto } from '../dtos/admin-users-response.dto';
import { UpdateAccountStatusDto } from '../dtos/update-account-status.dto';
import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { AdminUserService } from '../services/admin-user.service';

/**
 * Admin User Management Controller
 * Provides comprehensive user management capabilities for administrators
 */
@ApiTags('Admin User Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
@Roles(ROLE.ADMIN)
export class AdminUserController {
  constructor(
    private readonly adminUserService: AdminUserService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminUserController.name);
  }

  /**
   * Get all users with admin-visible information
   * Supports pagination for handling large user lists
   */
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description:
      'Retrieve a paginated list of all users with comprehensive admin information',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminUsersResponseDto),
    description: 'List of users retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getAllUsers(
    @ReqContext() ctx: RequestContext,
    @Query() paginationDto: PaginationParamsDto,
  ): Promise<BaseApiResponse<AdminUsersResponseDto>> {
    this.logger.log(ctx, `${this.getAllUsers.name} was called`);

    const result = await this.adminUserService.getAllUsers(
      ctx,
      ctx.user!,
      paginationDto.limit,
      paginationDto.offset,
    );

    return {
      data: result,
      meta: {
        apiVersion: '1.0',
      },
    };
  }

  /**
   * Get a specific user by ID with admin-visible information
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description: 'Retrieve detailed information about a specific user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminUserOutput),
    description: 'User details retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async getUserById(
    @ReqContext() ctx: RequestContext,
    @Param('id', ParseIntPipe) userId: number,
  ): Promise<BaseApiResponse<AdminUserOutput>> {
    this.logger.log(ctx, `${this.getUserById.name} was called`);

    const user = await this.adminUserService.getUserById(
      ctx,
      ctx.user!,
      userId,
    );

    return {
      data: user,
      meta: {
        apiVersion: '1.0',
      },
    };
  }

  /**
   * Update user roles (admin only operation)
   */
  @Patch(':id/roles')
  @ApiOperation({
    summary: 'Update user roles',
    description: 'Update the roles assigned to a specific user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminUserOutput),
    description: 'User roles updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async updateUserRoles(
    @ReqContext() ctx: RequestContext,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateRolesDto: UpdateUserRolesDto,
  ): Promise<BaseApiResponse<AdminUserOutput>> {
    this.logger.log(ctx, `${this.updateUserRoles.name} was called`);

    const updatedUser = await this.adminUserService.updateUserRoles(
      ctx,
      ctx.user!,
      userId,
      updateRolesDto,
    );

    return {
      data: updatedUser,
      meta: {
        apiVersion: '1.0',
      },
    };
  }

  /**
   * Update user account status (enable/disable account)
   */
  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update account status',
    description: 'Enable or disable a user account',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminUserOutput),
    description: 'Account status updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async updateAccountStatus(
    @ReqContext() ctx: RequestContext,
    @Param('id', ParseIntPipe) userId: number,
    @Body() updateStatusDto: UpdateAccountStatusDto,
  ): Promise<BaseApiResponse<AdminUserOutput>> {
    this.logger.log(ctx, `${this.updateAccountStatus.name} was called`);

    const updatedUser = await this.adminUserService.updateAccountStatus(
      ctx,
      ctx.user!,
      userId,
      updateStatusDto,
    );

    return {
      data: updatedUser,
      meta: {
        apiVersion: '1.0',
      },
    };
  }

  /**
   * Search users with filtering capabilities
   * This endpoint can be extended to support more advanced filtering
   */
  @Get('search')
  @ApiOperation({
    summary: 'Search users',
    description:
      'Search users with optional filtering by roles, account status, or provider',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    type: SwaggerBaseApiResponse(AdminUsersResponseDto),
    description: 'Search results retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    type: BaseApiErrorResponse,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    type: BaseApiErrorResponse,
  })
  async searchUsers(
    @ReqContext() ctx: RequestContext,
    @Query() paginationDto: PaginationParamsDto,
    @Query('roles') roles?: string,
    @Query('isAccountDisabled') isAccountDisabled?: boolean,
    @Query('provider') provider?: 'local' | 'google',
  ): Promise<BaseApiResponse<AdminUsersResponseDto>> {
    this.logger.log(ctx, `${this.searchUsers.name} was called`);

    const searchCriteria = {
      roles: roles ? roles.split(',') : undefined,
      isAccountDisabled,
      provider,
    };

    const result = await this.adminUserService.searchUsers(
      ctx,
      ctx.user!,
      searchCriteria,
      paginationDto.limit,
      paginationDto.offset,
    );

    return {
      data: result,
      meta: {
        apiVersion: '1.0',
      },
    };
  }
}
