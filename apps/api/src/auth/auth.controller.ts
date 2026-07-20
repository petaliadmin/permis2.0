import { Controller, Post, Get, Body, UseGuards, Request, Res, HttpCode } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Throttle } from '@nestjs/throttler';
import { ApiBearerAuth, ApiTags, ApiResponse } from '@nestjs/swagger';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { MigrateGuestDto } from './dto/migrate-guest.dto';
import { RequestOtpDto } from './dto/request-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { LoginPinDto } from './dto/login-pin.dto';
import { RegisterPinDto } from './dto/register-pin.dto';
import { ResetPinDto } from './dto/reset-pin.dto';

// The web app (www.permis2.com) and the API (api.permis2.com) are different
// hosts, so a cookie set without an explicit `domain` defaults to api.permis2.com
// only — invisible to the Next.js middleware running on www.permis2.com, which
// always saw it as "logged out" and bounced protected routes (/admin,
// /notifications) back to the login page even for a valid session. Scoping to
// the shared parent domain fixes that; `undefined` in dev keeps plain
// localhost cookies working (a leading dot there would be rejected).
function authCookieOptions() {
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'strict' as const,
    domain: isProd ? '.permis2.com' : undefined,
    maxAge: 24 * 60 * 60 * 1000,
    path: '/',
  };
}

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // ─── Phone / OTP / PIN ───────────────────────────────────────────────────────

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('otp/request')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'OTP sent via SMS/WhatsApp' })
  async requestOtp(@Body() dto: RequestOtpDto) {
    return this.authService.requestOtp(dto.phone, dto.channel);
  }

  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('otp/verify')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: '{ verified: true|false }' })
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    const verified = await this.authService.verifyOtp(dto.phone, dto.otp);
    return { verified };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login-pin')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Login with phone + PIN' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async loginWithPin(@Body() dto: LoginPinDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.loginWithPin(dto.phone, dto.pin);
    res.cookie('access_token', result.accessToken, authCookieOptions());
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register-pin')
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'Account created with phone + PIN' })
  @ApiResponse({ status: 409, description: 'Phone number already in use' })
  async registerWithPin(@Body() dto: RegisterPinDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.registerWithPin(dto.name, dto.phone, dto.pin);
    res.cookie('access_token', result.accessToken, authCookieOptions());
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-pin')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'PIN reset after OTP verification; user logged in' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  async resetPin(@Body() dto: ResetPinDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.resetPinWithOtp(dto.phone, dto.otp, dto.pin);
    res.cookie('access_token', result.accessToken, authCookieOptions());
    return result;
  }

  // ─── Email / Password (kept for admin / web fallback) ────────────────────────

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('register')
  @HttpCode(201)
  @ApiResponse({ status: 201, description: 'User successfully registered' })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(@Body() registerDto: RegisterDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.register(registerDto);
    res.cookie('access_token', result.accessToken, authCookieOptions());
    return result;
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('login')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authService.login(loginDto.email, loginDto.password);
    res.cookie('access_token', result.accessToken, authCookieOptions());
    return result;
  }

  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @Post('forgot-password')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Reset email sent if the account exists' })
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.requestPasswordReset(dto.email);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('reset-password')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Password reset' })
  @ApiResponse({ status: 400, description: 'Invalid or expired token' })
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto.token, dto.password);
  }

  @Post('migrate-guest')
  @HttpCode(200)
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Guest progress merged into the account' })
  async migrateGuest(@Request() req, @Body() dto: MigrateGuestDto) {
    return this.authService.migrateGuestProgress(req.user.userId, dto);
  }

  @Post('logout')
  @HttpCode(200)
  @ApiResponse({ status: 200, description: 'Logged out' })
  async logout(@Res({ passthrough: true }) res: Response) {
    res.clearCookie('access_token', {
      path: '/',
      domain: process.env.NODE_ENV === 'production' ? '.permis2.com' : undefined,
    });
    return { message: 'Logged out' };
  }

  @Post('refresh')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  async refreshToken(@Request() req) {
    return this.authService.refreshToken(req.user.userId);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  @ApiBearerAuth()
  @ApiResponse({ status: 200, description: 'Current user info' })
  async getCurrentUser(@Request() req) {
    return this.authService.validateUser(req.user.userId);
  }
}
