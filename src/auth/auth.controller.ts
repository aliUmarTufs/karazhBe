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

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private uploadImage: UploadFile,
    private getFileSignedUrl: GetFile,
  ) {}

  @Post('signup')
  async signUp(
    @Req() req: Request, // Inject the request object to access headers
    @Res() res: Response,
    @Body() authDto: AuthDto,
  ) {
    const origin = req.headers['origin'] || req.headers['referer']; // Extract the origin or referer from headers
    const newUser = await this.authService.signUp(authDto, origin);
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
    // @Res() res: Response,
    @Body() body: { email: string; password: string },
  ) {
    return await this.authService.login(body.email, body.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('resend-verification-email')
  async sendEmailVerification(
    @Body() userDto: UserDto,
    @Req() req: Request, // Inject the request object to access headers
  ) {
    const origin = req.headers['origin'] || req.headers['referer']; // Extract the origin or referer from headers
    return await this.authService.sendEmailVerification(userDto, origin);
  }

  @Post('verify-email')
  async verifyEmail(@Body() body: { email: string; token: string }) {
    return await this.authService.verifyEmail(body);
  }

  @Post('forget-password')
  async forgetPassword(@Body() body: { email: string }, @Req() req) {
    const origin = req.headers['origin'] || req.headers['referer']; // Extract the origin or referer from headers
    return this.authService.forgetPassword(body.email, origin);
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
  async verifyOtp(@Body() body: { email: string; token: string }) {
    return this.authService.verifyOtp(body.email, body.token);
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
  @Get('get-profile')
  async getProfile(@Req() req) {
    return await this.authService.getProfile(req.user);
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
      const check = await this.uploadImage.getFileExtension(file?.originalname);
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
        check !== 'tex' &&
        check !== 'mp4' && // Allow .mp4 files
        check !== 'flv' && // Allow .flv files
        check !== 'wmv' && // Allow .wmv files
        check !== 'avi' && // Allow .avi files
        check !== 'mov' && // Allow .mov files
        check !== '3gp' && // Allow .3gp files
        check !== 'ts' && // Allow .ts files
        check !== 'm3u8' // Allow .m3u8 files
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
