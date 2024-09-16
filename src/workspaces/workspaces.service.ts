/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { AddMemberDto, CreateWorkspaceDto } from './dto/create-workspace.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private jwtService: JwtService,
    private mailerService: MailerService, // Ensure this is added
  ) {}

  async createWorkSpace(createWorkspaceDto: CreateWorkspaceDto, user: User) {
    this.logger.log(
      `${this.createWorkSpace.name} has been called | createWorkspaceDto: ${JSON.stringify(createWorkspaceDto)}, user: ${JSON.stringify(user)}`,
    );
    try {
      // Create the workspace for the user
      const workspace = await this.prisma.workSpace.create({
        data: {
          ...createWorkspaceDto,
        },
      });

      // Assign the user as the creator of the workspace in the UserWorkSpace table
      await this.prisma.userWorkSpace.create({
        data: {
          userId: user.id,
          workSpaceId: workspace.id,
          role: 'CREATOR', // Enum value for the creator role
          isConfirmed: true,
        },
      });
    } catch (error) {
      this.logger.error(
        `${this.createWorkSpace.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  async update(id: string, updateWorkspaceDto: UpdateWorkspaceDto) {
    this.logger.log(
      `${this.update.name} has been called | id: ${id}, updateWorkspaceDto: ${JSON.stringify(updateWorkspaceDto)}`,
    );
    try {
      const workspace = await this.prisma.workSpace.update({
        where: { id },
        data: updateWorkspaceDto,
      });
      return {
        status: true,
        message: 'Workspace updated successfully',
        data: workspace,
      };
    } catch (error) {
      this.logger.error(
        `${this.update.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getUserWorkSpaces(userId: string) {
    this.logger.log(
      `${this.getUserWorkSpaces.name} has been called | userId: ${userId}`,
    );
    try {
      const userWorkspaces = await this.prisma.userWorkSpace.findMany({
        where: { userId, isConfirmed: true },
        include: {
          workSpace: true,
        },
      });

      const workSpaceData = await userWorkspaces.map((uw) => ({
        id: uw.workSpace.id,
        name: uw.workSpace.name,
        role: uw.role,
        isConfirmed: uw.isConfirmed,
        timeZone: uw.workSpace.timeZone,
        timeZoneOffset: uw.workSpace.timeZoneOffset,
        startDay: uw.workSpace.startDay,
        createdAt: uw.workSpace.createdAt,
        updatedAt: uw.workSpace.updatedAt,
      }));

      return {
        status: true,
        message: 'WorkSpace Fetched Succesfully',
        data: workSpaceData,
      };
    } catch (error) {
      this.logger.error(
        `${this.getUserWorkSpaces.name} has an error | error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async findOne(workspaceId: string, user: JwtPayload) {
    this.logger.log(
      `${this.findOne.name} has been called | workspaceId: ${workspaceId}`,
    );
    try {
      const { userId } = user;

      const userDetails = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          industry: true,
          isVerified: true,
          // WorkSpaces: true,
        },
      });

      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }

      const getWorkSpace = await this.prisma.workSpace.findUnique({
        where: { id: workspaceId },
      });

      if (!getWorkSpace) {
        throw new HttpException('WorkSpace not found', HttpStatus.NOT_FOUND);
      }

      const userWorkspaces = await this.prisma.userWorkSpace.findUnique({
        where: {
          userId_workSpaceId: {
            userId,
            workSpaceId: getWorkSpace.id,
          },
          isConfirmed: true,
        },
        include: {
          workSpace: true,
        },
      });

      const profileDetails = {
        workspace: {
          id: userWorkspaces.workSpace.id,
          name: userWorkspaces.workSpace.name,
          role: userWorkspaces.role,
          timeZone: userWorkspaces.workSpace.timeZone,
          timeZoneOffset: userWorkspaces.workSpace.timeZoneOffset,
          startDay: userWorkspaces.workSpace.startDay,
          createdAt: userWorkspaces.workSpace.createdAt,
          updatedAt: userWorkspaces.workSpace.updatedAt,
        },
        user: userDetails,
      };

      return {
        status: true,
        message: 'WorkSpace Fetched Succesfully',
        data: profileDetails,
      };
    } catch (error) {
      this.logger.error(
        `${this.findOne.name} has an error | error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async getMembersByWorkspace(workspaceId: string, user: JwtPayload) {
    this.logger.log(
      `${this.getMembersByWorkspace.name} has been called | workspaceId: ${workspaceId}, user: ${JSON.stringify(user)}}`,
    );
    try {
      const userDetails = await this.prisma.user.findUnique({
        where: { id: user.userId },
      });
      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.NOT_FOUND);
      }
      const workspace = await this.prisma.workSpace.findUnique({
        where: { id: workspaceId },
      });
      if (!workspace) {
        throw new HttpException('WorkSpace not found', HttpStatus.NOT_FOUND);
      }
      const members = await this.prisma.userWorkSpace.findMany({
        where: { workSpaceId: workspaceId },
        include: {
          user: true,
        },
      });
      const memberData = members.map((uw) => ({
        memberId: uw.user.id,
        // name: uw.user.name,
        username: uw.user.username,
        email: uw.user.email,
        role: uw.role,
        isConfirmed: uw.isConfirmed,
        id: uw.id,
        workSpaceId: uw.workSpaceId,
      }));
      return {
        status: true,
        message: 'Members fetched successfully',
        data: memberData,
      };
    } catch (error) {
      this.logger.error(
        `${this.getMembersByWorkspace.name} has an error | error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async updateMember(id: string, body: { role?: Role; isConfirmed?: boolean }) {
    this.logger.log(
      `${this.updateMember.name} has been called | id: ${id}, body: ${JSON.stringify(body)}`,
    );
    try {
      const updatedUserWorkSpace = await this.prisma.userWorkSpace.update({
        where: { id },
        data: { ...body },
        include: {
          user: true,
        },
      });
      const updatedData = {
        memberId: updatedUserWorkSpace.user.id,
        // name: updatedUserWorkSpace.user.name,
        username: updatedUserWorkSpace.user.username,
        email: updatedUserWorkSpace.user.email,
        role: updatedUserWorkSpace.role,
        isConfirmed: updatedUserWorkSpace.isConfirmed,
        id: updatedUserWorkSpace.id,
        workSpaceId: updatedUserWorkSpace.workSpaceId,
      };
      return {
        status: true,
        message: 'Member updated successfully',
        data: updatedData,
      };
    } catch (error) {
      this.logger.error(
        `${this.updateMember.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async removeMember(id: string) {
    this.logger.log(`${this.removeMember.name} has been called | id: ${id}`);
    try {
      await this.prisma.userWorkSpace.delete({
        where: { id },
      });
      return {
        status: true,
        message: 'Member removed successfully',
      };
    } catch (error) {
      this.logger.error(
        `${this.removeMember.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async addMember(workspaceId: string, addMemberDto: AddMemberDto) {
    this.logger.log(
      `${this.addMember.name} has been called | workspaceId: ${workspaceId}, addMemberDto: ${JSON.stringify(addMemberDto)}`,
    );
    try {
      if (addMemberDto.isMultiple) {
        if (addMemberDto.members.length > 0) {
          const resultData = [];
          for (const memberData of addMemberDto.members) {
            const existingUser = await this.prisma.user.findUnique({
              where: { id: memberData.userId },
              select: {
                id: true,
                username: true,
                email: true,
                industry: true,
                WorkSpaces: {
                  where: {
                    isConfirmed: true,
                  },
                },
              },
            });
            if (!existingUser) {
              throw new HttpException('User not found', HttpStatus.NOT_FOUND);
            }

            if (existingUser.WorkSpaces.length >= 2) {
              throw new HttpException(
                'You are already in two work spaces',
                HttpStatus.BAD_REQUEST,
              );
            }
            const existingUserWorkSpace =
              await this.prisma.userWorkSpace.findUnique({
                where: {
                  userId_workSpaceId: {
                    userId: existingUser.id,
                    workSpaceId: workspaceId,
                  },
                },
                include: {
                  user: true,
                  workSpace: true,
                },
              });
            if (existingUserWorkSpace) {
              if (existingUserWorkSpace.isConfirmed) {
                throw new HttpException(
                  'User already exists in this workspace',
                  HttpStatus.CONFLICT,
                );
              } else {
                resultData.push({
                  memberId: existingUserWorkSpace.user.id,
                  // name: existingUserWorkSpace.user.name,
                  username: existingUserWorkSpace.user.username,
                  email: existingUserWorkSpace.user.email,
                  role: existingUserWorkSpace.role,
                  isConfirmed: existingUserWorkSpace.isConfirmed,
                  id: existingUserWorkSpace.id,
                  workSpaceId: existingUserWorkSpace.workSpaceId,
                });
                const inviteToken = this.jwtService.sign(
                  {
                    memberId: existingUserWorkSpace.id,
                    userId: existingUserWorkSpace.userId,
                    workSpaceId: existingUserWorkSpace.workSpaceId,
                  },
                  { expiresIn: '7d' },
                );
                await this.mailerService.sendInviteEmail(
                  existingUserWorkSpace.user.email,
                  inviteToken,
                  existingUserWorkSpace.workSpace.name,
                );
              }
            } else {
              const member = await this.prisma.userWorkSpace.create({
                data: {
                  userId: existingUser.id,
                  workSpaceId: workspaceId,
                  role: memberData.role, // Enum value for the member role
                },
                include: {
                  user: true,
                  workSpace: true,
                },
              });
              resultData.push({
                memberId: member.user.id,
                // name: member.user.name,
                username: member.user.username,
                email: member.user.email,
                role: member.role,
                isConfirmed: member.isConfirmed,
                id: member.id,
                workSpaceId: member.workSpaceId,
              });
              const inviteToken = this.jwtService.sign(
                {
                  memberId: member.id,
                  userId: member.userId,
                  workSpaceId: member.workSpaceId,
                },
                { expiresIn: '7d' },
              );
              await this.mailerService.sendInviteEmail(
                member.user.email,
                inviteToken,
                member.workSpace.name,
              );
            }
          }
          return {
            status: true,
            message: 'Members added successfully',
            data: resultData,
          };
        }
      } else {
        const existingUser = await this.prisma.user.findUnique({
          where: { id: addMemberDto.members[0].userId },
          select: {
            id: true,
            username: true,
            email: true,
            industry: true,
            WorkSpaces: {
              where: {
                isConfirmed: true,
              },
            },
          },
        });
        if (!existingUser) {
          throw new HttpException('User not found', HttpStatus.NOT_FOUND);
        }
        if (existingUser.WorkSpaces.length >= 2) {
          throw new HttpException(
            'You are already in two work spaces',
            HttpStatus.BAD_REQUEST,
          );
        }

        const existingUserWorkSpace =
          await this.prisma.userWorkSpace.findUnique({
            where: {
              userId_workSpaceId: {
                userId: existingUser.id,
                workSpaceId: workspaceId,
              },
            },
            include: {
              user: true,
              workSpace: true,
            },
          });
        if (existingUserWorkSpace) {
          if (existingUserWorkSpace.isConfirmed) {
            throw new HttpException(
              'User already exists in this workspace',
              HttpStatus.CONFLICT,
            );
          } else {
            const inviteToken = this.jwtService.sign(
              {
                memberId: existingUserWorkSpace.id,
                userId: existingUserWorkSpace.userId,
                workSpaceId: existingUserWorkSpace.workSpaceId,
              },
              { expiresIn: '7d' },
            );
            await this.mailerService.sendInviteEmail(
              existingUserWorkSpace.user.email,
              inviteToken,
              existingUserWorkSpace.workSpace.name,
            );
            const resultData = {
              memberId: existingUserWorkSpace.user.id,
              // name: existingUserWorkSpace.user.name,
              username: existingUserWorkSpace.user.username,
              email: existingUserWorkSpace.user.email,
              role: existingUserWorkSpace.role,
              isConfirmed: existingUserWorkSpace.isConfirmed,
              id: existingUserWorkSpace.id,
              workSpaceId: existingUserWorkSpace.workSpaceId,
            };
            return {
              status: true,
              message: 'Member added successfully',
              data: resultData,
            };
          }
        } else {
          const member = await this.prisma.userWorkSpace.create({
            data: {
              userId: existingUser.id,
              workSpaceId: workspaceId,
              role: addMemberDto.members[0]?.role, // Enum value for the member role
            },
            include: {
              user: true,
              workSpace: true,
            },
          });
          const inviteToken = this.jwtService.sign(
            {
              memberId: member.id,
              userId: member.userId,
              workSpaceId: member.workSpaceId,
            },
            { expiresIn: '7d' },
          );
          await this.mailerService.sendInviteEmail(
            member.user.email,
            inviteToken,
            member.workSpace.name,
          );
          const resultData = {
            memberId: member.user.id,
            // name: member.user.name,
            username: member.user.username,
            email: member.user.email,
            role: member.role,
            isConfirmed: member.isConfirmed,
            id: member.id,
            workSpaceId: member.workSpaceId,
          };
          return {
            status: true,
            message: 'Member added successfully',
            data: resultData,
          };
        }
      }
    } catch (error) {
      this.logger.error(
        `${this.addMember.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async acceptInvite(token: string) {
    this.logger.log(
      `${this.acceptInvite.name} has been called | token: ${token}`,
    );
    try {
      const decodedToken = this.jwtService.verify(token);
      const { memberId, userId, workSpaceId } = decodedToken as {
        memberId: string;
        userId: string;
        workSpaceId: string;
      };

      const existingUserWorkSpace = await this.prisma.userWorkSpace.findUnique({
        where: {
          userId_workSpaceId: {
            userId,
            workSpaceId,
          },
        },
      });

      if (!existingUserWorkSpace) {
        throw new HttpException(
          'Invalid invite token',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const user = await this.prisma.user.findUnique({
        where: {
          id: userId,
        },
        select: {
          id: true,
          username: true,
          email: true,
          industry: true,
          WorkSpaces: {
            where: {
              isConfirmed: true,
            },
          },
        },
      });

      if (user.WorkSpaces.length >= 2) {
        throw new HttpException(
          'You are already in two work spaces',
          HttpStatus.BAD_REQUEST,
        );
      }

      const memberData = await this.prisma.userWorkSpace.findFirst({
        where: { id: memberId, isConfirmed: false },
        include: {
          user: true,
          workSpace: true,
        },
      });

      if (!memberData) {
        throw new HttpException(
          'Invite Link is Expired',
          HttpStatus.UNAUTHORIZED,
        );
      }

      await this.prisma.userWorkSpace.update({
        where: { id: existingUserWorkSpace.id },
        data: { isConfirmed: true },
      });

      return {
        status: true,
        message: 'Invite accepted successfully.',
      };
    } catch (error) {
      this.logger.error(
        `${this.acceptInvite.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
