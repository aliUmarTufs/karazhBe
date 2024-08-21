import { HttpException, HttpStatus, Injectable, Logger } from '@nestjs/common';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkspacesService {
  private readonly logger = new Logger(WorkspacesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async createWorkSpace(createWorkspaceDto: CreateWorkspaceDto, user: any) {
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
        },
      });
    } catch (error) {
      this.logger.error(
        `${this.createWorkSpace.name} has an error | error: ${JSON.stringify(error)}`,
      );
      throw new HttpException(error.message, HttpStatus.EXPECTATION_FAILED);
    }
  }

  async getUserWorkSpaces(userId: string) {
    this.logger.log(
      `${this.getUserWorkSpaces.name} has been called | userId: ${userId}`,
    );
    try {
      const userWorkspaces = await this.prisma.userWorkSpace.findMany({
        where: { userId },
        include: {
          workSpace: true,
        },
      });

      const workSpaceData = await userWorkspaces.map((uw) => ({
        id: uw.workSpace.id,
        name: uw.workSpace.name,
        role: uw.role,
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

  // findOne(id: number) {
  //   return `This action returns a #${id} workspace`;
  // }

  // update(id: number, updateWorkspaceDto: UpdateWorkspaceDto) {
  //   return `This action updates a #${id} workspace`;
  // }

  // remove(id: number) {
  //   return `This action removes a #${id} workspace`;
  // }
}
