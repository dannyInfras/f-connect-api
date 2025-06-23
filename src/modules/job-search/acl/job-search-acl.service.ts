import { Injectable } from '@nestjs/common';

import { ROLE } from '@/modules/auth/constants/role.constant';
import { BaseAclService } from '@/shared/acl/acl.service';
import { Action } from '@/shared/acl/action.constant';

import { JobSearchDto } from '../dtos/job-search-input.dto';

/**
 * Access Control List service for job search operations
 * Defines permissions for different user roles regarding job search functionality
 */
@Injectable()
export class JobSearchAclService extends BaseAclService<JobSearchDto> {
  constructor() {
    super();

    // Admin users can manage all job search operations
    this.canDo(ROLE.ADMIN, [Action.Manage]);

    // Admin recruiter users can perform all job search operations
    this.canDo(ROLE.ADMIN_RECRUITER, [Action.Read, Action.List]);

    // Recruiter users can read and list job search results
    this.canDo(ROLE.RECRUITER, [Action.Read, Action.List]);

    // Regular users (candidates) can read and list job search results
    this.canDo(ROLE.USER, [Action.Read, Action.List]);
  }
}
