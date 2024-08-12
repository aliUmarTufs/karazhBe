import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async create(userDetails: CreateUserDto) {
    const uniqueUsername = await this.generateUniqueUsername(userDetails.email.split('@')[0]);

    return this.prisma.user.create({
      data: {
        email: userDetails.email,
        password: userDetails.password,
        username: uniqueUsername,
      },
    });
  }

  async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return false;
    }
    return await this.comparePassword(password, user.password);
  }

  async updatePassword(userId: number, newPassword: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { password: newPassword },
    });
  }

  async generateUniqueUsername(name: string): Promise<string> {
    const baseUsername = this.createBaseUsername(name);
    let uniqueUsername = baseUsername;
    let suffix = 1;

    while (await this.usernameExists(uniqueUsername)) {
      uniqueUsername = `${baseUsername}${suffix}`;
      suffix++;
    }

    return uniqueUsername;
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

  private async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

}
