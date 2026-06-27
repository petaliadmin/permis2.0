import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const { email, password, name } = createUserDto;

    const existingUser = await this.userService.findByEmail(email);
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    if (!password) {
      throw new BadRequestException('Password is required');
    }

    const hashedPassword: string = await bcrypt.hash(password, 10);

    const user = await this.userService.create({
      email,
      name,
      passwordHash: hashedPassword,
    });

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async login(email: string, password: string) {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const passwordValid = await bcrypt.compare(password, user.passwordHash);

    if (!passwordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async googleLogin(googleUser: any) {
    let user = await this.userService.findByGoogleId(googleUser.id);

    if (!user) {
      user = await this.userService.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        googleId: googleUser.id,
      });
    }

    return {
      accessToken: this.generateAccessToken(user),
      user: this.sanitizeUser(user),
    };
  }

  async validateUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async refreshToken(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      accessToken: this.generateAccessToken(user),
    };
  }

  private generateAccessToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return this.jwtService.sign(payload);
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...sanitized } = user;
    return sanitized;
  }
}
