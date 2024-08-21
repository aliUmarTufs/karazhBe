import {
  Controller,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthDto, profileDto, UserDto } from '../auth/dto/create-auth.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Res() res: Response, @Body() authDto: AuthDto) {
    const newUser = await this.authService.signUp(authDto);
    res.cookie('refresh_token', newUser.refresh_token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({
      status: true,
      message: 'User created successfully',
      data: newUser,
    });
  }
  @Post('login')
  async login(
    @Res() res: Response,
    @Body() body: { email: string; password: string },
  ) {
    const getUserDetails = await this.authService.login(
      body.email,
      body.password,
    );
    res.cookie('refresh_token', getUserDetails.refresh_token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({
      status: true,
      message: 'User logged in successfully',
      data: getUserDetails,
    });
  }

  @UseGuards(LocalAuthGuard)
  @Post('resend-verification-email')
  async sendEmailVerification(@Body() userDto: UserDto) {
    return await this.authService.sendEmailVerification(userDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    return await this.authService.verifyEmail(body);
  }

  @Post('forget-password')
  async forgetPassword(@Body() body: { email: string }) {
    return this.authService.forgetPassword(body.email);
  }

  @Post('send-otp')
  async sendOtp(@Body() body: { email: string; token: string }) {
    try {
      await this.authService.sendOtp(body.email, body.token);
      return { status: true, message: 'OTP has been sent to your email' };
    } catch (error) {
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; token: string }) {
    return this.authService.verifyOtp(body.email, body.token);
  }

  @UseGuards(LocalAuthGuard)
  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('refresh')
  async refresh(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const { access_token, refresh_token } =
      await this.authService.refresh(refreshToken);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      // secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ access_token });
  }

  @UseGuards(LocalAuthGuard)
  @Post('update-profile')
  async updateProfile(@Body() data: profileDto, @Req() req) {
    return await this.authService.updateProfile(data, req.user.userId);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }
}
