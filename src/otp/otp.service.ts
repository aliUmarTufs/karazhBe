import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as otpGenerator from 'otp-generator';
import { MailerService } from '../mailer/mailer.service';
import { addMinutes } from 'date-fns';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private mailerService: MailerService,
  ) {}

  async generateOtp(email: string) {
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
  }

  async verifyOtp(email: string, token: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const otpRecord = await this.prisma.otp.findFirst({
      where: {
        userId: user.id,
        token,
        expiresAt: { gte: new Date() },
      },
    });

    if (!otpRecord) {
      return false;
    }

    // Optionally, delete the OTP record after successful verification
    await this.prisma.otp.delete({ where: { id: otpRecord.id } });

    return true;
  }
}
