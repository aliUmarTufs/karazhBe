import {
  Controller,
  Post,
  Body,
  Request,
  Res,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
  Get,
  Param,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response } from 'express';
import {
  AuthDto,
  profileDto,
  UploadFileDto,
  UserDto,
} from '../auth/dto/create-auth.dto';
import { LocalAuthGuard } from './local-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UploadFile } from 'src/aws/uploadfile';
import { GetFile } from 'src/aws/getfile.service';
import { SocialMediaPlatform } from 'src/enum/SocialMediaPlatform';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private uploadImage: UploadFile,
    private getFileSignedUrl: GetFile,
  ) {}

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
  async sendOtp(@Body() body: { token: string }) {
    try {
      await this.authService.sendOtp(body.token);
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
  async verifyOtp(@Body() body: { email: string; otp: string }) {
    return this.authService.verifyOtp(body.email, body.otp);
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { email: string; newPassword: string }) {
    return this.authService.resetPassword(body.email, body.newPassword);
  }

  @Post('refresh')
  async refresh(
    @Body('refreshToken') refreshToken: string,
    @Res() res: Response,
  ) {
    try {
      const { access_token, refresh_token } =
        await this.authService.refresh(refreshToken);

      // Send the new refresh token in the response
      return res.json({
        access_token,
        refresh_token,
      });
    } catch (error) {
      return res
        .status(401)
        .json({ message: 'Invalid or expired refresh token' });
    }
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

  @Post('uploadImage')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImg(
    @UploadedFile() file: Express.Multer.File,
    @Body() data: UploadFileDto,
  ) {
    try {
      const check = await this.uploadImage.getFileExtension(file.originalname);
      if (
        // check !== 'jpg' &&
        // check !== 'png' &&
        // check !== 'jpeg' &&
        // check !== 'pdf' &&
        // check !== 'zip' &&
        // check !== 'docx'
        check !== 'pdf' &&
        check !== 'zip' &&
        check !== 'docx' &&
        check !== 'doc' &&
        check !== 'odt' &&
        check !== 'txt' &&
        check !== 'rtf' &&
        check !== 'wps' &&
        check !== 'wkf' &&
        check !== 'wks' &&
        check !== 'wpd' &&
        check !== 'png' &&
        check !== 'PNG' &&
        check !== 'jpg' &&
        check !== 'jpeg' &&
        check !== 'ppt' &&
        check !== 'pptx' &&
        check !== 'xls' &&
        check !== 'svg' &&
        check !== 'xlsx' &&
        check !== 'tex'
      ) {
        return {
          status: false,
          message: 'invalid file',
        };
      }
      return await this.uploadImage.uploadImg(file, data.directory);
    } catch (error) {
      console.error('Failed to fetch the image:', error.message);
    }
  }

  @Post('getSignedUrl')
  async getImg(@Body() body: { key: string }) {
    try {
      return await this.getFileSignedUrl.get_s3(body.key);
    } catch (error) {
      console.error('Failed to fetch the image:', error.message);
    }
  }

  // @UseGuards(LocalAuthGuard)
  // @Get('get-channels/:workspaceId')
  // async getUserDetails(@Param('workspaceId') workspaceId: string @Req() req) {
  //   return await this.authService.getMyChannels(workspaceId, req.user);
  // }
}
