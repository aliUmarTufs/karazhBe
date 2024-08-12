import { Controller, Post, Body, Request, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import { AuthDto } from '../auth/dto/create-auth.dto';


@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signUp(authDto: AuthDto) {
    return this.authService.signUp(authDto);
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

  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Res() res: Response) {
    const { access_token, refresh_token } = await this.authService.login(body.email, body.password);
    res.cookie('refresh_token', refresh_token, {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    return res.json({ access_token });
  }

  @Post('refresh')
  async refresh(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies['refresh_token'];
    const { access_token, refresh_token } = await this.authService.refresh(refreshToken);
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
