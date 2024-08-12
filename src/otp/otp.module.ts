// src/otp/otp.module.ts
import { Module } from '@nestjs/common';
import { OtpService } from './otp.service';
import { PrismaService } from '../prisma/prisma.service';
import { MailerService } from '../mailer/mailer.service'; // Example mailer service

@Module({
  providers: [OtpService, PrismaService, MailerService],
  exports: [OtpService],
})
export class OtpModule {}
