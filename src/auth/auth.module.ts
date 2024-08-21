import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from 'src/users/users.module';
import { OtpModule } from 'src/otp/otp.module';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UsersService } from 'src/users/users.service';
// import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { WorkspacesModule } from 'src/workspaces/workspaces.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }), // Register the JWT strategy
    JwtModule.register({
      secret: process.env.JWT_SECRET, // Replace with your actual secret key
      signOptions: { expiresIn: '3600s' }, // Adjust token expiration as needed
    }),
    UsersModule, // Import any modules that the JWT strategy might need
    WorkspacesModule,
    PrismaModule,
    OtpModule,
  ],
  providers: [AuthService, MailerService, UsersService, JwtStrategy],
  controllers: [AuthController],
})
export class AuthModule {}
