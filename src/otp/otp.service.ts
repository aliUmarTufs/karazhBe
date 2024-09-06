import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as otpGenerator from 'otp-generator';
import { MailerService } from '../mailer/mailer.service';
import { addMinutes } from 'date-fns';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async generateOtp(email: string) {
    this.logger.log(
      `${this.generateOtp.name} has been called | email: ${email}`,
    );
    try {
      const otp = otpGenerator.generate(4, {
        upperCase: false,
        specialChars: false,
      });
      const expiresAt = addMinutes(new Date(), 10); // OTP expires in 10 minutes

      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      await this.prisma.otp.create({
        data: {
          token: otp,
          userId: user.id,
          expiresAt,
        },
      });

      // Send OTP via email
      await this.mailerService.sendOtpEmail(email, otp);

      return { message: 'OTP has been sent to your email' };
    } catch (error) {
      this.logger.error(
        `${this.generateOtp.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async verifyOtp(email: string, token: string): Promise<boolean> {
    this.logger.log(
      `${this.verifyOtp.name} has been called | email: ${email}, token: ${token}`,
    );
    try {
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const otpRecord = await this.prisma.otp.findUnique({
        where: {
          token,
          userId: user.id,
          expiresAt: { gte: new Date() },
        },
      });

      if (!otpRecord) {
        return false;
      }

      // Optionally, delete the OTP record after successful verification
      await this.prisma.otp.delete({ where: { id: otpRecord?.id } });

      return true;
    } catch (error) {
      this.logger.error(
        `${this.verifyOtp.name} got an Error: ${JSON.stringify(error)}`,
      );
      return false;
    }
  }
}
