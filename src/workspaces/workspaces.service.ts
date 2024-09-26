/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  AddMemberDto,
  CreateWorkspaceDto,
  MemberDto,
} from './dto/create-workspace.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'src/auth/jwt-payload.interface';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';
import { User } from '@prisma/client';
import { Role } from '@prisma/client';
import { MailerService } from 'src/mailer/mailer.service';
import { JwtService } from '@nestjs/jwt';
import { addDays, addMinutes, isAfter } from 'date-fns';

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
          email: user.email,
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

  async getUserWorkSpaces(
    userId: string,
    query: { limit?: number; offset?: number },
  ) {
    this.logger.log(
      `${this.getUserWorkSpaces.name} has been called | userId: ${userId}, query: ${JSON.stringify(query)}`,
    );

    try {
      const allWorkspaces = [];
      let creatorIncluded = false;

      // Only fetch the creator's workspace on the first call (offset = 0)
      if (+query.offset === 0) {
        const myWorkspace = await this.prisma.userWorkSpace.findFirst({
          where: {
            userId,
            role: 'CREATOR',
            isConfirmed: true,
          },
          include: {
            workSpace: true,
          },
        });
        if (myWorkspace) {
          allWorkspaces.push(myWorkspace); // Add the CREATOR workspace to the result
          creatorIncluded = true; // Set flag that the creator workspace was included
        }
      }

      const limit = query.limit
        ? Math.max(0, +query.limit - (creatorIncluded ? 1 : 0))
        : undefined; // Limit adjusted

      const offset = query.offset
        ? +query.offset > 0 && !creatorIncluded
          ? +query.offset - 1
          : +query.offset
        : 0; // Adjust offset if creator is not included

      // Fetch other workspaces excluding the 'CREATOR' one
      const otherWorkspaces = await this.prisma.userWorkSpace.findMany({
        where: {
          userId,
          role:
            query.limit && query.offset
              ? {
                  not: 'CREATOR',
                }
              : undefined,
          isConfirmed: true,
        },
        include: {
          workSpace: true,
        },
        take: limit && limit > 0 ? limit : undefined, // Take adjusted
        skip: offset && offset > 0 ? offset : undefined, // Skip adjusted,
        orderBy: query.limit && query.offset ? { updatedAt: 'asc' } : undefined,
      });

      // Add other workspaces to the result
      allWorkspaces.push(...otherWorkspaces);

      // If no limit and offset are provided, sort the data
      if (!query.limit && !query.offset) {
        allWorkspaces.sort((a, b) => {
          // Prioritize the 'CREATOR' role first
          if (a.role === 'CREATOR') return -1; // CREATOR comes first
          if (b.role === 'CREATOR') return 1;

          // Sort by invite acceptance date (updatedAt)
          return (
            new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
          ); // Earlier invite comes first
        });
      }

      const workSpaceData = allWorkspaces.map((uw) => ({
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
        message: 'WorkSpace Fetched Successfully',
        count: workSpaceData.length,
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
      `${this.findOne.name} has been called | workspaceId: ${workspaceId}, user: ${JSON.stringify(user)}`,
    );
    try {
      const { userId, email } = user;

      const userDetails = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          industry: true,
          isVerified: true,
          createdAt: true,
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
          userId_workSpaceId_email: {
            userId,
            workSpaceId: getWorkSpace.id,
            email,
          },
          isConfirmed: true,
        },
        include: {
          workSpace: true,
        },
      });

      this.logger.log(userWorkspaces);

      if (!userWorkspaces) {
        throw new HttpException(
          'You are not a part of this workspace',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Check if the user's createdAt is older than 3 days
      const createdAt = new Date(userDetails.createdAt);
      const threeDaysAgo = addMinutes(new Date(), -3);

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
        user: {
          ...userDetails,
          isFreeze: !userDetails.isVerified
            ? createdAt < threeDaysAgo
              ? true
              : false
            : false,
        },
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
        where: { workSpaceId: workspaceId, isConfirmed: true },
        include: {
          user: true,
        },
      });
      const memberData = members.map((uw) => ({
        memberId: uw?.user?.id,
        // name: uw.user.name,
        username: uw?.user?.username,
        email: uw?.user?.email || uw?.email,
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

  async updateMember(
    id: string,
    body: { role?: Role; isConfirmed?: boolean },
    loggedInUser: JwtPayload,
  ) {
    this.logger.log(
      `${this.updateMember.name} has been called | id: ${id}, body: ${JSON.stringify(body)}`,
    );
    try {
      const userDetails = await this.prisma.user.findUnique({
        where: { id: loggedInUser.userId },
      });
      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }
      const memberData = await this.prisma.userWorkSpace.findUnique({
        where: { id: id, isConfirmed: true },
      });
      if (!memberData) {
        throw new HttpException('Member not found', HttpStatus.BAD_REQUEST);
      }
      if (memberData.userId === userDetails.id) {
        throw new HttpException(
          'You cannot update yourself',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (memberData.role === 'CREATOR') {
        throw new HttpException(
          'You cannot update creator of workspace',
          HttpStatus.BAD_REQUEST,
        );
      }
      const updatedUserWorkSpace = await this.prisma.userWorkSpace.update({
        where: { id },
        data: { ...body, updatedAt: memberData.updatedAt },
        include: {
          user: true,
        },
      });
      const updatedData = {
        memberId: updatedUserWorkSpace?.user?.id,
        // name: updatedUserWorkSpace?.user?.name,
        username: updatedUserWorkSpace?.user?.username,
        email: updatedUserWorkSpace?.user?.email || updatedUserWorkSpace?.email,
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
      throw new BadRequestException(error.message);
    }
  }

  async removeMember(id: string, loggedInUser: JwtPayload) {
    this.logger.log(`${this.removeMember.name} has been called | id: ${id}`);
    try {
      const userDetails = await this.prisma.user.findUnique({
        where: { id: loggedInUser.userId },
      });
      if (!userDetails) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }
      const memberData = await this.prisma.userWorkSpace.findUnique({
        where: { id: id, isConfirmed: true },
      });
      if (!memberData) {
        throw new HttpException('Member not found', HttpStatus.BAD_REQUEST);
      }
      if (memberData.userId === userDetails.id) {
        throw new HttpException(
          'You cannot remove yourself',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (memberData.role === 'CREATOR') {
        throw new HttpException(
          'You cannot remove creator from workspace',
          HttpStatus.BAD_REQUEST,
        );
      }

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
      throw new BadRequestException(error.message);
    }
  }

  async addMember(
    workspaceId: string,
    addMemberDto: AddMemberDto,
    origin?: string,
  ) {
    this.logger.log(
      `${this.addMember.name} called | workspaceId: ${workspaceId}, addMemberDto: ${JSON.stringify(addMemberDto)}, origin: ${origin}`,
    );

    try {
      const membersToAdd: MemberDto[] = addMemberDto.isMultiple
        ? addMemberDto.members
        : [addMemberDto.members[0]];
      const resultData = await Promise.all(
        membersToAdd.map((memberData) =>
          this.processMember(workspaceId, memberData, origin),
        ),
      );

      return {
        status: true,
        message: 'Members added successfully',
        data: resultData.filter(Boolean), // Filter out undefined values (if any)
      };
    } catch (error) {
      this.logger.error(
        `${this.addMember.name} error | ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  private async processMember(
    workspaceId: string,
    memberData: MemberDto,
    origin?: string,
  ) {
    this.logger.log(
      `${this.processMember.name} called | workspaceId: ${workspaceId}, memberData: ${JSON.stringify(memberData)}, origin: ${origin}`,
    );
    const existingUser = await this.findUser(memberData.email);

    if (!existingUser) {
      // TODO: handle Signup Onboarding
      return await this.handleNewUserInvite(memberData, workspaceId, origin);
    } else {
      // this.checkWorkspaceLimit(existingUser);

      const existingUserWorkSpace = await this.findUserWorkspace(
        existingUser.id,
        workspaceId,
        existingUser.email,
      );

      if (existingUserWorkSpace) {
        return await this.handleExistingUserWorkspace(
          existingUserWorkSpace,
          origin,
        );
      } else {
        return await this.addNewUserToWorkspace(
          existingUser,
          workspaceId,
          memberData.role,
          origin,
        );
      }
    }
  }

  private async handleNewUserInvite(
    memberData: MemberDto,
    workspaceId: string,
    origin?: string,
  ) {
    this.logger.log(
      `${this.handleNewUserInvite.name} called | memberData: ${JSON.stringify(
        memberData,
      )}, origin: ${origin}, workspaceId: ${workspaceId}`,
    );
    // TODO: Send invite email
    const addNewUserToWorkspace = await this.prisma.userWorkSpace.create({
      data: {
        workSpaceId: workspaceId,
        role: memberData.role,
        email: memberData.email,
      },
      include: { user: true, workSpace: true },
    });

    await this.sendInvite(
      true,
      addNewUserToWorkspace.email,
      addNewUserToWorkspace.id,
      addNewUserToWorkspace.userId,
      addNewUserToWorkspace.workSpaceId,
      addNewUserToWorkspace.workSpace.name,
      origin,
    );

    return {
      memberId: addNewUserToWorkspace?.user?.id,
      username: addNewUserToWorkspace?.user?.username,
      email: addNewUserToWorkspace?.user?.email,
      role: addNewUserToWorkspace.role,
      isConfirmed: addNewUserToWorkspace.isConfirmed,
      id: addNewUserToWorkspace.id,
      workSpaceId: addNewUserToWorkspace.workSpaceId,
    };
  }

  private async findUser(email: string) {
    this.logger.log(`${this.findUser.name} called | email: ${email}}`);
    const user = await this.prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        username: true,
        email: true,
        industry: true,
        WorkSpaces: { where: { isConfirmed: true } },
      },
    });

    return user;
  }

  private checkWorkspaceLimit(user: any) {
    this.logger.log(
      `${this.processMember.name} called | user: ${JSON.stringify(user)}`,
    );
    if (user.WorkSpaces.length >= 2) {
      throw new HttpException(
        'User is already in two workspaces',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  private async findUserWorkspace(
    userId: string,
    workspaceId: string,
    email: string,
  ) {
    this.logger.log(
      `${this.findUserWorkspace.name} called | userId: ${userId}, workspaceId: ${workspaceId}}`,
    );
    return await this.prisma.userWorkSpace.findUnique({
      where: {
        userId_workSpaceId_email: { userId, workSpaceId: workspaceId, email },
      },
      include: { user: true, workSpace: true },
    });
  }

  private async handleExistingUserWorkspace(
    existingUserWorkSpace: any,
    origin?: string,
  ) {
    this.logger.log(
      `${this.handleExistingUserWorkspace.name} called | existingUserWorkSpace: ${JSON.stringify(
        existingUserWorkSpace,
      )}, origin: ${origin}`,
    );
    if (existingUserWorkSpace.isConfirmed) {
      throw new HttpException(
        'User already exists in this workspace',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Calculate the date 7 days ago from now
    const sevenDaysAgo = addDays(new Date(), -7);

    // Check if the existing invite was created or updated more than 7 days ago
    const inviteExpired =
      isAfter(sevenDaysAgo, existingUserWorkSpace.updatedAt) ||
      isAfter(sevenDaysAgo, existingUserWorkSpace.createdAt);

    if (inviteExpired) {
      this.logger.debug('Again Invited');
      await this.sendInvite(
        false,
        existingUserWorkSpace.user.email,
        existingUserWorkSpace.id,
        existingUserWorkSpace.userId,
        existingUserWorkSpace.workSpaceId,
        existingUserWorkSpace.workSpace.name,
        origin,
      );
      // Update the updatedAt field to the current date
      await this.prisma.userWorkSpace.update({
        where: { id: existingUserWorkSpace.id },
        data: { updatedAt: new Date() },
      });
    }

    return {
      memberId: existingUserWorkSpace.user.id,
      username: existingUserWorkSpace.user.username,
      email: existingUserWorkSpace.user.email,
      role: existingUserWorkSpace.role,
      isConfirmed: existingUserWorkSpace.isConfirmed,
      id: existingUserWorkSpace.id,
      workSpaceId: existingUserWorkSpace.workSpaceId,
    };
  }

  private async addNewUserToWorkspace(
    user: any,
    workspaceId: string,
    role: Role,
    origin?: string,
  ) {
    this.logger.log(
      `${this.addNewUserToWorkspace.name} called | user: ${JSON.stringify(user)}, workspaceId: ${workspaceId}, role: ${role}}, origin: ${origin}`,
    );
    const newUserWorkspace = await this.prisma.userWorkSpace.create({
      data: { userId: user.id, workSpaceId: workspaceId, role },
      include: { user: true, workSpace: true },
    });

    await this.sendInvite(
      false,
      newUserWorkspace.user.email,
      newUserWorkspace.id,
      newUserWorkspace.userId,
      newUserWorkspace.workSpaceId,
      newUserWorkspace.workSpace.name,
      origin,
    );

    return {
      memberId: newUserWorkspace.user.id,
      username: newUserWorkspace.user.username,
      email: newUserWorkspace.user.email,
      role: newUserWorkspace.role,
      isConfirmed: newUserWorkspace.isConfirmed,
      id: newUserWorkspace.id,
      workSpaceId: newUserWorkspace.workSpaceId,
    };
  }

  private async sendInvite(
    isSignUp: boolean,
    email: string,
    memberId: string,
    userId: string,
    workspaceId: string,
    workspaceName: string,
    origin?: string,
  ) {
    this.logger.log(
      `${this.sendInvite.name} called | params: ${JSON.stringify({
        isSignUp,
        email,
        memberId,
        userId,
        workspaceId,
        workspaceName,
        origin,
      })}`,
    );
    const inviteToken = this.jwtService.sign(
      { memberId, userId, workspaceId, email },
      { expiresIn: '7d' },
    );

    await this.mailerService.sendInviteEmail(
      isSignUp,
      email,
      inviteToken,
      workspaceName,
      origin,
    );
  }

  async acceptInvite(token: string) {
    this.logger.log(
      `${this.acceptInvite.name} has been called | token: ${token}`,
    );
    try {
      const decodedToken = this.jwtService.verify(token);
      const { memberId, userId, workspaceId, email } = decodedToken as {
        memberId: string;
        userId: string;
        workspaceId: string;
        email: string;
      };

      const user = await this.prisma.user.findUnique({
        where: {
          email,
        },
      });

      if (!user) {
        throw new BadRequestException('You are not Registered yet.');
      }

      const existingUserWorkSpace = await this.prisma.userWorkSpace.findUnique({
        where: {
          id: memberId,
        },
      });

      if (!existingUserWorkSpace) {
        throw new HttpException('Invalid invite token', HttpStatus.BAD_REQUEST);
      }

      if (existingUserWorkSpace.isConfirmed) {
        throw new HttpException(
          'Invite already accepted',
          HttpStatus.BAD_REQUEST,
        );
      }

      // const user = await this.prisma.user.findUnique({
      //   where: {
      //     id: userId,
      //   },
      //   select: {
      //     id: true,
      //     username: true,
      //     email: true,
      //     industry: true,
      //     WorkSpaces: {
      //       where: {
      //         isConfirmed: true,
      //       },
      //     },
      //   },
      // });

      // if (user.WorkSpaces.length >= 2) {
      //   await this.prisma.userWorkSpace.delete({
      //     where: { id: existingUserWorkSpace.id },
      //   });
      //   throw new HttpException(
      //     'You are already in two work spaces',
      //     HttpStatus.BAD_REQUEST,
      //   );
      // }

      await this.prisma.userWorkSpace.update({
        where: { id: existingUserWorkSpace.id },
        data: {
          isConfirmed: true,
          userId: user.id,
          updatedAt: new Date(),
        },
      });

      return {
        status: true,
        message: 'Invite accepted successfully.',
        workspaceId,
      };
    } catch (error) {
      this.logger.error(
        `${this.acceptInvite.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw error;
    }
  }
}
