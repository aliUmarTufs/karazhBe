import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from './prisma/prisma.service';
import { OtpService } from './otp/otp.service';
import { MailerService } from './mailer/mailer.service';
import { MailerModule } from './mailer/mailer.module';
import { OtpModule } from './otp/otp.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({

      isGlobal: true, // Makes the ConfigModule global, so you don't need to import it everywhere
    
    }),
    AuthModule,
    UsersModule,
    MailerModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '60m' },
    }),
    MailerModule,
    OtpModule,
    PrismaModule,],
  controllers: [AppController],
  providers: [AppService, PrismaService, OtpService, MailerService],
})
export class AppModule {}
