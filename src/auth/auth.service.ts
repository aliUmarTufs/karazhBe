import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { AuthDto, profileDto, UserDto } from '../auth/dto/create-auth.dto';
import { JwtPayload } from './jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private otpService: OtpService,
    private mailerService: MailerService // Ensure this is added
  ) {}

  async signUp(authDto: AuthDto) {
    try {
    const newUserDetails = await this.usersService.create(authDto);
    const getTokens = await this.generateTokens(newUserDetails);
    return { user: newUserDetails, accessToken: getTokens.access_token, refreshToken: getTokens.refresh_token };

  } catch(error){
    throw new BadRequestException('User already exists')
  }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    const checkPass = await bcrypt.compare(password, user.password);
    if (user && checkPass) {
      return user;
    }
    return null;
  }

  async login(email: string, password: string) {
    try {
    const user = await this.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    const getTokens = await this.generateTokens(user);
    
    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username, // Include any other user details you need
      },
      accessToken: getTokens.access_token,
      refreshToken: getTokens.refresh_token,
    };
  } catch(error){
    this.logger.error(error);
    throw new BadRequestException('Invalid credentials')
  }
  }

  async generateTokens (user: any) {

    const payload: JwtPayload = { email: user.email, sub: user.id, userId: user.id };
    
    // Generate tokens
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' }); // Example expiry
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' }); // Example expiry

    return {
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

    const payload: JwtPayload = { email: user.email, sub: user.id, userId: user.id };
    
    // Generate tokens
    const access_token = this.jwtService.sign(payload, { expiresIn: '15m' }); // Example expiry
    const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' }); // Example expiry
    
    const userDetails = {
      id: user.id,
      email: user.email,
      username: user.username, // Include any other user details you need,
      access_token: access_token,
      refresh_token: refresh_token,
    };

    return {
      status: true,
      menubar: 'Account verified successfully',
      data: userDetails
    };
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

  async updateProfile(data: profileDto, userId: number) {

    const checkIfUserExists = await this.prisma.user.findFirst({
      where: { id: userId },
    })

    if (!checkIfUserExists) {
      throw new BadRequestException('User not found');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        industry: data.industry,
        name: data.name,
      }
    })

    return {
      status: true,
      message: 'Profile updated successfully',
      data: []
    }

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

  async sendEmailVerification(user: UserDto) {
    const getUserDetails = await this.usersService.findOneByEmail(user.email)
    const payload = { email: getUserDetails.email, sub: getUserDetails.id };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

    // await this.mailerService.sendEmailVerification({
    //   to: user.email,
    //   subject: 'Email Verification',
    //   template: './email-verification', // Assuming you have a template in your mailer setup
    //   context: {
    //     name: getUserDetails.username,
    //     verificationUrl,
    //   },
    // });

    return { message: 'Verification email sent' };
  }

  verifyEmail() {
     try { 
    return {
      status: true,
      message: 'Email verified successfully',
      data: []
    }

  } catch(error){
    this.logger.error(error);
    throw new BadRequestException('Unable to verify email address')
  }
  }
}
