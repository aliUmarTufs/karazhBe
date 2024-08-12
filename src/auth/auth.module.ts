import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { OtpModule } from 'src/otp/otp.module';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersService } from 'src/users/users.service';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    UsersModule,
    PrismaModule,
    OtpModule,
  ],
  providers: [AuthService, MailerService, UsersService],
  controllers: [AuthController],
})
export class AuthModule {}
