import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    this.logger.log(
      `${this.findOneByEmail.name} has been called | email: ${email}`,
    );
    try {
      return await this.prisma.user.findUnique({ where: { email } });
    } catch (error) {
      this.logger.error(
        `${this.findOneByEmail.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async create(userDetails: CreateUserDto) {
    this.logger.log(
      `${this.create.name} has been called | userDetails: ${JSON.stringify(userDetails)}`,
    );
    try {
      const uniqueUsername = await this.generateUniqueUsername(
        userDetails.email.split('@')[0],
      );
      return this.prisma.user.create({
        data: {
          email: userDetails.email,
          password: await this.hashPassword(userDetails.password),
          username: uniqueUsername,
        },
      });
    } catch (error) {
      this.logger.error(
        `${this.create.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return false;
    }
    return await this.comparePassword(password, user.password);
  }

  async updatePassword(userId: string, newPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  }

  async generateUniqueUsername(name: string): Promise<string> {
    this.logger.log(
      `${this.generateUniqueUsername.name} has been called | name: ${name}`,
    );

    try {
      const baseUsername = await this.createBaseUsername(name);
      let uniqueUsername = baseUsername;
      let suffix = 1;

      while (await this.usernameExists(uniqueUsername)) {
        uniqueUsername = `${baseUsername}${suffix}`;
        suffix++;
      }

      return uniqueUsername;
    } catch (error) {
      this.logger.error(
        `${this.generateUniqueUsername.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  private createBaseUsername(name: string): string {
    // Example logic: take the first part of the name and lowercase it
    return name.split(' ')[0].toLowerCase();
  }

  private async usernameExists(username: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { username },
    });
    return !!user;
  }

  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10); // 10 is the salt rounds
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
