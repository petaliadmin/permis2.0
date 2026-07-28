import { SetMetadata } from '@nestjs/common';
import { SchoolMemberRole } from '@permis2.0/types';

export const SCHOOL_ROLES_KEY = 'schoolRoles';

/**
 * Tenant-scoped RBAC axis, independent from the platform-level `@Roles()`.
 * Requires a `:schoolId` route param — see SchoolRolesGuard.
 */
export const SchoolRoles = (...roles: SchoolMemberRole[]) => SetMetadata(SCHOOL_ROLES_KEY, roles);
