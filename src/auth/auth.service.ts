import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { AuthDto } from '../auth/dto/create-auth.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private otpService: OtpService,
    private mailerService: MailerService // Ensure this is added
  ) {}

  async signUp(authDto: AuthDto) {
    await this.usersService.create(authDto);
    await this.otpService.generateOtp(authDto.email);
    return { message: 'OTP has been sent to your email for verification' };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && await bcrypt.compare(password, user.password)) {
      return user;
    }
    return null;
  }

  async login(email: string, password: string) {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const payload: JwtPayload = { email: user.email, sub: user.id };
    
    // Generate tokens
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' }); // Example expiry
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' }); // Example expiry
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username, // Include any other user details you need
      },
      access_token,
      refresh_token,
    };
  }


  async refresh(refreshToken: string) {
    const payload = this.jwtService.verify(refreshToken);
    const user = await this.usersService.findOneByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException();
    }
    return {
      access_token: this.jwtService.sign({ email: user.email, sub: user.id }, { expiresIn: '15m' }),
      refresh_token: this.jwtService.sign({ email: user.email, sub: user.id }, { expiresIn: '7d' }),
    };
  }


  async verifyOtp(email: string, token: string) {
    const isValid = await this.otpService.verifyOtp(email, token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.login(user.email, user.password);
  }

  async resendOtp(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return this.otpService.generateOtp(email);
  }

  async forgotPassword(email: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate reset token and send email
    const resetToken = this.jwtService.sign({ email }, { expiresIn: '1h' });
    await this.mailerService.sendResetPasswordEmail(email, resetToken);

    return { message: 'Password reset email sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const payload = this.jwtService.verify(token);
    const user = await this.usersService.findOneByEmail(payload.email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password updated successfully' };
  }
}
