import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import { SchoolEnrollmentStatus, SchoolMemberRole, SchoolStudentStatus } from '@permis2.0/types';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { SchoolRolesGuard } from './guards/school-roles.guard';
import { SchoolRoles } from './decorators/school-roles.decorator';
import { SchoolService } from './school.service';
import { CreateSchoolDto } from './dto/create-school.dto';
import { UpdateSchoolDto } from './dto/update-school.dto';
import { AddSchoolMemberDto } from './dto/add-school-member.dto';
import { CreateEnrollmentRequestDto } from './dto/create-enrollment-request.dto';
import { UpdateEnrollmentStatusDto } from './dto/update-enrollment-status.dto';
import { AddStudentDto } from './dto/add-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

const STAFF_ROLES = [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER, SchoolMemberRole.SECRETARY];
const STUDENTS_VIEW_ROLES = [...STAFF_ROLES, SchoolMemberRole.INSTRUCTOR, SchoolMemberRole.COACH];
const VEHICLE_WRITE_ROLES = [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER];

@ApiTags('Schools')
@Controller('schools')
export class SchoolController {
  constructor(private schoolService: SchoolService) {}

  @Get()
  @ApiResponse({ status: 200, description: 'Active schools directory' })
  async list(
    @Query('city') city?: string,
    @Query('category') category?: string,
    @Query('maxPriceXof') maxPriceXof?: string,
    @Query('q') q?: string,
    @Query('take') take?: string
  ) {
    return this.schoolService.listActive({
      city,
      category,
      q,
      maxPriceXof: maxPriceXof ? parseInt(maxPriceXof, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
    });
  }

  @Get('mine')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Schools the current user is a staff member of' })
  async mine(@Request() req) {
    return this.schoolService.listMine(req.user.userId);
  }

  @Get('my-enrollments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Schools the current user is a STUDENT at' })
  async myEnrollments(@Request() req) {
    return this.schoolService.listMyEnrollments(req.user.userId);
  }

  @Get('my-requests')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "The current user's own pre-registration requests" })
  async myRequests(@Request() req) {
    return this.schoolService.listMyEnrollmentRequests(req.user.userId);
  }

  @Get('by-slug/:slug')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 200, description: 'School details by public slug' })
  async getBySlug(@Request() req, @Param('slug') slug: string) {
    return this.schoolService.getBySlug(slug, req.user);
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

  @Get(':schoolId/members/lookup')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Find an existing user by exact phone match, to add as staff' })
  async lookupMember(@Param('schoolId') _schoolId: string, @Query('phone') phone: string) {
    return this.schoolService.lookupUserByPhone(phone);
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

  // ─── Pré-inscription (marketplace, Phase 1) ─────────────────────────────────

  @Post(':schoolId/enrollment-requests')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiResponse({ status: 201, description: 'Pre-registration request submitted (status SENT)' })
  async submitEnrollmentRequest(
    @Request() req,
    @Param('schoolId') schoolId: string,
    @Body() dto: CreateEnrollmentRequestDto
  ) {
    return this.schoolService.submitEnrollmentRequest(schoolId, dto, req.user?.userId);
  }

  @Get(':schoolId/enrollment-requests')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Pre-registration requests for this school' })
  async listEnrollmentRequests(
    @Param('schoolId') schoolId: string,
    @Query('status') status?: SchoolEnrollmentStatus
  ) {
    return this.schoolService.listEnrollmentRequests(schoolId, status);
  }

  @Patch(':schoolId/enrollment-requests/:id/status')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Pre-registration request status updated' })
  async updateEnrollmentStatus(
    @Request() req,
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentStatusDto
  ) {
    return this.schoolService.updateEnrollmentStatus(schoolId, id, req.user.userId, dto);
  }

  // ─── Élèves (SchoolStudent) ──────────────────────────────────────────────────

  @Get(':schoolId/students')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STUDENTS_VIEW_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Students attached to this school' })
  async listStudents(
    @Param('schoolId') schoolId: string,
    @Query('status') status?: SchoolStudentStatus
  ) {
    return this.schoolService.listStudents(schoolId, status);
  }

  @Get(':schoolId/students/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STUDENTS_VIEW_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Student detail' })
  async getStudent(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.schoolService.getStudent(schoolId, id);
  }

  @Post(':schoolId/students')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Student attached directly (no enrollment request)' })
  async addStudent(@Param('schoolId') schoolId: string, @Body() dto: AddStudentDto) {
    return this.schoolService.addStudent(schoolId, dto);
  }

  @Patch(':schoolId/students/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Student status/category updated' })
  async updateStudent(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto
  ) {
    return this.schoolService.updateStudent(schoolId, id, dto);
  }

  // ─── Véhicules ────────────────────────────────────────────────────────────────

  @Get(':schoolId/vehicles')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STUDENTS_VIEW_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "This school's fleet" })
  async listVehicles(@Param('schoolId') schoolId: string) {
    return this.schoolService.listVehicles(schoolId);
  }

  @Post(':schoolId/vehicles')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...VEHICLE_WRITE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Vehicle added to the fleet' })
  async createVehicle(@Param('schoolId') schoolId: string, @Body() dto: CreateVehicleDto) {
    return this.schoolService.createVehicle(schoolId, dto);
  }

  @Patch(':schoolId/vehicles/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...VEHICLE_WRITE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Vehicle updated' })
  async updateVehicle(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto
  ) {
    return this.schoolService.updateVehicle(schoolId, id, dto);
  }

  @Delete(':schoolId/vehicles/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...VEHICLE_WRITE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Vehicle removed from the fleet' })
  async deleteVehicle(@Param('schoolId') schoolId: string, @Param('id') id: string) {
    return this.schoolService.deleteVehicle(schoolId, id);
  }
}
