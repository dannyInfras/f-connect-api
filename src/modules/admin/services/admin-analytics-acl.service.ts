import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

/**
 * Access Control List service for admin analytics operations
 * Restricts all analytics operations to ADMIN role only
 */
@Injectable()
export class AdminAnalyticsAclService extends BaseAclService<any> {
  constructor() {
    super();
    // Only ADMIN users can perform any analytics operations
    this.canDo(ROLE.ADMIN, [Action.Manage]);
  }
}
