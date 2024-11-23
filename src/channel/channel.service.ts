import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtPayload } from 'jsonwebtoken';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class ChannelService {
  private readonly logger = new Logger(ChannelService.name);

  constructor(
    private prisma: PrismaService,
    private readonly httpService: HttpService,
  ) {}
  create(createChannelDto: CreateChannelDto) {
    return 'This action adds a new channel';
  }

  findAll() {
    return `This action returns all channel`;
  }

  findOne(id: number) {
    return `This action returns a #${id} channel`;
  }

  update(id: number, updateChannelDto: UpdateChannelDto) {
    return `This action updates a #${id} channel`;
  }

  remove(id: number) {
    return `This action removes a #${id} channel`;
  }

  async createChannel(body) {
    this.logger.log(
      `${this.createChannel.name} has been called | body: ${JSON.stringify(body)}`,
    );
    try {
      const { userId, workSpaceId, name, authToken } = body;

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      const workspace = await this.prisma.workSpace.findFirst({
        where: { id: workSpaceId },
        include: {
          Channel: true,
        },
      });
      if (!workspace) {
        throw new UnauthorizedException('Workspace not found');
      }
      const existingChannel = workspace.Channel.find((c) => c?.name === name);
      if (existingChannel) {
        throw new BadRequestException('Channel already exists');
      }
      const newChannel = await this.prisma.channel.create({
        data: {
          name: name,
          workSpaceId: workspace.id,
          userId: user.id,
          authToken: authToken,
        },
      });
      return {
        status: true,
        message: 'Channel created successfully',
        data: newChannel,
      };
    } catch (error) {
      this.logger.error(
        `${this.createChannel.name} got an Error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error: null,
      };
    }
  }

  async deleteChannel(channelId: string, user: JwtPayload) {
    this.logger.log(
      `${this.getMyChannels.name} has been called | channelId: ${channelId}}`,
    );

    try {
      const { userId } = user;
      const loggedInUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!loggedInUser) {
        throw new UnauthorizedException('User not found');
      }
      await this.prisma.channel.delete({
        where: { id: channelId },
      });
      return {
        status: true,
        message: 'Channels deleted successfully',
      };
    } catch (error) {
      this.logger.error(
        `${this.getMyChannels.name} got an Error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }

  async getAccessToken(authorizationToken: string) {
    const url = 'https://www.linkedin.com/oauth/v2/accessToken';
    const body = {
      grant_type: 'authorization_code',
      code: authorizationToken,
      client_id: process.env.LINKEDIN_SECRET_ID,
      client_secret: process.env.LINKEDIN_SECRET_KEY,
      redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    };

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
    };

    const formBody = new URLSearchParams(body);

    try {
      const response = await lastValueFrom(
        this.httpService.post(url, formBody, { headers }),
      );
      return {
        status: true,
        data: {
          accessToken: response.data.access_token,
        },
        message: 'Access token retrieved successfully.',
      };
    } catch (error) {
      console.error(
        'Error fetching access token:',
        error.response?.data || error.message,
      );
      throw error;
    }
  }

  async getMyChannels(workspaceId: string, user: JwtPayload) {
    this.logger.log(
      `${this.getMyChannels.name} has been called | workspaceId: ${workspaceId}, user: ${JSON.stringify(user)}}`,
    );
    try {
      const { userId } = user;
      const loggedInUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!loggedInUser) {
        throw new UnauthorizedException('User not found');
      }
      const workspace = await this.prisma.workSpace.findFirst({
        where: { id: workspaceId },
      });
      if (!workspace) {
        throw new UnauthorizedException('Workspace not found');
      }

      const myChannels = await this.prisma.channel.findMany({
        where: { workSpaceId: workspace.id },
      });
      return {
        status: true,
        message: 'Channels fetched successfully',
        data: myChannels,
      };
    } catch (error) {
      this.logger.error(
        `${this.getMyChannels.name} got an Error: ${JSON.stringify(error)}`,
      );
      return {
        status: false,
        message: error.message,
        error,
      };
    }
  }
}
