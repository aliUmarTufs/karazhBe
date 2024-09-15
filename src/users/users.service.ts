import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto';
import { JwtPayload } from 'src/auth/jwt-payload.interface';

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

  async getUsers(filter, loggedInUser: JwtPayload) {
    this.logger.log(
      `${this.getUsers.name} has been called | filter: ${JSON.stringify(filter)}`,
    );
    try {
      const where = {
        id: {
          not: {
            equals: loggedInUser.userId,
          },
        },
        OR:
          filter.search !== undefined &&
          filter.search !== null &&
          filter.search !== ''
            ? [
                // { name: { contains: filter.search } },
                { username: { contains: filter.search } },
                { email: { contains: filter.search } },
              ]
            : [],
      };

      const users = await this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          industry: true,
          WorkSpaces: true,
        },
        take: filter.limit || 10,
        skip: filter.offset || 0,
        orderBy: { email: 'asc' },
      });

      const filteredUsers = await users.filter(
        (user) => user.WorkSpaces.length < 2,
      );
      await filteredUsers.forEach((user) => delete user.WorkSpaces);

      return {
        status: true,
        message: 'Users fetched for invite',
        totalCount: filteredUsers?.length,
        data: filteredUsers,
      };
    } catch (error) {
      this.logger.error(
        `${this.getUsers.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw new BadRequestException(error.message);
    }
  }

  async verifyUser(email: string) {
    this.logger.log(
      `${this.verifyUser.name} has been called | email: ${email}`,
    );
    try {
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          username: true,
          email: true,
          industry: true,
          WorkSpaces: true,
        },
      });
      if (!user) {
        throw new BadRequestException({
          status: false,
          message: 'User not found',
        });
      }
      if (user.WorkSpaces.length >= 2) {
        throw new BadRequestException({
          status: false,
          message: 'User already has 2 workspaces',
        });
      }
      return {
        status: true,
        message: 'User verified successfully',
        userId: user.id,
      };
    } catch (error) {
      this.logger.error(
        `${this.verifyUser.name} got an Error: ${JSON.stringify(error)}`,
      );
      throw error;
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
