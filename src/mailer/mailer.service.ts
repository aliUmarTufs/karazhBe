import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailerService {
  private transporter: nodemailer.Transporter;

  constructor() {
    // this.transporter = nodemailer.createTransport({
    //   service: 'gmail', // or any other email service
    //   auth: {
    //     user: process.env.EMAIL_USER,
    //     pass: process.env.EMAIL_PASS,
    //   },
    // });

    this.transporter = nodemailer.createTransport({
      host: "sandbox.smtp.mailtrap.io",
      port: 2525,
      auth: {
        user: "7581454056eff5",
        pass: "032c50eb4a0c4d"
      }
    });
  }

  async sendOtpEmail(email: string, otp: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your OTP Code',
      text: `Your OTP code is ${otp}`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendResetPasswordEmail(email: string, token: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Please use the following link to reset your password: ${process.env.FRONTEND_URL}/reset-password?token=${token}`,
    };

    await this.transporter.sendMail(mailOptions);
  }

  async sendEmailVerification(email: string, token: string) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Please use the following link to verify your email address: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
    };

    await this.transporter.sendMail(mailOptions);
  }
}
