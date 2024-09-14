import {
  CanActivate,
  ExecutionContext,
  Injectable,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WorkSpaceAdminGuard implements CanActivate {
  private readonly logger = new Logger(WorkSpaceAdminGuard.name);

  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // Check if user is present in the request
    if (!request.user) {
      this.logger.warn('No user found in request');
      return false;
    }

    const { workspaceId } = request.params;

    // Validate if workspaceId is present
    if (!workspaceId) {
      this.logger.warn('Workspace ID not provided in request params');
      return false;
    }

    try {
      // Fetch the user's role in the workspace
      const userWorkspaces = await this.prisma.userWorkSpace.findUnique({
        where: {
          userId_workSpaceId: {
            userId: request.user.userId,
            workSpaceId: workspaceId,
          },
        },
      });

      // If no user workspace association found
      if (!userWorkspaces) {
        this.logger.error(
          `User ${request.user.userId} does not belong to workspace ${workspaceId}`,
        );
        return false;
      }

      // Check if user has 'MEMBER' role and restrict their access
      if (userWorkspaces.role === 'MEMBER') {
        this.logger.error('Permission denied: User is a MEMBER');
        throw new HttpException(
          'You do not have permission to perform this action.',
          HttpStatus.FORBIDDEN,
        );
      }

      // If user is an admin or higher, allow access
      return true;
    } catch (error) {
      this.logger.error(
        `Error verifying user workspace role: ${error.message}`,
      );
      throw error;
    }
  }
}
