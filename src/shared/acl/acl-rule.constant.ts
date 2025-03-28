import { ROLE } from '@/modules/auth/constants/role.constant';
import { Action } from '@/shared/acl/action.constant';
import { Actor } from '@/shared/acl/actor.constant';

/**
 * Custom rule callback definition
 */
export type RuleCallback<Resource> = (
  resource: Resource,
  actor: Actor,
) => boolean;

/**
 * ACL rule format
 */
export type AclRule<Resource> = {
  //if rule for particular role or for all role
  role: ROLE;

  //list of actions permissible
  actions: Action[];

  //specific rule there or otherwise true
  ruleCallback?: RuleCallback<Resource>;
};
