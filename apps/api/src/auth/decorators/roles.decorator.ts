import { SetMetadata } from '@nestjs/common';
import { Role } from '@permis2.0/types';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
