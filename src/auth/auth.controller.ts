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
import { AuthDto, profileDto } from '../auth/dto/create-auth.dto';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() authDto: AuthDto) {
    const newUser = await this.authService.signUp(authDto);
    return {
      status: true,
      message: 'User created successfully',
      data: newUser,
    };
  }

  @Post('verify-otp')
  async verifyOtp(@Body() body: { email: string; token: string }) {
    return this.authService.verifyOtp(body.email, body.token);
  }

  @Post('resend-otp')
  async resendOtp(@Body() body: { email: string }) {
    await this.authService.resendOtp(body.email);
    return { message: 'OTP has been resent to your email' };
  }

  @Post('verify-email')
  async verifyEmail() {
    return await this.authService.verifyEmail();
  }

  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    const getUserDetails = await this.authService.login(
      body.email,
      body.password,
    );

    return {
      status: true,
      message: 'User logged in successfully',
      data: getUserDetails,
    };
  }

  @Post('refresh')
  async refresh(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const { access_token, refresh_token } =
      await this.authService.refresh(refreshToken);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ access_token });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    return this.authService.forgotPassword(body.email);
  }

  @UseGuards(LocalAuthGuard)
  @Post('update-profile')
  async updateProfile(@Body() data: profileDto, @Req() req) {
    return await this.authService.updateProfile(data, req.user.userId);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; newPassword: string }) {
    return this.authService.resetPassword(body.token, body.newPassword);
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('refresh_token');
    return res.json({ message: 'Logged out successfully' });
  }
}
