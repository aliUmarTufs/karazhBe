import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as hbs from 'nodemailer-express-handlebars';
import { join } from 'path';

@Injectable()
export class MailerService {
  private readonly logger = new Logger(MailerService.name);
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'sandbox.smtp.mailtrap.io',
      port: 2525,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    this.transporter.use(
      'compile',
      hbs({
        viewEngine: {
          extname: '.hbs',
          layoutsDir: join(__dirname, '../templates'), // Adjust this path
          defaultLayout: false,
        },
        viewPath: join(__dirname, '../templates'), // Adjust this path
        extName: '.hbs',
      }),
    );
  }

  async sendEmailVerification(email: string, token: string) {
    this.logger.log(
      `${this.sendEmailVerification.name} has been called | email: ${email}, token: ${token}`,
    );

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Email Verification Request',
      template: 'verifyEmail', // Refers to the template name (verifyEmail.hbs)
      context: {
        token,
        url: `${process.env.FRONTEND_URL}/verify-email?token=${token}`,
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`sendEmail Response: ${JSON.stringify(info)}`);
    } catch (error) {
      this.logger.error(`${this.sendEmailVerification.name} got an Error`);
      this.logger.error(`sendEmail Error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  async sendOtpEmail(email: string, otp: string) {
    this.logger.log(
      `${this.sendOtpEmail.name} has been called | email: ${email}, otp: ${otp}`,
    );
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'OTP Code for Reset Password',
      template: 'otpEmail', // template name without the file extension
      context: { otp }, // context to be passed to the template
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`sendEmail Response: ${JSON.stringify(info)}`);
    } catch (error) {
      this.logger.error(`${this.sendOtpEmail.name} got an Error`);
      this.logger.error(`sendEmail Error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  async sendResetPasswordEmail(email: string, token: string) {
    this.logger.log(
      `${this.sendResetPasswordEmail.name} has been called | email: ${email}, token: ${token}`,
    );
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Reset Password Request',
      template: 'resetPassword', // Refers to the template name (verifyEmail.hbs)
      context: {
        token,
        url: `${process.env.FRONTEND_URL}/confirm-otp?token=${token}`,
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`sendEmail Response: ${JSON.stringify(info)}`);
    } catch (error) {
      this.logger.error(`${this.sendResetPasswordEmail.name} got an Error`);
      this.logger.error(`sendEmail Error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  async sendInviteEmail(email: string, token: string, workspaceName: string) {
    this.logger.log(
      `${this.sendInviteEmail.name} has been called | email: ${email}, token: ${token}, workspaceName: ${workspaceName}`,
    );
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'WorkSpace Invite',
      template: 'inviteEmail', // Refers to the template name (verifyEmail.hbs)
      context: {
        token,
        url: `${process.env.FRONTEND_URL}/accept-invite?token=${token}`,
        workspaceName,
      },
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      this.logger.log(`sendEmail Response: ${JSON.stringify(info)}`);
    } catch (error) {
      this.logger.error(`${this.sendInviteEmail.name} got an Error`);
      this.logger.error(`sendEmail Error: ${JSON.stringify(error)}`);
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  // async sendEmailVerification(email: string, token: string) {
  //   const mailOptions = {
  //     from: process.env.EMAIL_USER,
  //     to: email,
  //     subject: 'Email Verification Request',
  //     text: `Please use the following link to verify your email address: ${process.env.FRONTEND_URL}/verify-email?token=${token}`,
  //   };

  //   await this.transporter.sendMail(mailOptions);
  // }
}
