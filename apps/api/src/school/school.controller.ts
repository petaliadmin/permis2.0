import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  SchoolEnrollmentStatus,
  SchoolMemberRole,
  SchoolPaymentStatus,
  SchoolStudentStatus,
} from '@permis2.0/types';
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
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { BulkAddStudentsDto } from './dto/bulk-add-students.dto';
import { BulkAddMembersDto } from './dto/bulk-add-members.dto';
import { BulkCreateVehiclesDto } from './dto/bulk-create-vehicles.dto';
import { SendPaymentEmailDto } from './dto/send-payment-email.dto';
import { UpsertSchoolReviewDto } from './dto/upsert-school-review.dto';

const STAFF_ROLES = [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER, SchoolMemberRole.SECRETARY];
const STUDENTS_VIEW_ROLES = [...STAFF_ROLES, SchoolMemberRole.INSTRUCTOR, SchoolMemberRole.COACH];
const VEHICLE_WRITE_ROLES = [SchoolMemberRole.OWNER, SchoolMemberRole.MANAGER];
const FINANCE_ROLES = [...STAFF_ROLES, SchoolMemberRole.ACCOUNTANT];

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
    @Query('take') take?: string,
    @Query('featured') featured?: string
  ) {
    return this.schoolService.listActive({
      city,
      category,
      q,
      maxPriceXof: maxPriceXof ? parseInt(maxPriceXof, 10) : undefined,
      take: take ? parseInt(take, 10) : undefined,
      featured: featured === 'true',
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

  @Get('my-sessions')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "The current user's own sessions (as a student)" })
  async mySessions(@Request() req) {
    return this.schoolService.listMySessions(req.user.userId);
  }

  @Get('my-payments')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "The current user's own invoices/payments" })
  async myPayments(@Request() req) {
    return this.schoolService.listMyPayments(req.user.userId);
  }

  @Get('sitemap')
  @ApiResponse({ status: 200, description: 'Active school slugs + updatedAt, for sitemap generation' })
  async sitemap() {
    return this.schoolService.listSlugsForSitemap();
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

  @Post(':schoolId/members/bulk')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(SchoolMemberRole.OWNER)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Staff members imported (CSV/Excel or contact import), per-row result' })
  async addMembersBulk(@Param('schoolId') schoolId: string, @Body() dto: BulkAddMembersDto) {
    return this.schoolService.addMembersBulk(schoolId, dto);
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

  // ─── Avis (Lot 5) ────────────────────────────────────────────────────────────

  @Get(':schoolId/reviews')
  @ApiResponse({ status: 200, description: 'Public reviews + real aggregate for this school' })
  async listReviews(@Param('schoolId') schoolId: string) {
    return this.schoolService.listReviews(schoolId);
  }

  @Post(':schoolId/reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Review created or updated (one per user per school)' })
  async upsertReview(
    @Request() req,
    @Param('schoolId') schoolId: string,
    @Body() dto: UpsertSchoolReviewDto
  ) {
    return this.schoolService.upsertReview(schoolId, req.user.userId, dto);
  }

  @Delete(':schoolId/reviews')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: "The caller's own review removed" })
  async deleteReview(@Request() req, @Param('schoolId') schoolId: string) {
    return this.schoolService.deleteReview(schoolId, req.user.userId);
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

  @Post(':schoolId/students/bulk')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Students imported (CSV/Excel or contact import), per-row result' })
  async addStudentsBulk(@Param('schoolId') schoolId: string, @Body() dto: BulkAddStudentsDto) {
    return this.schoolService.addStudentsBulk(schoolId, dto);
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

  @Post(':schoolId/vehicles/bulk')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...VEHICLE_WRITE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Vehicles imported from CSV/Excel, per-row result (upsert by plate)' })
  async createVehiclesBulk(@Param('schoolId') schoolId: string, @Body() dto: BulkCreateVehiclesDto) {
    return this.schoolService.createVehiclesBulk(schoolId, dto);
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

  // ─── Séances (planning) ──────────────────────────────────────────────────────

  @Get(':schoolId/sessions')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STUDENTS_VIEW_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Sessions for this school' })
  async listSessions(
    @Param('schoolId') schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string
  ) {
    return this.schoolService.listSessions(schoolId, studentId, from, to);
  }

  @Post(':schoolId/sessions')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Session created' })
  async createSession(@Param('schoolId') schoolId: string, @Body() dto: CreateSessionDto) {
    return this.schoolService.createSession(schoolId, dto);
  }

  @Patch(':schoolId/sessions/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...STAFF_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Session updated' })
  async updateSession(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdateSessionDto
  ) {
    return this.schoolService.updateSession(schoolId, id, dto);
  }

  // ─── Paiements (factures manuelles) ──────────────────────────────────────────

  @Get(':schoolId/payments')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...FINANCE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Invoices/payments for this school' })
  async listPayments(
    @Param('schoolId') schoolId: string,
    @Query('studentId') studentId?: string,
    @Query('status') status?: SchoolPaymentStatus
  ) {
    return this.schoolService.listPayments(schoolId, studentId, status);
  }

  @Post(':schoolId/payments')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...FINANCE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Invoice created' })
  async createPayment(@Param('schoolId') schoolId: string, @Body() dto: CreatePaymentDto) {
    return this.schoolService.createPayment(schoolId, dto);
  }

  @Patch(':schoolId/payments/:id')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...FINANCE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Invoice updated (e.g. marked PAID)' })
  async updatePayment(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: UpdatePaymentDto
  ) {
    return this.schoolService.updatePayment(schoolId, id, dto);
  }

  @Post(':schoolId/payments/:id/send-email')
  @UseGuards(AuthGuard('jwt'), SchoolRolesGuard)
  @SchoolRoles(...FINANCE_ROLES)
  @ApiBearerAuth()
  @ApiResponse({ status: 201, description: 'Devis/facture PDF emailed to the given address' })
  async sendPaymentEmail(
    @Param('schoolId') schoolId: string,
    @Param('id') id: string,
    @Body() dto: SendPaymentEmailDto
  ) {
    return this.schoolService.sendPaymentEmail(schoolId, id, dto);
  }
}
