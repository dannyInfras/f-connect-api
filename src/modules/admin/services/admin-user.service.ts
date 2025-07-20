import { Injectable, UnauthorizedException } from '@nestjs/common';
import { plainToClass } from 'class-transformer';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { UpdateUserInput } from '@/modules/user/dtos/user-update-input.dto';
import { UserService } from '@/modules/user/services/user.service';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';
import { AppLogger } from '@/shared/logger/logger.service';
import { RequestContext } from '@/shared/request-context/request-context.dto';

import { AdminUserOutput } from '../dtos/admin-user-output.dto';
import { AdminUsersResponseDto } from '../dtos/admin-users-response.dto';
import { UpdateAccountStatusDto } from '../dtos/update-account-status.dto';
import { UpdateUserRolesDto } from '../dtos/update-user-roles.dto';
import { AdminUserAclService } from './admin-user-acl.service';

/**
 * Service for admin user management operations
 * Provides comprehensive user management capabilities restricted to admin users
 */
@Injectable()
export class AdminUserService {
  constructor(
    private readonly userService: UserService,
    private readonly aclService: AdminUserAclService,
    private readonly logger: AppLogger,
  ) {
    this.logger.setContext(AdminUserService.name);
  }

  /**
   * Get all users with admin-visible information
   * Includes pagination and comprehensive user details
   * Excludes other admin users from the results
   */
  async getAllUsers(
    ctx: RequestContext,
    admin: Actor,
    limit: number = 20,
    offset: number = 0,
  ): Promise<AdminUsersResponseDto> {
    this.logger.log(ctx, `${this.getAllUsers.name} was called`);

    // Check if admin has permission to list users
    if (!this.aclService.forActor(admin).canDoAction(Action.List)) {
      throw new UnauthorizedException('Insufficient permissions to list users');
    }

    const { users, count } = await this.userService.getUsers(
      ctx,
      limit,
      offset,
    );

    // Filter out admin users from the results
    const nonAdminUsers = users.filter(
      (user) => !user.roles.includes(ROLE.ADMIN),
    );

    // Transform to admin output format with additional fields
    const adminUsers = plainToClass(AdminUserOutput, nonAdminUsers, {
      excludeExtraneousValues: true,
    });

    return {
      users: adminUsers,
      count: nonAdminUsers.length, // Use filtered count instead of total count
      limit,
      offset,
    };
  }

  /**
   * Get a specific user by ID with admin-visible information
   * Prevents access to other admin users
   */
  async getUserById(
    ctx: RequestContext,
    admin: Actor,
    userId: number,
  ): Promise<AdminUserOutput> {
    this.logger.log(ctx, `${this.getUserById.name} was called`);

    // Check if admin has permission to read users
    if (!this.aclService.forActor(admin).canDoAction(Action.Read)) {
      throw new UnauthorizedException('Insufficient permissions to read user');
    }

    const user = await this.userService.findById(ctx, userId);

    // Prevent access to admin users
    if (user.roles.includes(ROLE.ADMIN)) {
      throw new UnauthorizedException('Cannot access admin user details');
    }

    return plainToClass(AdminUserOutput, user, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update user roles (admin only operation)
   * Prevents modifying admin users
   */
  async updateUserRoles(
    ctx: RequestContext,
    admin: Actor,
    userId: number,
    updateRolesDto: UpdateUserRolesDto,
  ): Promise<AdminUserOutput> {
    this.logger.log(ctx, `${this.updateUserRoles.name} was called`);

    // Check if admin has permission to update users
    if (!this.aclService.forActor(admin).canDoAction(Action.Update)) {
      throw new UnauthorizedException(
        'Insufficient permissions to update user roles',
      );
    }

    // First, get the current user to check if they're an admin
    const currentUser = await this.userService.findById(ctx, userId);
    if (currentUser.roles.includes(ROLE.ADMIN)) {
      throw new UnauthorizedException('Cannot modify admin user roles');
    }

    // Use the existing updateUser method from UserService
    const updateData: any = { roles: updateRolesDto.roles };
    const updatedUser = await this.userService.updateUser(
      ctx,
      userId,
      updateData,
    );

    this.logger.log(
      ctx,
      `User ${userId} roles updated to: ${updateRolesDto.roles.join(', ')}`,
    );

    return plainToClass(AdminUserOutput, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Update user account status (enable/disable account)
   * Prevents modifying admin users
   */
  async updateAccountStatus(
    ctx: RequestContext,
    admin: Actor,
    userId: number,
    updateStatusDto: UpdateAccountStatusDto,
  ): Promise<AdminUserOutput> {
    this.logger.log(ctx, `${this.updateAccountStatus.name} was called`);

    // Check if admin has permission to update users
    if (!this.aclService.forActor(admin).canDoAction(Action.Update)) {
      throw new UnauthorizedException(
        'Insufficient permissions to update account status',
      );
    }

    // First, get the current user to check if they're an admin
    const currentUser = await this.userService.findById(ctx, userId);
    if (currentUser.roles.includes(ROLE.ADMIN)) {
      throw new UnauthorizedException(
        'Cannot modify admin user account status',
      );
    }

    // Use the existing verifyUser method from UserService
    await this.userService.verifyUser(
      ctx,
      userId,
      updateStatusDto.isAccountDisabled,
    );

    // Get the updated user data
    const updatedUser = await this.userService.findById(ctx, userId);

    const statusAction = updateStatusDto.isAccountDisabled
      ? 'disabled'
      : 'enabled';
    this.logger.log(ctx, `User ${userId} account ${statusAction}`);

    return plainToClass(AdminUserOutput, updatedUser, {
      excludeExtraneousValues: true,
    });
  }

  /**
   * Search users by various criteria (for future enhancement)
   * This method can be extended to support filtering by roles, account status, etc.
   */
  async searchUsers(
    ctx: RequestContext,
    admin: Actor,
    searchCriteria: {
      roles?: string[];
      isAccountDisabled?: boolean;
      provider?: 'local' | 'google';
    },
    limit: number = 20,
    offset: number = 0,
  ): Promise<AdminUsersResponseDto> {
    this.logger.log(ctx, `${this.searchUsers.name} was called`);

    // Check if admin has permission to list users
    if (!this.aclService.forActor(admin).canDoAction(Action.List)) {
      throw new UnauthorizedException(
        'Insufficient permissions to search users',
      );
    }

    // For now, return all non-admin users. This can be enhanced to support filtering
    // when the UserRepository supports more complex queries
    return this.getAllUsers(ctx, admin, limit, offset);
  }
}
