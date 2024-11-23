import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ChannelService } from './channel.service';
import { CreateChannelDto } from './dto/create-channel.dto';
import { UpdateChannelDto } from './dto/update-channel.dto';
import { LocalAuthGuard } from 'src/auth/local-auth.guard';
import { SocialMediaPlatform } from 'src/enum/SocialMediaPlatform';
import { WorkSpaceAdminGuard } from 'src/guards/workspace-admin.guard';

@Controller('channel')
export class ChannelController {
  constructor(private readonly channelService: ChannelService) {}

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChannelDto: UpdateChannelDto) {
    return this.channelService.update(+id, updateChannelDto);
  }

  @UseGuards(LocalAuthGuard, WorkSpaceAdminGuard)
  @Post('create-channel')
  async createChannel(
    @Body()
    body: {
      name: string;
      userId: string;
      workSpaceId: string;
      authToken: string;
    },
  ) {
    return await this.channelService.createChannel(body);
  }

  @UseGuards(LocalAuthGuard)
  @Delete('delete-channel/:channelId')
  async deleteChannel(@Param('channelId') channelId: string, @Req() req) {
    return await this.channelService.deleteChannel(channelId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Get('get-channels/:workspaceId')
  async getMyChannels(@Param('workspaceId') workspaceId: string, @Req() req) {
    return await this.channelService.getMyChannels(workspaceId, req.user);
  }

  @UseGuards(LocalAuthGuard)
  @Get('channel-enum')
  async getChannelEnum() {
    return {
      status: true,
      data: SocialMediaPlatform,
    };
  }
}
