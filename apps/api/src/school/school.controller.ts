import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolMemberRole } from '@permis2.0/types';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SchoolRolesGuard } from './guards/school-roles.guard';
import { SchoolRoles } from './decorators/school-roles.decorator';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AddSchoolMemberDto } from './dto/add-school-member.dto';

@ApiTags('Schools')
@Controller('schools')
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Active schools directory' })
  async list(@Query('city') city?: string, @Query('q') q?: string) {
    return this.schoolService.listActive({ city, q });
  }

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Schools the current user is a staff member of' })
  async mine(@Request() req) {
    return this.schoolService.listMine(req.user.userId);
  }

  @Get(':schoolId')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'School details' })
  async getOne(@Request() req, @Param('schoolId') schoolId: string) {
    return this.schoolService.getOne(schoolId, req.user);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'School created (PENDING), caller becomes OWNER' })
  async create(@Request() req, @Body() dto: CreateSchoolDto) {
    return this.schoolService.create(req.user.userId, dto);
  }

  @Patch(':schoolId')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'School profile updated' })
  async update(@Param('schoolId') schoolId: string, @Body() dto: UpdateSchoolDto) {
    return this.schoolService.update(schoolId, dto);
  }

  @Get(':schoolId/members')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Active staff members' })
  async listMembers(@Param('schoolId') schoolId: string) {
    return this.schoolService.listMembers(schoolId);
  }

  @Post(':schoolId/members')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Staff member attached to the school' })
  async addMember(@Param('schoolId') schoolId: string, @Body() dto: AddSchoolMemberDto) {
    return this.schoolService.addMember(schoolId, dto);
  }

  @Delete(':schoolId/members/:membershipId')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Staff member deactivated (soft)' })
  async removeMember(
    @Param('schoolId') schoolId: string,
    @Param('membershipId') membershipId: string
  ) {
    return this.schoolService.removeMember(schoolId, membershipId);
  }
}
