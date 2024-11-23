/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';
import { OtpService } from '../otp/otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service';
import { AuthDto, profileDto, UserDto } from '../auth/dto/create-auth.dto';
import { JwtPayload } from './jwt-payload.interface';
import { WorkspacesService } from 'src/workspaces/workspaces.service';
import { CreateWorkspaceDto } from 'src/workspaces/dto/create-workspace.dto';
import { addDays, addMinutes } from 'date-fns';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private usersService: UsersService,
    private workspacesService: WorkspacesService,
    private jwtService: JwtService,
    private prisma: PrismaService,
    private otpService: OtpService,
    private mailerService: MailerService, // Ensure this is added
  ) {}

  async signUp(authDto: AuthDto, origin?: string) {
    this.logger.log(
      `${this.signUp.name} has been called | authDto: ${JSON.stringify(authDto)}, origin: ${origin}`,
    );
    try {
      const checkIfUserExists = await this.usersService.findOneByEmail(
        authDto.email,
      );
      if (checkIfUserExists) {
        // if (authDto?.token) {
        //   const decodedToken = this.jwtService.verify(authDto.token);
        //   const { memberId, userId, workSpaceId, email } = decodedToken as {
        //     memberId: string;
        //     userId: string;
        //     workSpaceId: string;
        //     email: string;
        //   };

        //   const existingUserWorkSpace =
        //     await this.prisma.userWorkSpace.findUnique({
        //       where: {
        //         id: memberId,
        //       },
        //     });
        //   if (!existingUserWorkSpace) {
        //     throw new HttpException(
        //       'Invalid invite token',
        //       HttpStatus.BAD_REQUEST,
        //     );
        //   }

        //   if (existingUserWorkSpace.isConfirmed) {
        //     throw new HttpException(
        //       'Invite already accepted',
        //       HttpStatus.BAD_REQUEST,
        //     );
        //   }
        //   await this.prisma.userWorkSpace.update({
        //     where: { id: existingUserWorkSpace.id },
        //     data: {
        //       userId: checkIfUserExists.id,
        //       isConfirmed: true,
        //       updatedAt: existingUserWorkSpace.updatedAt,
        //     },
        //   });
        // }
        throw new BadRequestException('User already exists');
      }
      const newUserDetails = await this.usersService.create(authDto);

      if (authDto?.token) {
        const decodedToken = this.jwtService.verify(authDto.token);
        const { memberId, userId, workSpaceId, email } = decodedToken as {
          memberId: string;
          userId: string;
          workSpaceId: string;
          email: string;
        };

        const existingUserWorkSpace =
          await this.prisma.userWorkSpace.findUnique({
            where: {
              id: memberId,
            },
          });
        if (!existingUserWorkSpace) {
          throw new HttpException(
            'Invalid invite token',
            HttpStatus.BAD_REQUEST,
          );
        }

        if (existingUserWorkSpace.isConfirmed) {
          throw new HttpException(
            'Invite already accepted',
            HttpStatus.BAD_REQUEST,
          );
        }
        await this.prisma.userWorkSpace.update({
          where: { id: existingUserWorkSpace.id },
          data: {
            userId: newUserDetails.id,
            isConfirmed: true,
            updatedAt: existingUserWorkSpace.updatedAt,
          },
        });
      }

      const getTokens = await this.generateTokens(newUserDetails);

      const createWorkspaceDto: CreateWorkspaceDto = {
        name: `${newUserDetails.username}'s Workspace`, // or any naming convention you prefer
        timeZone: 'UTC', // Set default timezone, or collect this from the user
        timeZoneOffset: '0', // Set default timezone offset, or collect this from the user
        startDay: 'Sunday', // Set default start day, or collect this from the user
      };

      await this.workspacesService.createWorkSpace(
        createWorkspaceDto,
        newUserDetails,
      );

      const msg = await this.sendEmailVerification(
        {
          email: newUserDetails.email,
        },
        origin,
      );
      // Check if the user's createdAt is older than 3 days
      const createdAt = new Date(newUserDetails.createdAt);
      const threeDaysAgo = addDays(new Date(), -3);

      return {
        user: {
          ...newUserDetails,
          isFreeze: !newUserDetails.isVerified
            ? createdAt < threeDaysAgo
              ? true
              : false
            : false,
        },
        ...msg,
        access_token: getTokens.access_token,
        refresh_token: getTokens.refresh_token,
      };
    } catch (error) {
      this.logger.error(
        `${this.signUp.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findOneByEmail(email);
    const checkPass = await bcrypt.compare(password, user?.password);
    if (user && checkPass) {
      return user;
    }
    return null;
  }

  async login(email: string, password: string) {
    this.logger.log(
      `${this.login.name} has been called | email: ${email}, password: ${password}`,
    );
    try {
      const user = await this.validateUser(email, password);
      if (!user) {
        throw new UnauthorizedException(
          'You have entered incorrect email or password.',
        );
      }

      const getTokens = await this.generateTokens(user);

      // Check if the user's createdAt is older than 3 days
      const createdAt = new Date(user.createdAt);
      const threeDaysAgo = addDays(new Date(), -3);

      return {
        status: true,
        message: 'User logged in successfully',
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username, // Include any other user details you need
            isVerified: user.isVerified,
            isFreeze: !user.isVerified
              ? createdAt < threeDaysAgo
                ? true
                : false
              : false,
          },
          access_token: getTokens.access_token,
          refresh_token: getTokens.refresh_token,
        },
      };
    } catch (error) {
      this.logger.error(
        `${this.login.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(
        'You have entered incorrect email or password.',
      );
    }
  }

  async generateTokens(user: any) {
    this.logger.log(
      `${this.generateTokens.name} has been called | user: ${JSON.stringify(user)}`,
    );
    try {
      const payload: JwtPayload = {
        email: user.email,
        sub: user.id,
        userId: user.id,
      };

      // Generate tokens
      const access_token = this.jwtService.sign(payload, { expiresIn: '7d' }); // Example expiry
      const refresh_token = this.jwtService.sign(payload, { expiresIn: '7d' }); // Example expiry

      return {
        access_token,
        refresh_token,
      };
    } catch (error) {
      this.logger.error(
        `${this.generateTokens.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOneByEmail(payload.email);
      if (!user) {
        throw new UnauthorizedException();
      }
      return {
        access_token: this.jwtService.sign(
          { email: user.email, sub: user.id },
          { expiresIn: '1d' },
        ),
        refresh_token: this.jwtService.sign(
          { email: user.email, sub: user.id },
          { expiresIn: '7d' },
        ),
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async verifyOtp(email: string, token: string) {
    this.logger.log(
      `${this.verifyOtp.name} has been called | email: ${email} | token: ${token}`,
    );
    try {
      const isValid = await this.otpService.verifyOtp(email, token);
      if (!isValid) {
        throw new BadRequestException('Invalid or expired OTP');
      }

      const user = await this.usersService.findOneByEmail(email);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const payload: JwtPayload = {
        email: user.email,
        sub: user.id,
        userId: user.id,
      };

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
        data: userDetails,
      };
    } catch (error) {
      this.logger.error(
        `${this.verifyOtp.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException({
        status: false,
        message: error.message,
        error,
      });
    }
  }

  async sendOtp(token: string) {
    const isValid = await this.jwtService.verify(token);
    if (!isValid) {
      throw new UnauthorizedException('Invalid or Expired Token');
    }

    const { email } = isValid;
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return await this.otpService.generateOtp(email);
  }

  async forgetPassword(email: string, origin?: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    // Generate reset token and send email
    const resetToken = this.jwtService.sign({ email }, { expiresIn: '1h' });
    await this.mailerService.sendResetPasswordEmail(email, resetToken, origin);

    return { message: 'Password reset email sent' };
  }

  async updateProfile(data: profileDto, userId: string) {
    this.logger.log(
      `${this.updateProfile.name} has been called | userId: ${userId}, data: ${JSON.stringify(data)}`,
    );
    try {
      const checkIfUserExists = await this.prisma.user.findFirst({
        where: { id: userId },
      });

      if (!checkIfUserExists) {
        throw new BadRequestException('User not found');
      }
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
        },
      });

      return {
        status: true,
        message: 'Profile updated successfully',
        data: [],
      };
    } catch (error) {
      this.logger.error(
        `${this.updateProfile.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async getProfile(user: JwtPayload) {
    this.logger.log(
      `${this.getProfile.name} has been called | user: ${JSON.stringify(user)}`,
    );
    try {
      const { userId } = user;

      const userDetails = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      // Check if the user's createdAt is older than 3 days
      const createdAt = new Date(userDetails.createdAt);
      const threeDaysAgo = addDays(new Date(), -3);

      return {
        status: true,
        message: 'Profile Fetched Succesfully',
        data: {
          user: {
            id: userDetails.id,
            email: userDetails.email,
            username: userDetails.username,
            // name: userDetails.name,
            industry: userDetails.industry,
            isVerified: userDetails.isVerified,
            isFreeze: !userDetails.isVerified
              ? createdAt < threeDaysAgo
                ? true
                : false
              : false,
          },
        },
      };
    } catch (error) {
      this.logger.error(
        `${this.getProfile.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async resetPassword(email: string, newPassword: string) {
    // const payload = this.jwtService.verify(token);
    const user = await this.usersService.findOneByEmail(email);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    await this.usersService.updatePassword(user.id, hashedPassword);

    return { message: 'Password updated successfully' };
  }

  async sendEmailVerification(user: UserDto, origin: string) {
    const getUserDetails = await this.usersService.findOneByEmail(user.email);
    if (getUserDetails.isVerified) {
      return { message: 'Email is already verified!' };
    }
    const payload = { email: getUserDetails.email, sub: getUserDetails.id };
    const token = this.jwtService.sign(payload, { expiresIn: '1h' });

    await this.mailerService.sendEmailVerification(user.email, token, origin);
    // const verificationUrl = `${process.env.APP_URL}/auth/verify-email?token=${token}`;

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

  async verifyEmail(body: { email: string; token: string }) {
    try {
      const isValid = await this.jwtService.verify(body.token);

      if (!isValid) {
        throw new UnauthorizedException('Invalid or Expired Token');
      }

      const { sub: userId } = isValid;

      const verifyUser = await this.prisma.user.update({
        where: {
          id: userId,
        },
        data: {
          isVerified: true,
        },
      });
      // Check if the user's createdAt is older than 3 days
      const createdAt = new Date(verifyUser.createdAt);
      const threeDaysAgo = addDays(new Date(), -3);

      return {
        status: true,
        message: 'Email verified successfully',
        data: {
          ...verifyUser,
          isFreeze: !verifyUser.isVerified
            ? createdAt < threeDaysAgo
              ? true
              : false
            : false,
        },
      };
    } catch (error) {
      this.logger.error(error);
      throw new BadRequestException('Unable to verify email address');
    }
  }

  async getFileExtension(filename: any) {
    const extension = await filename.split('.').pop();
    return extension;
  }
}
